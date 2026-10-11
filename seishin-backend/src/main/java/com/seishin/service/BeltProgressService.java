package com.seishin.service;

import com.seishin.domain.entity.BeltLevel;
import com.seishin.domain.entity.Club;
import com.seishin.domain.entity.Student;
import com.seishin.domain.enums.AttendanceStatus;
import com.seishin.domain.enums.BeltAssignmentMode;
import com.seishin.repository.AttendanceRecordRepository;
import com.seishin.repository.BadgeDefinitionRepository;
import com.seishin.repository.BeltLevelRepository;
import com.seishin.repository.StudentBadgeRepository;
import com.seishin.repository.StudentRepository;
import com.seishin.web.dto.common.BeltProgressFields;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BeltProgressService {

    private static final Set<AttendanceStatus> COUNTED_ATTENDANCE =
            Set.of(AttendanceStatus.PRESENT, AttendanceStatus.MAKEUP);

    private final StudentRepository studentRepository;
    private final BeltLevelRepository beltLevelRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final StudentBadgeRepository studentBadgeRepository;
    private final BadgeDefinitionRepository badgeDefinitionRepository;

    @Transactional
    public void recalculateProgress(Long studentId) {
        Student student = studentRepository.findById(studentId).orElseThrow();
        Club club = student.getClub();
        BeltAssignmentMode mode = club.getBeltAssignmentMode();

        if (mode == BeltAssignmentMode.MANUAL) {
            return;
        }

        if (mode == BeltAssignmentMode.ATTENDANCE) {
            applyAttendanceProgress(student, club, true);
            return;
        }

        applyReadinessProgress(student);
    }

    public BeltProgressFields buildProgressView(Student student) {
        Club club = student.getClub();
        BeltLevel current = student.getBeltLevel();
        BeltLevel next = findNextBelt(club.getId(), current);
        boolean maxRank = next == null;

        BeltAssignmentMode mode = club.getBeltAssignmentMode();
        if (mode == BeltAssignmentMode.MANUAL) {
            return BeltProgressFields.builder()
                    .beltAssignmentMode(mode)
                    .progressPercent(null)
                    .progressLabel("Пояс присваивает тренер на аттестации")
                    .nextBeltName(next != null ? next.getName() : null)
                    .nextBeltColor(next != null ? next.getColor() : null)
                    .maxRank(maxRank)
                    .build();
        }

        if (mode == BeltAssignmentMode.ATTENDANCE) {
            int required = sessionsRequiredForCurrentBelt(club, current);
            int completed = countAttendedOnCurrentBelt(student);
            double pct = maxRank ? 100.0 : Math.min(100.0, required == 0 ? 0 : (completed * 100.0 / required));
            String label = maxRank
                    ? "Достигнут высший пояс в клубе"
                    : "Посещено %d из %d занятий до %s пояса".formatted(completed, required, next.getName().toLowerCase());
            return BeltProgressFields.builder()
                    .beltAssignmentMode(mode)
                    .progressPercent(Math.round(pct * 10) / 10.0)
                    .progressLabel(label)
                    .nextBeltName(next != null ? next.getName() : null)
                    .nextBeltColor(next != null ? next.getColor() : null)
                    .sessionsCompleted(maxRank ? null : completed)
                    .sessionsRequired(maxRank ? null : required)
                    .maxRank(maxRank)
                    .build();
        }

        double pct = student.getProgressPercent();
        String label = maxRank
                ? "Достигнут высший пояс в клубе"
                : "Готовность к %s поясу".formatted(next.getName().toLowerCase());
        return BeltProgressFields.builder()
                .beltAssignmentMode(mode)
                .progressPercent(pct)
                .progressLabel(label)
                .nextBeltName(next != null ? next.getName() : null)
                .nextBeltColor(next != null ? next.getColor() : null)
                .maxRank(maxRank)
                .build();
    }

    private void applyAttendanceProgress(Student student, Club club, boolean allowAutoPromote) {
        BeltLevel current = student.getBeltLevel();
        BeltLevel next = findNextBelt(club.getId(), current);
        if (next == null) {
            student.setProgressPercent(100.0);
            studentRepository.save(student);
            return;
        }

        int required = sessionsRequiredForCurrentBelt(club, current);
        int completed = countAttendedOnCurrentBelt(student);
        double pct = Math.min(100.0, required == 0 ? 0 : (completed * 100.0 / required));
        student.setProgressPercent(Math.round(pct * 10) / 10.0);
        studentRepository.save(student);

        if (allowAutoPromote && club.isBeltAutoPromote() && completed >= required && required > 0) {
            promoteToNextBelt(student, next);
        }
    }

    private void promoteToNextBelt(Student student, BeltLevel next) {
        student.setBeltLevel(next);
        student.setBeltAssignedAt(Instant.now());
        student.setProgressPercent(0);
        studentRepository.save(student);
        applyAttendanceProgress(student, student.getClub(), true);
    }

    private void applyReadinessProgress(Student student) {
        long present = attendanceRecordRepository.countByStudentIdAndStatus(student.getId(), AttendanceStatus.PRESENT);
        long makeup = attendanceRecordRepository.countByStudentIdAndStatus(student.getId(), AttendanceStatus.MAKEUP);
        long absent = attendanceRecordRepository.countByStudentIdAndStatus(student.getId(), AttendanceStatus.ABSENT);
        long totalSessions = present + makeup + absent;

        double attendanceScore = totalSessions == 0 ? 0 : ((present + makeup) * 100.0 / totalSessions) * 0.5;

        long badgeCount = studentBadgeRepository.findByStudentIdOrderByIssuedAtDesc(student.getId()).size();
        long badgeDefs = badgeDefinitionRepository.findByClubId(student.getClub().getId()).size();
        double badgeScore = badgeDefs == 0 ? 0 : Math.min(30.0, badgeCount * 30.0 / badgeDefs);

        double coachScore =
                student.getCoachRecommendation() != null && !student.getCoachRecommendation().isBlank() ? 20.0 : 0;

        student.setProgressPercent(Math.min(100.0, Math.round((attendanceScore + badgeScore + coachScore) * 10) / 10.0));
        studentRepository.save(student);
    }

    public int countAttendedOnCurrentBelt(Student student) {
        LocalDate since = beltSinceDate(student);
        return (int) attendanceRecordRepository.countByStudentIdAndStatusInSince(
                student.getId(), COUNTED_ATTENDANCE, since);
    }

    private LocalDate beltSinceDate(Student student) {
        if (student.getBeltAssignedAt() != null) {
            return student.getBeltAssignedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        return LocalDate.EPOCH;
    }

    public BeltLevel findNextBelt(Long clubId, BeltLevel current) {
        if (current == null) {
            return beltLevelRepository.findByClubIdOrderBySortOrderAsc(clubId).stream().findFirst().orElse(null);
        }
        List<BeltLevel> ladder = beltLevelRepository.findByClubIdOrderBySortOrderAsc(clubId);
        boolean found = false;
        for (BeltLevel level : ladder) {
            if (found) {
                return level;
            }
            if (level.getId().equals(current.getId())) {
                found = true;
            }
        }
        return null;
    }

    public int sessionsRequiredForCurrentBelt(Club club, BeltLevel current) {
        if (current != null && current.getSessionsRequired() != null && current.getSessionsRequired() > 0) {
            return current.getSessionsRequired();
        }
        return Math.max(1, club.getBeltSessionsRequired());
    }
}
