package com.seishin.web.dto.parent;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ParentChildProfileDto {
    private Long studentId;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private int age;
    private String beltName;
    private String beltColor;
    private double progressPercent;
    private String coachRecommendation;
    private String clubName;
}
