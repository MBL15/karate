package com.seishin.repository;

import com.seishin.domain.entity.TrainingGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TrainingGroupRepository extends JpaRepository<TrainingGroup, Long> {
    List<TrainingGroup> findByClubId(Long clubId);

    List<TrainingGroup> findByCoachId(Long coachId);

    @Query("SELECT g FROM TrainingGroup g WHERE g.coach.id = :coachId OR g.id IN " +
           "(SELECT ga.group.id FROM GroupAssistant ga WHERE ga.coach.id = :coachId)")
    List<TrainingGroup> findAccessibleByCoach(Long coachId);
}
