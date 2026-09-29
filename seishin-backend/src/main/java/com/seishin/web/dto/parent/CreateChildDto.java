package com.seishin.web.dto.parent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateChildDto {
    @NotBlank(message = "Укажите имя")
    private String firstName;

    @NotBlank(message = "Укажите фамилию")
    private String lastName;

    @NotNull(message = "Укажите дату рождения")
    private LocalDate birthDate;

    /** Обязателен при первом подключении к клубу */
    @Size(min = 6, max = 6, message = "Код приглашения — 6 цифр")
    private String inviteCode;
}
