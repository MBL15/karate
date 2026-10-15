package com.seishin.service;

import com.seishin.domain.entity.*;
import com.seishin.domain.enums.Role;
import com.seishin.domain.enums.RsvpStatus;
import com.seishin.repository.*;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.common.StudentSummaryDto;
import com.seishin.web.dto.competition.RegistrationDto;
import com.seishin.web.dto.parent.*;
import com.seishin.web.exception.BadRequestException;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ParentService {

    private final ParentAccessService parentAccessService;
    private final ParentStudentLinkRepository linkRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionRegistrationRepository registrationRepository;
    private final PaymentRepository paymentRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final BadgeDefinitionRepository badgeDefinitionRepository;
    private final StudentBadgeRepository studentBadgeRepository;
    private final StudentMapper studentMapper;
    private final CompetitionService competitionService;
    private final StudentRepository studentRepository;
    private final BeltLevelRepository beltLevelRepository;
    private final UserRepository userRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final ClubRepository clubRepository;
    private final BeltProgressService beltProgressService;
    private final TrainingIntentService trainingIntentService;
    private final GroupStudentRepository groupStudentRepository;
    private final ClubDefaultsService clubDefaultsService;

    public List<StudentSummaryDto> listChildren(UserPrincipal parent) {
        return parentAccessService.linkedChildren(parent.getId()).stream()
                .filter(student -> student.getLeftAt() == null)
                .map(studentMapper::toSummary)
                .toList();
    }

    @Transactional
    public StudentSummaryDto createChild(UserPrincipal parent, CreateChildDto dto) {
        User parentUser = userRepository.findById(parent.getId())
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        Club club = resolveClubForNewChild(parent.getId(), dto.getInviteCode());
        leavePreviousClub(parent.getId(), dto.getFirstName().trim(), dto.getLastName().trim(), dto.getBirthDate(), club);
        BeltLevel belt = beltLevelRepository.findByClubIdOrderBySortOrderAsc(club.getId()).stream()
                .findFirst()
                .orElse(null);

        Student student = studentRepository.save(Student.builder()
                .club(club)
                .firstName(dto.getFirstName().trim())
                .lastName(dto.getLastName().trim())
                .birthDate(dto.getBirthDate())
                .beltLevel(belt)
                .beltAssignedAt(Instant.now())
                .guest(false)
                .progressPercent(0)
                .build());

        linkRepository.save(ParentStudentLink.builder()
                .parent(parentUser)
                .student(student)
                .build());

        return studentMapper.toSummary(student);
    }

    private void leavePreviousClub(Long parentId, String firstName, String lastName, LocalDate birthDate, Club nextClub) {
        for (Student existing : parentAccessService.linkedChildren(parentId)) {
            if (existing.getLeftAt() != null || existing.getClub().getId().equals(nextClub.getId())) {
                continue;
            }
            if (!existing.getFirstName().equalsIgnoreCase(firstName)
                    || !existing.getLastName().equalsIgnoreCase(lastName)
                    || !existing.getBirthDate().equals(birthDate)) {
                continue;
            }
            groupStudentRepository.deleteByStudentId(existing.getId());
            existing.setLeftAt(Instant.now());
            studentRepository.save(existing);
        }
    }

    private Club resolveClubForNewChild(Long parentId, String inviteCode) {
        if (inviteCode != null && !inviteCode.isBlank()) {
            return clubFromCode(inviteCode);
        }
        List<Student> existing = parentAccessService.linkedChildren(parentId).stream()
                .filter(student -> student.getLeftAt() == null)
                .toList();
        if (!existing.isEmpty()) {
            return existing.getFirst().getClub();
        }
        throw new BadRequestException("Укажите код приглашения от тренера");
    }

    private Club clubFromCode(String inviteCode) {
        String code = inviteCode.trim();
        if (!code.matches("\\d{6}")) {
            throw new BadRequestException("Код — 6 цифр");
        }
        Club byJoinCode = clubRepository.findByJoinCode(code).orElse(null);
        if (byJoinCode != null) {
            return byJoinCode;
        }
        InviteCode invite = inviteCodeRepository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new BadRequestException("Неверный или использованный код"));
        if (invite.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Код приглашения истёк");
        }
        if (invite.getStudent() != null) {
            throw new BadRequestException("Этот код для привязки к существующему ученику");
        }
        return invite.getClub();
    }

    public ParentChildHomeDto getChildHome(UserPrincipal parent, Long studentId) {
        Student student = parentAccessService.requireLinkedChild(parent, studentId);
        List<UpcomingCompetitionDto> competitions = competitionRepository
                .findByClubIdOrderByEventDateAsc(student.getClub().getId()).stream()
                .filter(c -> !c.getEventDate().isBefore(LocalDate.now()))
                .map(c -> {
                    RsvpStatus status = registrationRepository.findByCompetitionIdAndStudentId(c.getId(), studentId)
                            .map(CompetitionRegistration::getRsvpStatus)
                            .orElse(RsvpStatus.PENDING);
                    return UpcomingCompetitionDto.builder()
                            .competitionId(c.getId())
                            .name(c.getName())
                            .eventDate(c.getEventDate())
                            .rsvpStatus(status)
                            .build();
                }).toList();
        List<PaymentSummaryDto> payments = paymentRepository.findByStudentId(studentId).stream()
                .limit(5)
                .map(this::toPaymentSummary)
                .toList();
        BeltLevel belt = student.getBeltLevel();
        var beltProgress = beltProgressService.buildProgressView(student);
        var nextTraining = trainingIntentService.findNextTraining(student)
                .map(next -> trainingIntentService.withIntent(student, next))
                .orElse(null);
        return ParentChildHomeDto.builder()
                .studentId(studentId)
                .fullName(student.getFirstName() + " " + student.getLastName())
                .age(AgeCalculator.age(student.getBirthDate()))
                .beltName(belt != null ? belt.getName() : null)
                .beltColor(belt != null ? belt.getColor() : null)
                .progressPercent(beltProgress.getProgressPercent())
                .beltAssignmentMode(beltProgress.getBeltAssignmentMode())
                .progressLabel(beltProgress.getProgressLabel())
                .nextBeltName(beltProgress.getNextBeltName())
                .nextBeltColor(beltProgress.getNextBeltColor())
                .sessionsCompleted(beltProgress.getSessionsCompleted())
                .sessionsRequired(beltProgress.getSessionsRequired())
                .maxRank(beltProgress.isMaxRank())
                .nextTraining(nextTraining)
                .upcomingCompetitions(competitions)
                .recentPayments(payments)
                .build();
    }

    public ParentChildProfileDto getChildProfile(UserPrincipal parent, Long studentId) {
        Student student = parentAccessService.requireLinkedChild(parent, studentId);
        BeltLevel belt = student.getBeltLevel();
        var beltProgress = beltProgressService.buildProgressView(student);
        return ParentChildProfileDto.builder()
                .studentId(studentId)
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .birthDate(student.getBirthDate())
                .age(AgeCalculator.age(student.getBirthDate()))
                .beltName(belt != null ? belt.getName() : null)
                .beltColor(belt != null ? belt.getColor() : null)
                .progressPercent(beltProgress.getProgressPercent())
                .beltAssignmentMode(beltProgress.getBeltAssignmentMode())
                .progressLabel(beltProgress.getProgressLabel())
                .nextBeltName(beltProgress.getNextBeltName())
                .nextBeltColor(beltProgress.getNextBeltColor())
                .sessionsCompleted(beltProgress.getSessionsCompleted())
                .sessionsRequired(beltProgress.getSessionsRequired())
                .maxRank(beltProgress.isMaxRank())
                .coachRecommendation(student.getCoachRecommendation())
                .clubName(student.getClub().getName())
                .clubDescription(student.getClub().getDescription())
                .clubAddress(student.getClub().getAddress())
                .clubLogo(student.getClub().getLogo())
                .coachName(resolveCoachName(student.getClub().getId()))
                .build();
    }

    private String resolveCoachName(Long clubId) {
        return userRepository.findByClubIdAndRole(clubId, Role.COACH).stream()
                .map(User::getName)
                .findFirst()
                .orElse(null);
    }

    public List<AchievementDto> getAchievements(UserPrincipal parent, Long studentId) {
        Student student = parentAccessService.requireLinkedChild(parent, studentId);
        clubDefaultsService.ensurePresetBadges(student.getClub());
        List<BadgeDefinition> badges = badgeDefinitionRepository.findByClubId(student.getClub().getId());
        return badges.stream().map(b -> {
            long count = studentBadgeRepository.countByStudentIdAndBadgeId(studentId, b.getId());
            var last = studentBadgeRepository.findByStudentIdOrderByIssuedAtDesc(studentId).stream()
                    .filter(sb -> sb.getBadge().getId().equals(b.getId()))
                    .findFirst();
            return AchievementDto.builder()
                    .badgeId(b.getId())
                    .name(b.getName())
                    .description(b.getDescription())
                    .earnedCount((int) count)
                    .requiredCount(b.getRequiredCount())
                    .completed(count >= b.getRequiredCount())
                    .lastIssuedAt(last.map(StudentBadge::getIssuedAt).orElse(null))
                    .build();
        }).toList();
    }

    public List<HistoryEntryDto> getHistory(UserPrincipal parent, Long studentId) {
        parentAccessService.requireLinkedChild(parent, studentId);
        return attendanceRepository.findByStudentIdOrderBySessionSessionDateDesc(studentId).stream()
                .map(a -> HistoryEntryDto.builder()
                        .date(a.getSession().getSessionDate())
                        .groupName(a.getSession().getGroup().getName())
                        .status(a.getStatus())
                        .absenceReason(a.getAbsenceReason())
                        .build())
                .toList();
    }

    @Transactional
    public RegistrationDto respondCompetition(UserPrincipal parent, Long competitionId, CompetitionRsvpDto dto) {
        Student student = parentAccessService.requireLinkedChild(parent, dto.getStudentId());
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new NotFoundException("Соревнование не найдено"));
        if (!competition.getClub().getId().equals(student.getClub().getId())) {
            throw new NotFoundException("Соревнование не найдено");
        }
        CompetitionRegistration reg = registrationRepository
                .findByCompetitionIdAndStudentId(competitionId, dto.getStudentId())
                .orElse(CompetitionRegistration.builder()
                        .competition(competition)
                        .student(student)
                        .build());
        reg.setRsvpStatus(dto.getRsvpStatus());
        reg.setWeightKg(dto.getWeightKg());
        reg.setDiscipline(dto.getDiscipline());
        reg.setParentRespondedAt(Instant.now());
        if (dto.getRsvpStatus() == RsvpStatus.CONFIRMED && dto.getWeightKg() != null && dto.getDiscipline() != null) {
            reg.setAutoCategory(competitionService.computeCategory(student, dto.getWeightKg(), dto.getDiscipline()));
        }
        reg = registrationRepository.save(reg);
        return competitionService.toRegistrationDto(reg);
    }

    public List<UpcomingCompetitionDto> listCompetitionsForParent(UserPrincipal parent) {
        List<Student> children = parentAccessService.linkedChildren(parent.getId());
        if (children.isEmpty()) {
            return List.of();
        }
        Long clubId = children.getFirst().getClub().getId();
        return competitionRepository.findByClubIdOrderByEventDateAsc(clubId).stream()
                .map(c -> UpcomingCompetitionDto.builder()
                        .competitionId(c.getId())
                        .name(c.getName())
                        .eventDate(c.getEventDate())
                        .rsvpStatus(RsvpStatus.PENDING)
                        .build())
                .toList();
    }

    public List<CompetitionResultDto> getCompetitionResults(UserPrincipal parent, Long studentId) {
        Student student = parentAccessService.requireLinkedChild(parent, studentId);
        LocalDate today = LocalDate.now();
        return registrationRepository.findByStudentId(studentId).stream()
                .filter(r -> r.getResultPlace() != null)
                .filter(r -> !r.getCompetition().getEventDate().isAfter(today))
                .map(r -> CompetitionResultDto.builder()
                        .competitionId(r.getCompetition().getId())
                        .competitionName(r.getCompetition().getName())
                        .eventDate(r.getCompetition().getEventDate())
                        .place(r.getResultPlace())
                        .category(r.getResultCategory())
                        .build())
                .sorted((a, b) -> b.getEventDate().compareTo(a.getEventDate()))
                .toList();
    }

    private PaymentSummaryDto toPaymentSummary(Payment p) {
        return PaymentSummaryDto.builder()
                .id(p.getId())
                .periodLabel(p.getPeriodLabel())
                .description(p.getDescription())
                .amount(p.getAmount())
                .status(p.getStatus())
                .dueDate(p.getDueDate())
                .build();
    }
}
