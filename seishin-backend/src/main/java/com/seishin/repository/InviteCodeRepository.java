package com.seishin.repository;

import com.seishin.domain.entity.InviteCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InviteCodeRepository extends JpaRepository<InviteCode, Long> {
    Optional<InviteCode> findByCodeAndActiveTrue(String code);
}
