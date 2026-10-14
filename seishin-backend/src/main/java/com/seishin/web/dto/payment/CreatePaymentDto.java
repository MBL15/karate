package com.seishin.web.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreatePaymentDto {
    @NotNull
    private Long studentId;
    /** Первый день месяца, например 2026-03-01 */
    @NotNull
    private LocalDate month;
    private String description;
}
