package com.seishin.web.dto.auth;

import com.seishin.domain.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponseDto {
    private String token;
    private Long userId;
    private String name;
    private String phone;
    private Role role;
    private Long clubId;
}
