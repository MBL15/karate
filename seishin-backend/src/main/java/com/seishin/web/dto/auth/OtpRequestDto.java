package com.seishin.web.dto.auth;

import com.seishin.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OtpRequestDto {
    @NotBlank
    @Pattern(regexp = "^\\+\\d{10,15}$")
    private String phone;

    @NotNull
    private Role role;
}
