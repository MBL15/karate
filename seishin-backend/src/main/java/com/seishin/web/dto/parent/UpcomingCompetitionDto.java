package com.seishin.web.dto.parent;

import com.seishin.domain.enums.RsvpStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class UpcomingCompetitionDto {
    private Long competitionId;
    private String name;
    private LocalDate eventDate;
    private RsvpStatus rsvpStatus;
}
