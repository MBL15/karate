package com.seishin.service;

import com.seishin.domain.entity.BeltLevel;
import com.seishin.domain.entity.Student;
import com.seishin.web.dto.common.BeltProgressFields;
import com.seishin.web.dto.common.StudentSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StudentMapper {

    private final BeltProgressService beltProgressService;
    private final TrainingIntentService trainingIntentService;

    public StudentSummaryDto toSummary(Student student) {
        BeltLevel belt = student.getBeltLevel();
        BeltProgressFields progress = beltProgressService.buildProgressView(student);
        StudentSummaryDto.StudentSummaryDtoBuilder builder = StudentSummaryDto.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .birthDate(student.getBirthDate())
                .age(AgeCalculator.age(student.getBirthDate()))
                .beltName(belt != null ? belt.getName() : null)
                .beltColor(belt != null ? belt.getColor() : null)
                .progressPercent(progress.getProgressPercent())
                .guest(student.isGuest())
                .beltAssignmentMode(progress.getBeltAssignmentMode())
                .progressLabel(progress.getProgressLabel())
                .nextBeltName(progress.getNextBeltName())
                .nextBeltColor(progress.getNextBeltColor())
                .sessionsCompleted(progress.getSessionsCompleted())
                .sessionsRequired(progress.getSessionsRequired())
                .maxRank(progress.isMaxRank());

        trainingIntentService.findNextTraining(student).ifPresent(next -> {
            var withIntent = trainingIntentService.withIntent(student, next);
            builder
                    .nextTrainingDate(withIntent.getDate())
                    .nextTrainingStartTime(withIntent.getStartTime())
                    .nextTrainingGroupName(withIntent.getGroupName())
                    .nextTrainingIntent(withIntent.getIntentStatus());
        });

        return builder.build();
    }
}
