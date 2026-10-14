package com.seishin.web.dto.coach;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegistrationResultDto {
    @NotNull
    @Min(0)
    @Max(3)
    private Integer place;
    private String category;
}
