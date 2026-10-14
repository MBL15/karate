package com.seishin.web.dto.coach;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionPlanDto {
    @NotNull
    private Long groupId;
    @NotNull
    private LocalDate sessionDate;
    @NotNull
    private LocalTime startTime;
    private String topicTitle;
    private String topicText;
}
