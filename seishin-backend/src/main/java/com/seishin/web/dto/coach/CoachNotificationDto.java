package com.seishin.web.dto.coach;

import com.seishin.domain.enums.CoachNotificationKind;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class CoachNotificationDto {
    Long id;
    CoachNotificationKind kind;
    String title;
    String body;
    Long studentId;
    Long groupId;
    Instant readAt;
    Instant createdAt;
}
