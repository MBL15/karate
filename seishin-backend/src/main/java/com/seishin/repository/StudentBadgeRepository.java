package com.seishin.repository;

import com.seishin.domain.entity.StudentBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentBadgeRepository extends JpaRepository<StudentBadge, Long> {
    List<StudentBadge> findByStudentIdOrderByIssuedAtDesc(Long studentId);

    long countByStudentIdAndBadgeId(Long studentId, Long badgeId);
}
