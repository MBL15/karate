package com.seishin.web.dto.coach;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class IssuedBadgeDto {
    private Long id;
    private Long studentId;
    private Long badgeId;
    private String badgeName;
    private Instant issuedAt;
    private String note;
}
