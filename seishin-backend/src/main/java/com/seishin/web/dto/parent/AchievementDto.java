package com.seishin.web.dto.parent;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AchievementDto {
    private Long badgeId;
    private String name;
    private String description;
    private int earnedCount;
    private int requiredCount;
    private boolean completed;
    private Instant lastIssuedAt;
}
