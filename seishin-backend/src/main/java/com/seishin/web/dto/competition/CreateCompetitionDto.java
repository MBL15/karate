package com.seishin.web.dto.competition;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateCompetitionDto {
    @NotBlank
    private String name;

    @NotNull
    private LocalDate eventDate;

    private String location;

    private String description;
}
