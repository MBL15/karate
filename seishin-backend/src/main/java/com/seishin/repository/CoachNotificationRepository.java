package com.seishin.repository;

import com.seishin.domain.entity.CoachNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CoachNotificationRepository extends JpaRepository<CoachNotification, Long> {
    List<CoachNotification> findTop50ByCoachUserIdOrderByCreatedAtDesc(Long coachUserId);

    long countByCoachUserIdAndReadAtIsNull(Long coachUserId);

    Optional<CoachNotification> findByIdAndCoachUserId(Long id, Long coachUserId);
}
