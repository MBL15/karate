package com.seishin.service;

import com.seishin.domain.entity.BeltLevel;
import com.seishin.domain.entity.Student;
import com.seishin.web.dto.common.StudentSummaryDto;
import org.springframework.stereotype.Component;

@Component
public class StudentMapper {

    public StudentSummaryDto toSummary(Student student) {
        BeltLevel belt = student.getBeltLevel();
        return StudentSummaryDto.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .birthDate(student.getBirthDate())
                .age(AgeCalculator.age(student.getBirthDate()))
                .beltName(belt != null ? belt.getName() : null)
                .beltColor(belt != null ? belt.getColor() : null)
                .progressPercent(student.getProgressPercent())
                .guest(student.isGuest())
                .build();
    }
}
