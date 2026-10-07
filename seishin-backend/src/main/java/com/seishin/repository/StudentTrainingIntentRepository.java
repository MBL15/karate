package com.seishin.repository;

import com.seishin.domain.entity.StudentTrainingIntent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

public interface StudentTrainingIntentRepository extends JpaRepository<StudentTrainingIntent, Long> {

    Optional<StudentTrainingIntent> findByStudentIdAndGroupIdAndSessionDateAndStartTime(
            Long studentId, Long groupId, LocalDate sessionDate, LocalTime startTime);
}
