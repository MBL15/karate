package com.seishin.web.dto.coach;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateStudentDto {
    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotNull
    private LocalDate birthDate;

    private Long beltLevelId;
    private Long groupId;
    private boolean guest;
}
