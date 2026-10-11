package com.seishin.web.dto.auth;

import com.seishin.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpVerifyDto {
    @NotBlank
    @Pattern(regexp = "^\\+\\d{10,15}$")
    private String phone;

    @NotBlank
    @Size(min = 6, max = 6)
    private String code;

    @NotNull
    private Role role;
}
