package com.seishin.web.dto.coach;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignBeltDto {
    @NotNull
    private Long beltLevelId;
}
