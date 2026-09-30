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
    private final StudentMapper studentMapper;
    private final ProgressService progressService;
    private final ScheduleService scheduleService;

    @Value("${seishin.invite.ttl-hours:24}")
    private int inviteTtlHours;

    private final SecureRandom random = new SecureRandom();

    @Transactional
    public CoachDashboardDto getDashboard(UserPrincipal coach) {
        Long clubId = coach.getClubId();
        List<Student> students = studentRepository.findByClubId(clubId);
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

        return CoachDashboardDto.builder()
                .totalStudents(students.size())
                .totalGroups(groups.size())
                .upcomingBirthdays(birthdays.size())
                .pendingPayments(pendingPayments)
                .pendingCompetitionRsvps(pendingRsvps)
                .birthdayStudents(birthdays.stream().map(studentMapper::toSummary).toList())
                .groups(groups.stream().map(g -> GroupSummaryDto.builder()
                        .id(g.getId())
                        .name(g.getName())
                        .studentCount(groupStudentRepository.findByGroupId(g.getId()).size())
                        .assistantAccess(coachAccessService.isAssistant(coach, g))
                        .build()).toList())
                .nextClass(scheduleService.findNextClass(coach))
                .build();
    }

    public List<StudentSummaryDto> listStudents(UserPrincipal coach) {
        return studentRepository.findByClubId(coach.getClubId()).stream()
                .map(studentMapper::toSummary)
                .toList();
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
                .guest(dto.isGuest())
                .progressPercent(0)
                .build();
        student = studentRepository.save(student);
        if (dto.getGroupId() != null) {
            TrainingGroup group = coachAccessService.requireGroupAccess(coach, dto.getGroupId());
            groupStudentRepository.save(GroupStudent.builder().group(group).student(student).build());
        }
        return studentMapper.toSummary(student);
    }

    public List<GroupSummaryDto> listGroups(UserPrincipal coach) {
        return groupRepository.findAccessibleByCoach(coach.getId()).stream()
                .map(g -> GroupSummaryDto.builder()
                        .id(g.getId())
                        .name(g.getName())
                        .studentCount(groupStudentRepository.findByGroupId(g.getId()).size())
                        .assistantAccess(coachAccessService.isAssistant(coach, g))
                        .build())
                .toList();
    }

    public List<StudentSummaryDto> listGroupStudents(UserPrincipal coach, Long groupId) {
        coachAccessService.requireGroupAccess(coach, groupId);
        return groupStudentRepository.findByGroupId(groupId).stream()
                .map(gs -> studentMapper.toSummary(gs.getStudent()))
                .toList();
    }

    public List<BadgeDefinitionDto> listBadges(UserPrincipal coach) {
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
        BeltLevel belt = beltLevelRepository.findById(dto.getBeltLevelId())
                .orElseThrow(() -> new NotFoundException("Пояс не найден"));
        if (!belt.getClub().getId().equals(coach.getClubId())) {
            throw new BadRequestException("Пояс другого клуба");
        }
        student.setBeltLevel(belt);
        student = studentRepository.save(student);
        progressService.recalculateProgress(student.getId());
        return studentMapper.toSummary(student);
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
                .map(gs -> gs.getStudent())
                .toList();
        var recordsByStudent = sessionOpt
                .map(session -> attendanceRepository.findBySessionId(session.getId()).stream()
                        .collect(java.util.stream.Collectors.toMap(r -> r.getStudent().getId(), AttendanceRecord::getStatus)))
                .orElse(java.util.Map.of());

        var entries = students.stream()
                .map(student -> SessionAttendanceDto.EntryDto.builder()
                        .studentId(student.getId())
                        .studentName(student.getFirstName() + " " + student.getLastName())
                        .status(recordsByStudent.getOrDefault(student.getId(), AttendanceStatus.PRESENT))
                        .build())
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
            attendanceRepository.save(record);
            progressService.recalculateProgress(student.getId());
        }
    }

    @Transactional
    public void issueBadge(UserPrincipal coach, IssueBadgeDto dto) {
        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new NotFoundException("Ученик не найден"));
        if (!student.getClub().getId().equals(coach.getClubId())) {
            throw new BadRequestException("Ученик другого клуба");
        }
        BadgeDefinition badge = badgeDefinitionRepository.findById(dto.getBadgeId())
                .orElseThrow(() -> new NotFoundException("Бейдж не найден"));
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
    public InviteCodeResponseDto createInviteCode(UserPrincipal coach, CreateInviteCodeDto dto) {
        User coachUser = userRepository.findById(coach.getId()).orElseThrow();
        Club club = coachUser.getClub();
        if (club == null) {
            throw new BadRequestException("Тренер не привязан к клубу");
        }

        Student student = null;
        if (dto.getStudentId() != null) {
            student = studentRepository.findById(dto.getStudentId())
                    .orElseThrow(() -> new NotFoundException("Ученик не найден"));
            if (!student.getClub().getId().equals(coach.getClubId())) {
                throw new BadRequestException("Ученик другого клуба");
            }
        }

        String code;
        do {
            code = String.format("%06d", random.nextInt(1_000_000));
        } while (inviteCodeRepository.findByCodeAndActiveTrue(code).isPresent());

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
                .studentId(student != null ? student.getId() : null)
                .studentName(student != null ? student.getFirstName() + " " + student.getLastName() : null)
                .expiresAt(expiresAt)
                .kind(student != null ? "STUDENT" : "CLUB")
                .build();
    }

    private boolean isBirthdayWithinWeek(LocalDate birthDate, LocalDate from, LocalDate to) {
        LocalDate birthdayThisYear = birthDate.withYear(from.getYear());
        if (birthdayThisYear.isBefore(from)) {
            birthdayThisYear = birthdayThisYear.plusYears(1);
        }
        return !birthdayThisYear.isBefore(from) && !birthdayThisYear.isAfter(to);
    }
}
