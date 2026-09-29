package com.seishin.repository;

import com.seishin.domain.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByClubId(Long clubId);
}
