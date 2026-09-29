package com.seishin.security;

import com.seishin.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(properties.getExpirationHours(), ChronoUnit.HOURS);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("phone", user.getPhone())
                .claim("role", user.getRole().name())
                .claim("name", user.getName())
                .claim("clubId", user.getClub() != null ? user.getClub().getId() : null)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }
}
