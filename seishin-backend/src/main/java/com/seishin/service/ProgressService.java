package com.seishin.service;

import com.seishin.domain.entity.Student;
import com.seishin.domain.enums.AttendanceStatus;
import com.seishin.repository.AttendanceRecordRepository;
import com.seishin.repository.BadgeDefinitionRepository;
import com.seishin.repository.StudentBadgeRepository;
import com.seishin.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final StudentRepository studentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final StudentBadgeRepository studentBadgeRepository;
    private final BadgeDefinitionRepository badgeDefinitionRepository;

    @Transactional
    public void recalculateProgress(Long studentId) {
        Student student = studentRepository.findById(studentId).orElseThrow();
        long present = attendanceRecordRepository.countByStudentIdAndStatus(studentId, AttendanceStatus.PRESENT);
        long makeup = attendanceRecordRepository.countByStudentIdAndStatus(studentId, AttendanceStatus.MAKEUP);
        long totalSessions = present + makeup + attendanceRecordRepository.countByStudentIdAndStatus(studentId, AttendanceStatus.ABSENT);

        double attendanceScore = totalSessions == 0 ? 0 : ((present + makeup) * 100.0 / totalSessions) * 0.5;

        long badgeCount = studentBadgeRepository.findByStudentIdOrderByIssuedAtDesc(studentId).size();
        long badgeDefs = badgeDefinitionRepository.findByClubId(student.getClub().getId()).size();
        double badgeScore = badgeDefs == 0 ? 0 : Math.min(30.0, badgeCount * 30.0 / badgeDefs);

        double coachScore = student.getCoachRecommendation() != null && !student.getCoachRecommendation().isBlank() ? 20.0 : 0;

        student.setProgressPercent(Math.min(100.0, Math.round((attendanceScore + badgeScore + coachScore) * 10) / 10.0));
        studentRepository.save(student);
    }
}
