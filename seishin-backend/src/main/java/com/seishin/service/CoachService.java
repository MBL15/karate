package com.seishin.service;

import com.seishin.domain.entity.*;
import com.seishin.domain.enums.AttendanceStatus;
import com.seishin.domain.enums.PaymentStatus;
import com.seishin.domain.enums.RsvpStatus;
import com.seishin.repository.*;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.coach.*;
import com.seishin.web.dto.common.StudentSummaryDto;
import com.seishin.web.exception.BadRequestException;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CoachService {

    private final StudentRepository studentRepository;
    private final TrainingGroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final GroupAssistantRepository groupAssistantRepository;
    private final TrainingSessionRepository sessionRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final BadgeDefinitionRepository badgeDefinitionRepository;
    private final StudentBadgeRepository studentBadgeRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final UserRepository userRepository;
    private final BeltLevelRepository beltLevelRepository;
    private final ClubRepository clubRepository;
    private final PaymentRepository paymentRepository;
    private final CompetitionRegistrationRepository registrationRepository;
    private final CoachAccessService coachAccessService;
    private final CoachNotificationService coachNotificationService;
    private final StudentMapper studentMapper;
    private final ProgressService progressService;
    private final ScheduleService scheduleService;
    private final StudentTrainingIntentRepository trainingIntentRepository;
    private final ClubDefaultsService clubDefaultsService;

    @Value("${seishin.invite.ttl-hours:24}")
    private int inviteTtlHours;

    private final SecureRandom random = new SecureRandom();

    @Transactional
    public CoachDashboardDto getDashboard(UserPrincipal coach) {
        Long clubId = coach.getClubId();
        List<Student> students = activeStudents(clubId);
        List<TrainingGroup> groups = groupRepository.findAccessibleByCoach(coach.getId());
        LocalDate today = LocalDate.now();
        LocalDate weekLater = today.plusDays(7);
        List<Student> birthdays = students.stream()
                .filter(s -> isBirthdayWithinWeek(s.getBirthDate(), today, weekLater))
                .toList();
        int pendingPayments = (int) paymentRepository.findByStudentClubId(clubId).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING || p.getStatus() == PaymentStatus.OVERDUE)
                .count();
        int pendingRsvps = (int) registrationRepository.countByCompetition_Club_IdAndRsvpStatus(clubId, RsvpStatus.PENDING);

        Club club = clubId == null ? null : clubRepository.findById(clubId).orElse(null);
        String clubName = club != null ? club.getName() : "Клуб";
        String joinCode = club != null ? ensureJoinCode(club) : null;

        return CoachDashboardDto.builder()
                .clubName(clubName)
                .joinCode(joinCode)
                .totalStudents(students.size())
                .totalGroups(groups.size())
                .upcomingBirthdays(birthdays.size())
                .pendingPayments(pendingPayments)
                .pendingCompetitionRsvps(pendingRsvps)
                .birthdayStudents(birthdays.stream().map(studentMapper::toSummary).toList())
                .groups(groups.stream().filter(g -> !g.isHidden()).map(g -> GroupSummaryDto.builder()
                        .id(g.getId())
                        .name(g.getName())
                        .studentCount(activeInGroup(g.getId()))
                        .assistantAccess(coachAccessService.isAssistant(coach, g))
                        .hidden(g.isHidden())
                        .build()).toList())
                .nextClass(scheduleService.findNextClass(coach))
                .build();
    }

    public List<StudentSummaryDto> listStudents(UserPrincipal coach) {
        return activeStudents(coach.getClubId()).stream()
                .map(studentMapper::toSummary)
                .toList();
    }

    @Transactional
    public void removeStudent(UserPrincipal coach, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик не найден"));
        if (coach.getClubId() == null || !student.getClub().getId().equals(coach.getClubId())) {
            throw new BadRequestException("Ученик другого клуба");
        }
        if (student.getLeftAt() != null) {
            return;
        }
        groupStudentRepository.deleteByStudentId(studentId);
        student.setLeftAt(Instant.now());
        studentRepository.save(student);
    }

    @Transactional
    public StudentSummaryDto createStudent(UserPrincipal coach, CreateStudentDto dto) {
        Club club = clubRepository.findById(coach.getClubId()).orElseThrow();
        BeltLevel belt = dto.getBeltLevelId() != null
                ? beltLevelRepository.findById(dto.getBeltLevelId()).orElse(null)
                : beltLevelRepository.findByClubIdOrderBySortOrderAsc(club.getId()).stream().findFirst().orElse(null);
        Student student = Student.builder()
                .club(club)
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .birthDate(dto.getBirthDate())
                .beltLevel(belt)
                .beltAssignedAt(Instant.now())
                .guest(dto.isGuest())
                .progressPercent(0)
                .build();
        student = studentRepository.save(student);
        progressService.recalculateProgress(student.getId());
        if (dto.getGroupId() != null) {
            TrainingGroup group = coachAccessService.requireGroupAccess(coach, dto.getGroupId());
            addStudentToGroupInternal(coach, student, group);
        }
        return studentMapper.toSummary(student);
    }

    @Transactional
    public void addStudentToGroup(UserPrincipal coach, Long groupId, Long studentId) {
        TrainingGroup group = coachAccessService.requireGroupAccess(coach, groupId);
        Student student = requireActiveClubStudent(coach, studentId);
        addStudentToGroupInternal(coach, student, group);
    }

    @Transactional
    public void removeStudentFromGroup(UserPrincipal coach, Long groupId, Long studentId) {
        coachAccessService.requireGroupAccess(coach, groupId);
        requireActiveClubStudent(coach, studentId);
        groupStudentRepository.deleteByGroupIdAndStudentId(groupId, studentId);
    }

    private void addStudentToGroupInternal(UserPrincipal coach, Student student, TrainingGroup group) {
        if (!student.getClub().getId().equals(group.getClub().getId())) {
            throw new BadRequestException("Ученик другого клуба");
        }
        if (groupStudentRepository.existsByGroupIdAndStudentId(group.getId(), student.getId())) {
            return;
        }
        groupStudentRepository.save(GroupStudent.builder().group(group).student(student).build());
        coachNotificationService.notifyStudentJoinedGroup(student, group, coach.getId());
    }

    private Student requireActiveClubStudent(UserPrincipal coach, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик не найден"));
        if (coach.getClubId() == null || !student.getClub().getId().equals(coach.getClubId())) {
            throw new BadRequestException("Ученик другого клуба");
        }
        if (student.getLeftAt() != null) {
            throw new BadRequestException("Ученик удалён из клуба");
        }
        return student;
    }

    public List<GroupSummaryDto> listGroups(UserPrincipal coach) {
        return groupRepository.findAccessibleByCoach(coach.getId()).stream()
                .map(g -> GroupSummaryDto.builder()
                        .id(g.getId())
                        .name(g.getName())
                        .studentCount(activeInGroup(g.getId()))
                        .assistantAccess(coachAccessService.isAssistant(coach, g))
                        .hidden(g.isHidden())
                        .build())
                .toList();
    }

    @Transactional
    public GroupSummaryDto updateGroup(UserPrincipal coach, Long groupId, UpdateGroupDto dto) {
        TrainingGroup group = coachAccessService.requireGroupAccess(coach, groupId);
        if (dto.getHidden() != null) {
            group.setHidden(dto.getHidden());
            groupRepository.save(group);
        }
        return GroupSummaryDto.builder()
                .id(group.getId())
                .name(group.getName())
                .studentCount(activeInGroup(group.getId()))
                .assistantAccess(coachAccessService.isAssistant(coach, group))
                .hidden(group.isHidden())
                .build();
    }

    @Transactional
    public StudentSummaryDto updateStudent(UserPrincipal coach, Long studentId, UpdateStudentDto dto) {
        Student student = requireActiveClubStudent(coach, studentId);
        if (dto.getCoachRecommendation() != null) {
            student.setCoachRecommendation(dto.getCoachRecommendation().isBlank() ? null : dto.getCoachRecommendation().trim());
            studentRepository.save(student);
        }
        return studentMapper.toSummary(student);
    }

    public List<StudentSummaryDto> listGroupStudents(UserPrincipal coach, Long groupId) {
        coachAccessService.requireGroupAccess(coach, groupId);
        return groupStudentRepository.findByGroupId(groupId).stream()
                .map(GroupStudent::getStudent)
                .filter(student -> student.getLeftAt() == null)
                .map(studentMapper::toSummary)
                .toList();
    }

    public List<BadgeDefinitionDto> listBadges(UserPrincipal coach) {
        Club club = clubRepository.findById(coach.getClubId()).orElseThrow(() -> new BadRequestException("Клуб не найден"));
        clubDefaultsService.ensurePresetBadges(club);
        return badgeDefinitionRepository.findByClubId(coach.getClubId()).stream()
                .map(b -> BadgeDefinitionDto.builder()
                        .id(b.getId())
                        .name(b.getName())
                        .description(b.getDescription())
                        .cumulative(b.isCumulative())
                        .requiredCount(b.getRequiredCount())
                        .build())
                .toList();
    }

    @Transactional
    public StudentSummaryDto assignBelt(UserPrincipal coach, Long studentId, AssignBeltDto dto) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик не найден"));
        if (!student.getClub().getId().equals(coach.getClubId())) {
            throw new BadRequestException("Ученик другого клуба");
        }
        BeltLevel belt = resolveBeltLevel(coach, dto);
        student.setBeltLevel(belt);
        student.setBeltAssignedAt(Instant.now());
        student.setProgressPercent(0);
        student = studentRepository.save(student);
        progressService.recalculateProgress(student.getId());
        return studentMapper.toSummary(studentRepository.findById(student.getId()).orElseThrow());
    }

    private BeltLevel resolveBeltLevel(UserPrincipal coach, AssignBeltDto dto) {
        if (dto.getBeltLevelId() != null) {
            BeltLevel belt = beltLevelRepository.findById(dto.getBeltLevelId())
                    .orElseThrow(() -> new NotFoundException("Пояс не найден"));
            if (!belt.getClub().getId().equals(coach.getClubId())) {
                throw new BadRequestException("Пояс другого клуба");
            }
            return belt;
        }
        String name = dto.getName() == null ? "" : dto.getName().trim();
        String color = dto.getColor() == null ? "" : dto.getColor().trim();
        if (name.isEmpty() || color.isEmpty() || dto.getSortOrder() == null) {
            throw new BadRequestException("Укажите beltLevelId или name, color и sortOrder");
        }
        return beltLevelRepository.findByClubIdAndName(coach.getClubId(), name)
                .orElseGet(() -> beltLevelRepository.save(BeltLevel.builder()
                        .club(clubRepository.getReferenceById(coach.getClubId()))
                        .name(name)
                        .color(color)
                        .sortOrder(dto.getSortOrder())
                        .sessionsRequired(24)
                        .build()));
    }

    public List<IssuedBadgeDto> listIssuedBadges(UserPrincipal coach) {
        return studentBadgeRepository.findByStudentClubIdOrderByIssuedAtDesc(coach.getClubId()).stream()
                .map(sb -> IssuedBadgeDto.builder()
                        .id(sb.getId())
                        .studentId(sb.getStudent().getId())
                        .badgeId(sb.getBadge().getId())
                        .badgeName(sb.getBadge().getName())
                        .issuedAt(sb.getIssuedAt())
                        .note(sb.getNote())
                        .build())
                .toList();
    }

    @Transactional
    public GroupSummaryDto createGroup(UserPrincipal coach, CreateGroupDto dto) {
        User coachUser = userRepository.findById(coach.getId()).orElseThrow();
        TrainingGroup group = TrainingGroup.builder()
                .club(coachUser.getClub())
                .name(dto.getName())
                .coach(coachUser)
                .build();
        group = groupRepository.save(group);
        return GroupSummaryDto.builder()
                .id(group.getId())
                .name(group.getName())
                .studentCount(0)
                .assistantAccess(false)
                .build();
    }

    public SessionAttendanceDto getSessionAttendance(
            UserPrincipal coach, Long groupId, LocalDate sessionDate, java.time.LocalTime startTime) {
        TrainingGroup group = coachAccessService.requireGroupAccess(coach, groupId);
        var sessionOpt = sessionRepository.findByGroupIdAndSessionDateAndStartTime(groupId, sessionDate, startTime);
        var students = groupStudentRepository.findByGroupId(groupId).stream()
                .map(GroupStudent::getStudent)
                .filter(student -> student.getLeftAt() == null)
                .toList();
        var recordsByStudent = sessionOpt
                .map(session -> attendanceRepository.findBySessionId(session.getId()).stream()
                        .collect(java.util.stream.Collectors.toMap(r -> r.getStudent().getId(), AttendanceRecord::getStatus)))
                .orElse(java.util.Map.of());

        var entries = students.stream()
                .map(student -> {
                    var intent = trainingIntentRepository.findByStudentIdAndGroupIdAndSessionDateAndStartTime(
                            student.getId(), groupId, sessionDate, startTime);
                    AttendanceStatus status = recordsByStudent.getOrDefault(student.getId(), AttendanceStatus.PRESENT);
                    return SessionAttendanceDto.EntryDto.builder()
                            .studentId(student.getId())
                            .studentName(student.getFirstName() + " " + student.getLastName())
                            .status(status)
                            .parentIntent(intent.map(StudentTrainingIntent::getStatus).orElse(null))
                            .build();
                })
                .toList();

        return SessionAttendanceDto.builder()
                .sessionId(sessionOpt.map(TrainingSession::getId).orElse(null))
                .groupId(group.getId())
                .sessionDate(sessionDate)
                .startTime(startTime)
                .entries(entries)
                .build();
    }

    @Transactional
    public void recordBulkAttendance(UserPrincipal coach, BulkAttendanceDto dto) {
        if (isUpcomingSession(dto.getSessionDate(), dto.getStartTime())) {
            throw new BadRequestException(
                    "До начала занятия доступны только ответы родителей — факт посещаемости отмечается после занятия");
        }
        TrainingGroup group = coachAccessService.requireGroupAccess(coach, dto.getGroupId());
        TrainingSession session = sessionRepository
                .findByGroupIdAndSessionDateAndStartTime(group.getId(), dto.getSessionDate(), dto.getStartTime())
                .orElseGet(() -> sessionRepository.save(TrainingSession.builder()
                        .group(group)
                        .sessionDate(dto.getSessionDate())
                        .startTime(dto.getStartTime())
                        .build()));

        for (BulkAttendanceDto.AttendanceEntryDto entry : dto.getEntries()) {
            Student student = studentRepository.findById(entry.getStudentId())
                    .orElseThrow(() -> new NotFoundException("Ученик не найден: " + entry.getStudentId()));
            if (!student.getClub().getId().equals(coach.getClubId())) {
                throw new BadRequestException("Ученик другого клуба");
            }
            if (entry.getStatus() == AttendanceStatus.GUEST && !student.isGuest()) {
                student.setGuest(true);
                studentRepository.save(student);
            }
            var record = attendanceRepository
                    .findBySessionIdAndStudentId(session.getId(), student.getId())
                    .orElseGet(() -> AttendanceRecord.builder()
                            .session(session)
                            .student(student)
                            .build());
            record.setStatus(entry.getStatus());
            if (entry.getStatus() == AttendanceStatus.ABSENT) {
                record.setAbsenceReason(trimReason(entry.getAbsenceReason()));
            } else {
                record.setAbsenceReason(null);
            }
            attendanceRepository.save(record);
            progressService.recalculateProgress(student.getId());
        }
    }

    private List<Student> activeStudents(Long clubId) {
        if (clubId == null) {
            return List.of();
        }
        return studentRepository.findByClubId(clubId).stream()
                .filter(student -> student.getLeftAt() == null)
                .toList();
    }

    private int activeInGroup(Long groupId) {
        return (int) groupStudentRepository.findByGroupId(groupId).stream()
                .filter(link -> link.getStudent().getLeftAt() == null)
                .count();
    }

    private static String trimReason(String reason) {
        if (reason == null) {
            return null;
        }
        String t = reason.trim();
        return t.isEmpty() ? null : t.substring(0, Math.min(32, t.length()));
    }

    private static boolean isUpcomingSession(LocalDate sessionDate, LocalTime startTime) {
        LocalDate today = LocalDate.now();
        if (sessionDate.isAfter(today)) {
            return true;
        }
        if (sessionDate.isBefore(today)) {
            return false;
        }
        return startTime.isAfter(LocalTime.now());
    }

    @Transactional
    public void issueBadge(UserPrincipal coach, IssueBadgeDto dto) {
        Student student = requireActiveClubStudent(coach, dto.getStudentId());
        BadgeDefinition badge = badgeDefinitionRepository.findById(dto.getBadgeId())
                .orElseThrow(() -> new NotFoundException("Бейдж не найден"));
        if (!badge.getClub().getId().equals(coach.getClubId())) {
            throw new BadRequestException("Бейдж другого клуба");
        }
        User coachUser = userRepository.findById(coach.getId()).orElseThrow();
        studentBadgeRepository.save(StudentBadge.builder()
                .student(student)
                .badge(badge)
                .issuedByCoach(coachUser)
                .issuedAt(Instant.now())
                .note(dto.getNote())
                .build());
        progressService.recalculateProgress(student.getId());
    }

    @Transactional
    public void revokeBadge(UserPrincipal coach, RevokeBadgeDto dto) {
        StudentBadge issued = studentBadgeRepository.findById(dto.getStudentBadgeId())
                .orElseThrow(() -> new NotFoundException("Выдача значка не найдена"));
        requireActiveClubStudent(coach, issued.getStudent().getId());
        studentBadgeRepository.delete(issued);
        progressService.recalculateProgress(issued.getStudent().getId());
    }

    @Transactional
    public InviteCodeResponseDto createInviteCode(UserPrincipal coach, CreateInviteCodeDto dto) {
        User coachUser = userRepository.findById(coach.getId()).orElseThrow();
        Club club = coachUser.getClub();
        if (club == null) {
            throw new BadRequestException("Тренер не привязан к клубу");
        }

        if (dto.getStudentId() == null) {
            String code = ensureJoinCode(club);
            return InviteCodeResponseDto.builder()
                    .code(code)
                    .clubName(club.getName())
                    .kind("CLUB")
                    .build();
        }

        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new NotFoundException("Ученик не найден"));
        if (!student.getClub().getId().equals(coach.getClubId())) {
            throw new BadRequestException("Ученик другого клуба");
        }

        String code;
        do {
            code = String.format("%06d", random.nextInt(1_000_000));
        } while (inviteCodeRepository.findByCodeAndActiveTrue(code).isPresent()
                || clubRepository.findByJoinCode(code).isPresent());

        Instant expiresAt = Instant.now().plus(inviteTtlHours, ChronoUnit.HOURS);
        InviteCode invite = InviteCode.builder()
                .code(code)
                .club(club)
                .student(student)
                .createdByCoach(coachUser)
                .expiresAt(expiresAt)
                .active(true)
                .build();
        inviteCodeRepository.save(invite);

        return InviteCodeResponseDto.builder()
                .code(code)
                .clubName(club.getName())
                .studentId(student.getId())
                .studentName(student.getFirstName() + " " + student.getLastName())
                .expiresAt(expiresAt)
                .kind("STUDENT")
                .build();
    }

    private String ensureJoinCode(Club club) {
        if (club.getJoinCode() != null && !club.getJoinCode().isBlank()) {
            return club.getJoinCode();
        }
        String code;
        do {
            code = String.format("%06d", random.nextInt(1_000_000));
        } while (clubRepository.findByJoinCode(code).isPresent()
                || inviteCodeRepository.findByCodeAndActiveTrue(code).isPresent());
        club.setJoinCode(code);
        return clubRepository.save(club).getJoinCode();
    }

    private boolean isBirthdayWithinWeek(LocalDate birthDate, LocalDate from, LocalDate to) {
        LocalDate birthdayThisYear = birthDate.withYear(from.getYear());
        if (birthdayThisYear.isBefore(from)) {
            birthdayThisYear = birthdayThisYear.plusYears(1);
        }
        return !birthdayThisYear.isBefore(from) && !birthdayThisYear.isAfter(to);
    }
}
