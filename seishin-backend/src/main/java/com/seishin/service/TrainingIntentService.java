package com.seishin.service;

import com.seishin.domain.entity.*;
import com.seishin.domain.enums.RsvpStatus;
import com.seishin.repository.ClassScheduleRepository;
import com.seishin.repository.GroupStudentRepository;
import com.seishin.repository.StudentTrainingIntentRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.common.NextTrainingDto;
import com.seishin.web.dto.parent.SetTrainingIntentDto;
import com.seishin.web.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingIntentService {

    private final ClassScheduleRepository scheduleRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final StudentTrainingIntentRepository intentRepository;
    private final ParentAccessService parentAccessService;

    public Optional<NextTrainingDto> findNextTraining(Student student) {
        Set<Long> groupIds = groupStudentRepository.findByStudentId(student.getId()).stream()
                .map(gs -> gs.getGroup().getId())
                .collect(Collectors.toSet());
        if (groupIds.isEmpty()) {
            return Optional.empty();
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalDate to = today.plusDays(21);

        List<NextTrainingDto> upcoming = scheduleRepository
                .findByGroupClubIdAndActiveTrueOrderByWeekdayAscStartTimeAsc(student.getClub().getId())
                .stream()
                .filter(slot -> groupIds.contains(slot.getGroup().getId()))
                .flatMap(slot -> expandSlot(slot, today, to, now).stream())
                .sorted(Comparator.comparing(NextTrainingDto::getDate).thenComparing(NextTrainingDto::getStartTime))
                .toList();

        return upcoming.stream().findFirst();
    }

    public RsvpStatus resolveIntentStatus(Student student, NextTrainingDto training) {
        return intentRepository
                .findByStudentIdAndGroupIdAndSessionDateAndStartTime(
                        student.getId(), training.getGroupId(), training.getDate(), training.getStartTime())
                .map(StudentTrainingIntent::getStatus)
                .orElse(RsvpStatus.PENDING);
    }

    public NextTrainingDto withIntent(Student student, NextTrainingDto training) {
        RsvpStatus status = resolveIntentStatus(student, training);
        return NextTrainingDto.builder()
                .groupId(training.getGroupId())
                .scheduleId(training.getScheduleId())
                .date(training.getDate())
                .startTime(training.getStartTime())
                .endTime(training.getEndTime())
                .groupName(training.getGroupName())
                .location(training.getLocation())
                .intentStatus(status)
                .build();
    }

    @Transactional
    public NextTrainingDto setIntent(UserPrincipal parent, Long studentId, SetTrainingIntentDto dto) {
        Student student = parentAccessService.requireLinkedChild(parent, studentId);
        if (dto.getRsvpStatus() != RsvpStatus.CONFIRMED && dto.getRsvpStatus() != RsvpStatus.DECLINED) {
            throw new BadRequestException("Укажите: будет (CONFIRMED) или не будет (DECLINED)");
        }

        NextTrainingDto next = findNextTraining(student)
                .orElseThrow(() -> new BadRequestException("Нет предстоящих тренировок в расписании"));

        if (!next.getGroupId().equals(dto.getGroupId())
                || !next.getDate().equals(dto.getSessionDate())
                || !next.getStartTime().equals(dto.getStartTime())) {
            throw new BadRequestException("Можно отметить только ближайшую тренировку");
        }

        if (!groupStudentRepository.findByStudentId(student.getId()).stream()
                .anyMatch(gs -> gs.getGroup().getId().equals(dto.getGroupId()))) {
            throw new BadRequestException("Ребёнок не в этой группе");
        }

        TrainingGroup group = groupStudentRepository.findByStudentId(student.getId()).stream()
                .map(GroupStudent::getGroup)
                .filter(g -> g.getId().equals(dto.getGroupId()))
                .findFirst()
                .orElseThrow();

        StudentTrainingIntent intent = intentRepository
                .findByStudentIdAndGroupIdAndSessionDateAndStartTime(
                        studentId, dto.getGroupId(), dto.getSessionDate(), dto.getStartTime())
                .orElseGet(() -> StudentTrainingIntent.builder()
                        .student(student)
                        .group(group)
                        .sessionDate(dto.getSessionDate())
                        .startTime(dto.getStartTime())
                        .build());

        intent.setStatus(dto.getRsvpStatus());
        intent.setUpdatedAt(Instant.now());
        intentRepository.save(intent);

        return withIntent(student, next);
    }

    private List<NextTrainingDto> expandSlot(ClassSchedule slot, LocalDate from, LocalDate to, LocalTime now) {
        List<NextTrainingDto> list = new java.util.ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            if (date.getDayOfWeek().getValue() != slot.getWeekday()) {
                continue;
            }
            boolean upcoming = date.isAfter(from)
                    || (date.equals(from) && !slot.getStartTime().isBefore(now));
            if (!upcoming) {
                continue;
            }
            list.add(NextTrainingDto.builder()
                    .scheduleId(slot.getId())
                    .groupId(slot.getGroup().getId())
                    .groupName(slot.getGroup().getName())
                    .date(date)
                    .startTime(slot.getStartTime())
                    .endTime(slot.getEndTime())
                    .location(slot.getLocation())
                    .intentStatus(RsvpStatus.PENDING)
                    .build());
        }
        return list;
    }
}
