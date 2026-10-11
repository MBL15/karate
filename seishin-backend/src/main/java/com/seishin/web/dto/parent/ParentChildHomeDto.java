package com.seishin.web.dto.parent;

import com.seishin.domain.enums.BeltAssignmentMode;
import com.seishin.web.dto.common.NextTrainingDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ParentChildHomeDto {
    private Long studentId;
    private String fullName;
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
    private NextTrainingDto nextTraining;
    private List<UpcomingCompetitionDto> upcomingCompetitions;
    private List<PaymentSummaryDto> recentPayments;
}
