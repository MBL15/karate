package com.seishin.web.dto.common;

import com.seishin.domain.enums.BeltAssignmentMode;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BeltProgressFields {
    private BeltAssignmentMode beltAssignmentMode;
    private Double progressPercent;
    private String progressLabel;
    private String nextBeltName;
    private String nextBeltColor;
    private Integer sessionsCompleted;
    private Integer sessionsRequired;
    private boolean maxRank;
}
