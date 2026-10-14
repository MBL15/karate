package com.seishin.web.dto.parent;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class CompetitionResultDto {
    private Long competitionId;
    private String competitionName;
    private LocalDate eventDate;
    private Integer place;
    private String category;
}
