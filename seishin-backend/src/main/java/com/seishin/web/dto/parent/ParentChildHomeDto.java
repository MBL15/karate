package com.seishin.web.dto.parent;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ParentChildHomeDto {
    private Long studentId;
    private String fullName;
    private int age;
    private String beltName;
    private double progressPercent;
    private List<UpcomingCompetitionDto> upcomingCompetitions;
    private List<PaymentSummaryDto> recentPayments;
}
