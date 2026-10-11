package com.seishin.repository;

import com.seishin.domain.entity.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {
    List<TrainingSession> findByGroupIdOrderBySessionDateDesc(Long groupId);

    Optional<TrainingSession> findByGroupIdAndSessionDateAndStartTime(
            Long groupId, LocalDate sessionDate, LocalTime startTime);
}
