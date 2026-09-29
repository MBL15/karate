package com.seishin.repository;

import com.seishin.domain.entity.BeltLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BeltLevelRepository extends JpaRepository<BeltLevel, Long> {
    List<BeltLevel> findByClubIdOrderBySortOrderAsc(Long clubId);
}
