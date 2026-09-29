package com.seishin.web.dto.auth;

import com.seishin.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDto {
    @NotBlank
    @Size(max = 80)
    private String firstName;

    @NotBlank
    @Size(max = 80)
    private String lastName;

    @NotBlank
    @Pattern(regexp = "^\\+\\d{10,15}$")
    private String phone;

    @NotNull
    private Role role;
}
