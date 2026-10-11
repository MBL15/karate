package com.seishin.web.dto.coach;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class CreateScheduleDto {
    @NotNull
    private Long groupId;

    @Min(1)
    @Max(7)
    private int weekday;

    @NotNull
    private LocalTime startTime;

    private LocalTime endTime;
    private String location;
}
