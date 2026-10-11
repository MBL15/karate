package com.seishin.web.dto.parent;

import com.seishin.domain.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class PaymentSummaryDto {
    private Long id;
    private String periodLabel;
    private String description;
    private BigDecimal amount;
    private PaymentStatus status;
    private LocalDate dueDate;
}
