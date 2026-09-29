package com.seishin.seed;

import com.seishin.domain.entity.*;
import com.seishin.domain.enums.*;
import com.seishin.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final BeltLevelRepository beltLevelRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentLinkRepository linkRepository;
    private final TrainingGroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final TrainingSessionRepository sessionRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final BadgeDefinitionRepository badgeRepository;
    private final StudentBadgeRepository studentBadgeRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionRegistrationRepository registrationRepository;
    private final PaymentRepository paymentRepository;
    private final DocumentTemplateRepository documentRepository;
    private final ClassScheduleRepository classScheduleRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final ChatGroupMessageRepository chatGroupMessageRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (clubRepository.count() > 0) {
            return;
        }
        log.info("Seeding demo data for Karate Hub...");

        Club club = clubRepository.save(Club.builder().name("Karate Hub").build());

        User coach = userRepository.save(User.builder()
                .phone("+79001112233")
                .role(Role.COACH)
                .name("Алексей Орлов")
                .club(club)
                .build());

        User parent = userRepository.save(User.builder()
                .phone("+79004445566")
                .role(Role.PARENT)
                .name("Родитель Соколов")
                .build());

        BeltLevel white = beltLevelRepository.save(BeltLevel.builder().club(club).name("Белый").color("#FFFFFF").sortOrder(1).build());
        beltLevelRepository.save(BeltLevel.builder().club(club).name("Жёлтый").color("#FFD700").sortOrder(2).build());
        beltLevelRepository.save(BeltLevel.builder().club(club).name("Оранжевый").color("#FF8C00").sortOrder(3).build());
        beltLevelRepository.save(BeltLevel.builder().club(club).name("Зелёный").color("#228B22").sortOrder(4).build());

        Student mikhail = studentRepository.save(Student.builder()
                .club(club)
                .firstName("Михаил")
                .lastName("Соколов")
                .birthDate(LocalDate.of(2017, 3, 15))
                .beltLevel(white)
                .progressPercent(72.0)
                .coachRecommendation("Готов к экзамену на жёлтый пояс")
                .guest(false)
                .build());

        Student anya = studentRepository.save(Student.builder()
                .club(club)
                .firstName("Аня")
                .lastName("Соколова")
                .birthDate(LocalDate.of(2020, 7, 8))
                .beltLevel(white)
                .progressPercent(35.0)
                .guest(false)
                .build());

        linkRepository.save(ParentStudentLink.builder().parent(parent).student(mikhail).build());
        linkRepository.save(ParentStudentLink.builder().parent(parent).student(anya).build());

        TrainingGroup group = groupRepository.save(TrainingGroup.builder()
                .club(club)
                .name("Детская группа")
                .coach(coach)
                .build());

        groupStudentRepository.save(GroupStudent.builder().group(group).student(mikhail).build());
        groupStudentRepository.save(GroupStudent.builder().group(group).student(anya).build());

        classScheduleRepository.save(ClassSchedule.builder()
                .group(group).weekday(1)
                .startTime(LocalTime.of(17, 0)).endTime(LocalTime.of(18, 0))
                .location("Зал Karate Hub").active(true).build());
        classScheduleRepository.save(ClassSchedule.builder()
                .group(group).weekday(3)
                .startTime(LocalTime.of(17, 0)).endTime(LocalTime.of(18, 0))
                .location("Зал Karate Hub").active(true).build());
        classScheduleRepository.save(ClassSchedule.builder()
                .group(group).weekday(5)
                .startTime(LocalTime.of(17, 0)).endTime(LocalTime.of(18, 0))
                .location("Зал Karate Hub").active(true).build());
        classScheduleRepository.save(ClassSchedule.builder()
                .group(group).weekday(6)
                .startTime(LocalTime.of(11, 0)).endTime(LocalTime.of(12, 30))
                .location("Зал Karate Hub").active(true).build());

        TrainingSession session1 = sessionRepository.save(TrainingSession.builder()
                .group(group)
                .sessionDate(LocalDate.now().minusDays(3))
                .startTime(LocalTime.of(17, 0))
                .build());
        TrainingSession session2 = sessionRepository.save(TrainingSession.builder()
                .group(group)
                .sessionDate(LocalDate.now().minusDays(1))
                .startTime(LocalTime.of(17, 0))
                .build());

        attendanceRepository.save(AttendanceRecord.builder().session(session1).student(mikhail).status(AttendanceStatus.PRESENT).build());
        attendanceRepository.save(AttendanceRecord.builder().session(session1).student(anya).status(AttendanceStatus.PRESENT).build());
        attendanceRepository.save(AttendanceRecord.builder().session(session2).student(mikhail).status(AttendanceStatus.PRESENT).build());
        attendanceRepository.save(AttendanceRecord.builder().session(session2).student(anya).status(AttendanceStatus.ABSENT).build());

        badgeRepository.save(BadgeDefinition.builder()
                .club(club)
                .name("Посещаемость")
                .description("10 тренировок подряд")
                .cumulative(true)
                .requiredCount(10)
                .build());
        BadgeDefinition disciplineBadge = badgeRepository.save(BadgeDefinition.builder()
                .club(club)
                .name("Дисциплина")
                .description("Отличное поведение на татами")
                .cumulative(false)
                .requiredCount(1)
                .build());

        studentBadgeRepository.save(StudentBadge.builder()
                .student(mikhail)
                .badge(disciplineBadge)
                .issuedByCoach(coach)
                .issuedAt(Instant.now().minus(10, ChronoUnit.DAYS))
                .note("Отличная работа на тренировке")
                .build());

        Competition competition = competitionRepository.save(Competition.builder()
                .club(club)
                .name("Кубок Karate Hub 2026")
                .eventDate(LocalDate.of(2026, 10, 12))
                .location("Спорткомплекс Karate Hub")
                .description("Ежегодный клубный турнир")
                .build());

        registrationRepository.save(CompetitionRegistration.builder()
                .competition(competition)
                .student(mikhail)
                .weightKg(32.0)
                .discipline(Discipline.KATA)
                .rsvpStatus(RsvpStatus.CONFIRMED)
                .autoCategory("9-10 / 30-34 / KATA")
                .parentRespondedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build());

        paymentRepository.save(Payment.builder()
                .student(mikhail)
                .parent(parent)
                .amount(new BigDecimal("3500"))
                .periodLabel("Сентябрь 2025")
                .description("Абонемент")
                .status(PaymentStatus.PAID)
                .dueDate(LocalDate.of(2025, 9, 5))
                .paidDate(LocalDate.of(2025, 9, 3))
                .build());
        paymentRepository.save(Payment.builder()
                .student(mikhail)
                .parent(parent)
                .amount(new BigDecimal("3500"))
                .periodLabel("Август 2025")
                .description("Абонемент")
                .status(PaymentStatus.PAID)
                .dueDate(LocalDate.of(2025, 8, 5))
                .paidDate(LocalDate.of(2025, 8, 1))
                .build());
        paymentRepository.save(Payment.builder()
                .student(mikhail)
                .parent(parent)
                .amount(new BigDecimal("1800"))
                .periodLabel("Кубок Karate Hub 2026")
                .description("Взнос за соревнование")
                .status(PaymentStatus.PENDING)
                .dueDate(LocalDate.of(2026, 10, 1))
                .build());

        documentRepository.save(DocumentTemplate.builder()
                .club(club)
                .title("Согласие на участие")
                .type(DocumentType.TEXT)
                .content("Шаблон согласия на участие в соревнованиях клуба Karate Hub.\n\nЯ, ___________, даю согласие на участие моего ребёнка...")
                .build());
        documentRepository.save(DocumentTemplate.builder()
                .club(club)
                .title("Медицинская справка (PDF placeholder)")
                .type(DocumentType.PDF)
                .content("%PDF-1.4 placeholder - скачайте бланк медицинской справки у тренера")
                .build());

        Instant chatBase = Instant.now().minus(2, ChronoUnit.DAYS);
        chatMessageRepository.save(ChatMessage.builder()
                .student(mikhail)
                .sender(coach)
                .body("Здравствуйте! Михаил отлично потренировался на этой неделе.")
                .sentAt(chatBase)
                .build());
        chatMessageRepository.save(ChatMessage.builder()
                .student(mikhail)
                .sender(parent)
                .body("Спасибо! Подскажите, когда следующая аттестация?")
                .sentAt(chatBase.plus(1, ChronoUnit.HOURS))
                .build());
        chatMessageRepository.save(ChatMessage.builder()
                .student(mikhail)
                .sender(coach)
                .body("Планируем через 3–4 недели. Продолжайте посещать занятия по средам и пятницам.")
                .sentAt(chatBase.plus(2, ChronoUnit.HOURS))
                .build());

        ChatGroup parentsGroup = chatGroupRepository.save(ChatGroup.builder()
                .name("Родители · Детская группа")
                .club(club)
                .createdBy(coach)
                .createdAt(chatBase.minus(1, ChronoUnit.DAYS))
                .build());
        chatGroupMemberRepository.save(ChatGroupMember.builder().group(parentsGroup).user(coach).build());
        chatGroupMemberRepository.save(ChatGroupMember.builder().group(parentsGroup).user(parent).build());
        chatGroupMessageRepository.save(ChatGroupMessage.builder()
                .group(parentsGroup)
                .sender(coach)
                .body("Добро пожаловать в общий чат группы! Здесь будем делиться новостями и объявлениями.")
                .sentAt(chatBase.minus(20, ChronoUnit.HOURS))
                .build());
        chatGroupMessageRepository.save(ChatGroupMessage.builder()
                .group(parentsGroup)
                .sender(parent)
                .body("Спасибо! Очень удобно, что всё в одном месте.")
                .sentAt(chatBase.minus(18, ChronoUnit.HOURS))
                .build());

        log.info("Demo data seeded: coach +79001112233, parent +79004445566");
    }
}
