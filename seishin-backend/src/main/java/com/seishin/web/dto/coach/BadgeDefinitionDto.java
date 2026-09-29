package com.seishin.web.dto.coach;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BadgeDefinitionDto {
    private Long id;
    private String name;
    private String description;
    private boolean cumulative;
    private int requiredCount;
}
