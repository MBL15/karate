package com.seishin.web.dto.competition;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryOverrideDto {
    @NotBlank
    private String category;
}
