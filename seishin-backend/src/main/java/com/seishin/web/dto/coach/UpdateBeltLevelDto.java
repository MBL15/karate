package com.seishin.web.dto.coach;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateBeltLevelDto {
    /** Занятий на этом поясе до следующего; null — клубная норма. */
    @Min(1)
    @Max(500)
    private Integer sessionsRequired;
}
