package com.seishin.repository;

import com.seishin.domain.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long> {
    Optional<Club> findByName(String name);

    Optional<Club> findByJoinCode(String joinCode);
}
