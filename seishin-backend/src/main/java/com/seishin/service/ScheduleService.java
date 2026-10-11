package com.seishin.service;

import com.seishin.domain.entity.*;
import com.seishin.repository.ClassScheduleRepository;
import com.seishin.repository.GroupStudentRepository;
import com.seishin.repository.ParentStudentLinkRepository;
import com.seishin.repository.TrainingGroupRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.coach.*;
import com.seishin.web.exception.BadRequestException;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private static final String[] WEEKDAY_LABELS = {
            "", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"
    };
    private static final DateTimeFormatter DATE_HUMAN =
            DateTimeFormatter.ofPattern("d MMMM", Locale.forLanguageTag("ru"));
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final ClassScheduleRepository scheduleRepository;
    private final TrainingGroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final ParentStudentLinkRepository linkRepository;
    private final CoachAccessService coachAccessService;

    @Transactional
    public List<ScheduleSlotDto> listSchedule(UserPrincipal coach) {
        ensureDefaults(coach);
        return scheduleRepository
                .findByGroupClubIdAndActiveTrueOrderByWeekdayAscStartTimeAsc(coach.getClubId())
                .stream()
                .map(this::toSlot)
                .toList();
    }

    @Transactional
    public ScheduleSlotDto createSlot(UserPrincipal coach, CreateScheduleDto dto) {
        TrainingGroup group = coachAccessService.requireGroupAccess(coach, dto.getGroupId());
        if (dto.getEndTime() != null && dto.getEndTime().isBefore(dto.getStartTime())) {
            throw new BadRequestException("Время окончания раньше начала");
        }
        ClassSchedule slot = ClassSchedule.builder()
                .group(group)
                .weekday(dto.getWeekday())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .location(blankToNull(dto.getLocation()))
                .active(true)
                .build();
        return toSlot(scheduleRepository.save(slot));
    }

    @Transactional
    public void deleteSlot(UserPrincipal coach, Long id) {
        ClassSchedule slot = scheduleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Слот расписания не найден"));
        coachAccessService.requireGroupAccess(coach, slot.getGroup().getId());
        slot.setActive(false);
        scheduleRepository.save(slot);
    }

    @Transactional
    public List<ClassEventDto> listClasses(UserPrincipal coach, LocalDate from, LocalDate to) {
        ensureDefaults(coach);
        LocalDate start = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate end = to != null ? to : start.withDayOfMonth(start.lengthOfMonth());
        if (end.isBefore(start)) {
            throw new BadRequestException("Неверный период календаря");
        }
        return expand(coach.getClubId(), start, end);
    }

    @Transactional
    public ClassEventDto findNextClass(UserPrincipal coach) {
        ensureDefaults(coach);
        LocalDate today = LocalDate.now();
        return expand(coach.getClubId(), today, today.plusDays(21)).stream()
                .filter(ClassEventDto::isUpcoming)
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public List<TrainingReminderDto> sendReminders(UserPrincipal coach, SendTrainingRemindersDto dto) {
        ensureDefaults(coach);
        LocalDate date = dto.getDate();
        int weekday = date.getDayOfWeek().getValue();
        List<ClassSchedule> matching = scheduleRepository
                .findByGroupClubIdAndActiveTrueOrderByWeekdayAscStartTimeAsc(coach.getClubId())
                .stream()
                .filter(slot -> slot.getWeekday() == weekday)
                .filter(slot -> dto.getScheduleId() == null || slot.getId().equals(dto.getScheduleId()))
                .toList();
        if (matching.isEmpty()) {
            throw new BadRequestException("На эту дату нет занятий в расписании");
        }

        List<TrainingReminderDto> reminders = new ArrayList<>();
        String dateLabel = date.format(DATE_HUMAN);
        for (ClassSchedule slot : matching) {
            String time = slot.getStartTime().format(TIME_FMT);
            String location = slot.getLocation() != null && !slot.getLocation().isBlank()
                    ? slot.getLocation()
                    : "зал клуба";
            String groupName = slot.getGroup().getName();
            for (GroupStudent member : groupStudentRepository.findByGroupId(slot.getGroup().getId())) {
                Student student = member.getStudent();
                String studentName = student.getFirstName() + " " + student.getLastName();
                List<ParentStudentLink> links = linkRepository.findByStudentId(student.getId());
                if (links.isEmpty()) {
                    reminders.add(TrainingReminderDto.builder()
                            .studentId(student.getId())
                            .studentName(studentName)
                            .groupName(groupName)
                            .date(date.toString())
                            .time(time)
                            .message("Karate Hub: " + student.getFirstName() + " — тренировка "
                                    + dateLabel + " в " + time + ", " + location + ". Родитель не привязан.")
                            .build());
                    continue;
                }
                for (ParentStudentLink link : links) {
                    User parent = link.getParent();
                    reminders.add(TrainingReminderDto.builder()
                            .studentId(student.getId())
                            .studentName(studentName)
                            .parentName(parent.getName())
                            .parentPhone(parent.getPhone())
                            .groupName(groupName)
                            .date(date.toString())
                            .time(time)
                            .message("Karate Hub: " + studentName + " — тренировка " + dateLabel
                                    + " в " + time + ", " + location + ". Ждём на татами!")
                            .build());
                }
            }
        }
        return reminders;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureDefaults(UserPrincipal coach) {
        if (coach.getClubId() == null) {
            return;
        }
        if (scheduleRepository.countByGroupClubId(coach.getClubId()) > 0) {
            return;
        }
        List<TrainingGroup> groups = groupRepository.findAccessibleByCoach(coach.getId());
        if (groups.isEmpty()) {
            return;
        }
        TrainingGroup group = groups.get(0);
        seedSlot(group, 1, LocalTime.of(17, 0), LocalTime.of(18, 0));
        seedSlot(group, 3, LocalTime.of(17, 0), LocalTime.of(18, 0));
        seedSlot(group, 5, LocalTime.of(17, 0), LocalTime.of(18, 0));
        seedSlot(group, 6, LocalTime.of(11, 0), LocalTime.of(12, 30));
    }

    private void seedSlot(TrainingGroup group, int weekday, LocalTime start, LocalTime end) {
        scheduleRepository.save(ClassSchedule.builder()
                .group(group)
                .weekday(weekday)
                .startTime(start)
                .endTime(end)
                .location("Зал Karate Hub")
                .active(true)
                .build());
    }

    private List<ClassEventDto> expand(Long clubId, LocalDate from, LocalDate to) {
        List<ClassSchedule> slots = scheduleRepository
                .findByGroupClubIdAndActiveTrueOrderByWeekdayAscStartTimeAsc(clubId);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        List<ClassEventDto> events = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            int weekday = date.getDayOfWeek().getValue();
            for (ClassSchedule slot : slots) {
                if (slot.getWeekday() != weekday) {
                    continue;
                }
                boolean upcoming = date.isAfter(today)
                        || (date.equals(today) && !slot.getStartTime().isBefore(now));
                events.add(toEvent(slot, date, today.equals(date), upcoming));
            }
        }
        return events;
    }

    private ScheduleSlotDto toSlot(ClassSchedule slot) {
        return ScheduleSlotDto.builder()
                .id(slot.getId())
                .groupId(slot.getGroup().getId())
                .groupName(slot.getGroup().getName())
                .weekday(slot.getWeekday())
                .weekdayLabel(weekdayLabel(slot.getWeekday()))
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .location(slot.getLocation())
                .studentCount(groupStudentRepository.findByGroupId(slot.getGroup().getId()).size())
                .build();
    }

    private ClassEventDto toEvent(ClassSchedule slot, LocalDate date, boolean today, boolean upcoming) {
        return ClassEventDto.builder()
                .scheduleId(slot.getId())
                .groupId(slot.getGroup().getId())
                .groupName(slot.getGroup().getName())
                .date(date)
                .weekday(slot.getWeekday())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .location(slot.getLocation())
                .studentCount(groupStudentRepository.findByGroupId(slot.getGroup().getId()).size())
                .today(today)
                .upcoming(upcoming)
                .build();
    }

    private static String weekdayLabel(int weekday) {
        if (weekday < 1 || weekday > 7) {
            return "";
        }
        return WEEKDAY_LABELS[weekday];
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
