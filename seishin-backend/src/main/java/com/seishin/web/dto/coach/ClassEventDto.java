package com.seishin.web.dto.coach;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class ClassEventDto {
    private Long scheduleId;
    private Long groupId;
    private String groupName;
    private LocalDate date;
    private int weekday;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private int studentCount;
    private boolean today;
    private boolean upcoming;
}
