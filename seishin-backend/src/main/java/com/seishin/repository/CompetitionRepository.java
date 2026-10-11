package com.seishin.repository;

import com.seishin.domain.entity.Competition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompetitionRepository extends JpaRepository<Competition, Long> {
    List<Competition> findByClubIdOrderByEventDateAsc(Long clubId);
}
