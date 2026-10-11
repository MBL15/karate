package com.seishin.web.dto.coach;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SendTrainingRemindersDto {
    @NotNull
    private LocalDate date;

    private Long scheduleId;
}
