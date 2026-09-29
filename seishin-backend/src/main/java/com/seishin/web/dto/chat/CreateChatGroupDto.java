package com.seishin.web.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateChatGroupDto {
    @NotBlank(message = "Укажите название группы")
    @Size(max = 120, message = "Название слишком длинное")
    private String name;

    /** Родители учеников из тренировочной группы будут добавлены автоматически. */
    private Long trainingGroupId;

    /** Дополнительные родители по id пользователя. */
    private List<Long> parentIds;
}
