package com.seishin.web.dto.competition;

import com.seishin.domain.enums.Discipline;
import com.seishin.domain.enums.RsvpStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegistrationDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private int age;
    private Double weightKg;
    private Discipline discipline;
    private RsvpStatus rsvpStatus;
    private String autoCategory;
    private String effectiveCategory;
}
