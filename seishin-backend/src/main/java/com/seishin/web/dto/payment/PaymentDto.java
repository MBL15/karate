package com.seishin.web.dto.payment;

import com.seishin.domain.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class PaymentDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private String periodLabel;
    private String description;
    private BigDecimal amount;
    private PaymentStatus status;
    private LocalDate dueDate;
    private LocalDate paidDate;
}
