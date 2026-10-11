package com.seishin.web.dto.auth;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CompleteProfileDto {
    @Size(max = 120)
    private String email;

    private LocalDate birthDate;

    @Min(0)
    @Max(80)
    private Integer experienceYears;

    @Size(max = 40)
    private String karateStyle;
}
