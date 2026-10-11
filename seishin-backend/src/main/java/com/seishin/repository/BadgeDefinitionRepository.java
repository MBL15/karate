package com.seishin.repository;

import com.seishin.domain.entity.BadgeDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeDefinitionRepository extends JpaRepository<BadgeDefinition, Long> {
    List<BadgeDefinition> findByClubId(Long clubId);
}
