package com.seishin.web.dto.coach;

import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;

@Data
@Builder
public class ScheduleSlotDto {
    private Long id;
    private Long groupId;
    private String groupName;
    private int weekday;
    private String weekdayLabel;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private int studentCount;
}
