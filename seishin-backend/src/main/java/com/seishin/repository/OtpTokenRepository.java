package com.seishin.repository;

import com.seishin.domain.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findTopByPhoneAndUsedFalseOrderByExpiresAtDesc(String phone);
}
