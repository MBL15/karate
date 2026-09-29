package com.seishin.web.dto.common;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class StudentSummaryDto {
    private Long id;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private int age;
    private String beltName;
    private String beltColor;
    private double progressPercent;
    private boolean guest;
}
