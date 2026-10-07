package com.seishin.web.dto.common;

import com.seishin.domain.enums.RsvpStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class NextTrainingDto {
    private Long groupId;
    private Long scheduleId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String groupName;
    private String location;
    /** PENDING — родитель ещё не отметился */
    private RsvpStatus intentStatus;
}
