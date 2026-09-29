package com.seishin.web.dto.chat;

import com.seishin.domain.enums.ChatThreadKind;
import com.seishin.domain.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ChatThreadDto {
    private ChatThreadKind kind;
    private Long studentId;
    private Long groupId;
    private String title;
    private String subtitle;
    private Integer memberCount;
    private String lastMessage;
    private Instant lastMessageAt;
    private Role lastSenderRole;

    /** @deprecated use {@link #title} */
    @Deprecated
    public String getStudentName() {
        return title;
    }

    /** @deprecated use {@link #subtitle} */
    @Deprecated
    public String getParentName() {
        return subtitle;
    }
}
