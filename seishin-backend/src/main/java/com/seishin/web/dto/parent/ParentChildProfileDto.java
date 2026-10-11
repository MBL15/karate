package com.seishin.web.dto.parent;

import com.seishin.domain.enums.BeltAssignmentMode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ParentChildProfileDto {
    private Long studentId;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private int age;
    private String beltName;
    private String beltColor;
    private Double progressPercent;
    private BeltAssignmentMode beltAssignmentMode;
    private String progressLabel;
    private String nextBeltName;
    private String nextBeltColor;
    private Integer sessionsCompleted;
    private Integer sessionsRequired;
    private boolean maxRank;
    private String coachRecommendation;
    private String clubName;
}
