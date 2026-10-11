package com.seishin.web.dto.parent;

import com.seishin.domain.enums.RsvpStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SetTrainingIntentDto {
    @NotNull
    private Long groupId;

    @NotNull
    private LocalDate sessionDate;

    @NotNull
    private LocalTime startTime;

    /** CONFIRMED — будет, DECLINED — не будет */
    @NotNull
    private RsvpStatus rsvpStatus;
}
