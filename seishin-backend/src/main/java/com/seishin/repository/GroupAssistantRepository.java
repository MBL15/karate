package com.seishin.repository;

import com.seishin.domain.entity.GroupAssistant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupAssistantRepository extends JpaRepository<GroupAssistant, Long> {
    boolean existsByGroupIdAndCoachId(Long groupId, Long coachId);
}
