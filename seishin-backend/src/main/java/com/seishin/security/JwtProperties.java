package com.seishin.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "seishin.jwt")
public class JwtProperties {
    private String secret;
    private int expirationHours;
}
