package com.seishin.repository;

import com.seishin.domain.entity.CompetitionRegistration;
import com.seishin.domain.enums.RsvpStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompetitionRegistrationRepository extends JpaRepository<CompetitionRegistration, Long> {
    List<CompetitionRegistration> findByCompetitionId(Long competitionId);

    List<CompetitionRegistration> findByStudentId(Long studentId);

    Optional<CompetitionRegistration> findByCompetitionIdAndStudentId(Long competitionId, Long studentId);

    long countByCompetition_Club_IdAndRsvpStatus(Long clubId, RsvpStatus rsvpStatus);
}
