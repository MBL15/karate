package com.seishin.web.dto.coach;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TrainingReminderDto {
    private Long studentId;
    private String studentName;
    private String parentName;
    private String parentPhone;
    private String groupName;
    private String date;
    private String time;
    private String message;
}
