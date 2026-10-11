package com.seishin.web.dto.coach;

import com.seishin.domain.enums.AttendanceStatus;
import com.seishin.domain.enums.RsvpStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class SessionAttendanceDto {
    private Long sessionId;
    private Long groupId;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private List<EntryDto> entries;

    @Data
    @Builder
    public static class EntryDto {
        private Long studentId;
        private String studentName;
        private AttendanceStatus status;
        /** Ответ родителя на ближайшую тренировку (если есть для этой даты/времени). */
        private RsvpStatus parentIntent;
    }
}
