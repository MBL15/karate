package com.seishin.web.dto.coach;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueBadgeDto {
    @NotNull
    private Long studentId;

    @NotNull
    private Long badgeId;

    private String note;
}
