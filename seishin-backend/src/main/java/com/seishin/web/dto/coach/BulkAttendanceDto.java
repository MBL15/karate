package com.seishin.web.dto.coach;

import com.seishin.domain.enums.AttendanceStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class BulkAttendanceDto {
    @NotNull
    private Long groupId;

    @NotNull
    private LocalDate sessionDate;

    private LocalTime startTime;

    @NotEmpty
    private List<AttendanceEntryDto> entries;

    @Data
    public static class AttendanceEntryDto {
        @NotNull
        private Long studentId;
        @NotNull
        private AttendanceStatus status;
    }
}
