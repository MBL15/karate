package com.seishin.repository;

import com.seishin.domain.entity.AttendanceRecord;
import com.seishin.domain.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySessionId(Long sessionId);

    List<AttendanceRecord> findByStudentIdOrderBySessionSessionDateDesc(Long studentId);

    long countByStudentIdAndStatus(Long studentId, AttendanceStatus status);

    Optional<AttendanceRecord> findBySessionIdAndStudentId(Long sessionId, Long studentId);
}
