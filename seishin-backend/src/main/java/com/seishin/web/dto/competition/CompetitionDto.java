package com.seishin.web.dto.competition;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class CompetitionDto {
    private Long id;
    private String name;
    private LocalDate eventDate;
    private String location;
    private String description;
    private List<RegistrationDto> registrations;
}
