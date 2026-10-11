package com.seishin.web.dto.coach;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GroupSummaryDto {
    private Long id;
    private String name;
    private int studentCount;
    private boolean assistantAccess;
}
