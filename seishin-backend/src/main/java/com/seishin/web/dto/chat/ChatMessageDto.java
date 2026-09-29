package com.seishin.web.dto.chat;

import com.seishin.domain.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ChatMessageDto {
    private Long id;
    private Long studentId;
    private Long groupId;
    private Long senderId;
    private String senderName;
    private Role senderRole;
    private String body;
    private Instant sentAt;
    private boolean mine;
}
