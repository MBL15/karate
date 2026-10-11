package com.seishin.web.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendChatMessageDto {
    @NotBlank(message = "Сообщение не может быть пустым")
    @Size(max = 2000, message = "Сообщение слишком длинное")
    private String body;
}
