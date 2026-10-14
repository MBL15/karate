package com.seishin.repository;

import com.seishin.domain.entity.ClassSessionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

public interface ClassSessionPlanRepository extends JpaRepository<ClassSessionPlan, Long> {
    Optional<ClassSessionPlan> findByGroupIdAndSessionDateAndStartTime(Long groupId, LocalDate sessionDate, LocalTime startTime);
}
