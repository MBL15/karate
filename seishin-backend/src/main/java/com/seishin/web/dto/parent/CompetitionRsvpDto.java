package com.seishin.web.dto.parent;

import com.seishin.domain.enums.Discipline;
import com.seishin.domain.enums.RsvpStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CompetitionRsvpDto {
    @NotNull
    private Long studentId;

    @NotNull
    private RsvpStatus rsvpStatus;

    private Double weightKg;

    private Discipline discipline;
}
