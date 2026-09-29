package com.seishin.repository;

import com.seishin.domain.entity.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {
    List<TrainingSession> findByGroupIdOrderBySessionDateDesc(Long groupId);
}
