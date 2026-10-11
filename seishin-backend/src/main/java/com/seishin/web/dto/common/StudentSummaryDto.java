package com.seishin.web.dto.common;

import com.seishin.domain.enums.BeltAssignmentMode;
import com.seishin.domain.enums.RsvpStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class StudentSummaryDto {
    private Long id;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private int age;
    private String beltName;
    private String beltColor;
    /** null в режиме MANUAL */
    private Double progressPercent;
    private boolean guest;

    private BeltAssignmentMode beltAssignmentMode;
    private String progressLabel;
    private String nextBeltName;
    private String nextBeltColor;
    private Integer sessionsCompleted;
    private Integer sessionsRequired;
    private boolean maxRank;

    private LocalDate nextTrainingDate;
    private LocalTime nextTrainingStartTime;
    private String nextTrainingGroupName;
    private RsvpStatus nextTrainingIntent;
}
