package com.seishin.web.dto.coach;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateGroupDto {
    @NotBlank
    private String name;
}
