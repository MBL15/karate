package com.seishin.web.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InviteLinkDto {
    @NotBlank
    @Size(min = 6, max = 6)
    private String code;
}
