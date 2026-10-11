package com.seishin.web.dto.parent;

import com.seishin.domain.enums.AttendanceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class HistoryEntryDto {
    private LocalDate date;
    private String groupName;
    private AttendanceStatus status;
}
