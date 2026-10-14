package com.seishin.repository;

import com.seishin.domain.entity.BeltLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BeltLevelRepository extends JpaRepository<BeltLevel, Long> {
    List<BeltLevel> findByClubIdOrderBySortOrderAsc(Long clubId);

    Optional<BeltLevel> findByClubIdAndName(Long clubId, String name);
}
