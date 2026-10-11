package com.seishin.web.dto.payment;

import com.seishin.domain.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdatePaymentDto {
    @NotNull
    private PaymentStatus status;

    private LocalDate paidDate;
}
