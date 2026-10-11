package com.seishin.web.dto.coach;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class InviteCodeResponseDto {
    private String code;
    private String clubName;
    private Long studentId;
    private String studentName;
    private Instant expiresAt;
    /** CLUB = код для регистрации ребёнка родителем, STUDENT = привязка к ученику */
    private String kind;
}
