package com.seishin.web.dto.auth;

import com.seishin.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginDto {
    @NotBlank
    @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9._-]{2,31}$")
    private String login;

    @NotBlank
    @Size(min = 6, max = 72)
    private String password;

    @NotNull
    private Role role;
}
