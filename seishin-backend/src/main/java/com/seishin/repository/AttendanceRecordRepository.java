package com.seishin.repository;

import com.seishin.domain.entity.AttendanceRecord;
import com.seishin.domain.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySessionId(Long sessionId);

    List<AttendanceRecord> findByStudentIdOrderBySessionSessionDateDesc(Long studentId);

    long countByStudentIdAndStatus(Long studentId, AttendanceStatus status);

    Optional<AttendanceRecord> findBySessionIdAndStudentId(Long sessionId, Long studentId);

    @Query("""
            SELECT COUNT(ar) FROM AttendanceRecord ar
            WHERE ar.student.id = :studentId
              AND ar.status IN :statuses
              AND ar.session.sessionDate >= :since
            """)
    long countByStudentIdAndStatusInSince(
            @Param("studentId") Long studentId,
            @Param("statuses") Collection<AttendanceStatus> statuses,
            @Param("since") LocalDate since);
}
