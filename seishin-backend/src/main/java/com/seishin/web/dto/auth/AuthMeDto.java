package com.seishin.web.dto.auth;

import com.seishin.domain.enums.Role;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AuthMeDto {
    Long userId;
    String name;
    String login;
    String phone;
    Role role;
    Long clubId;
}
