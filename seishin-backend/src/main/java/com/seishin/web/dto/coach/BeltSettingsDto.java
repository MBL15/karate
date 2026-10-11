package com.seishin.web.dto.coach;

import com.seishin.domain.enums.BeltAssignmentMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BeltSettingsDto {
    @NotNull
    private BeltAssignmentMode assignmentMode;

    @Min(1)
    @Max(500)
    private int sessionsRequired;

    private boolean autoPromote;
}
