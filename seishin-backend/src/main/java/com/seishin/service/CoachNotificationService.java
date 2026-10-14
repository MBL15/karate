package com.seishin.service;

import com.seishin.domain.entity.CoachNotification;
import com.seishin.domain.entity.Student;
import com.seishin.domain.entity.TrainingGroup;
import com.seishin.domain.entity.User;
import com.seishin.domain.enums.CoachNotificationKind;
import com.seishin.domain.enums.Role;
import com.seishin.repository.CoachNotificationRepository;
import com.seishin.repository.UserRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.coach.CoachNotificationDto;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CoachNotificationService {

    private final CoachNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<CoachNotificationDto> listForCoach(UserPrincipal coach) {
        return notificationRepository.findTop50ByCoachUserIdOrderByCreatedAtDesc(coach.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    public long unreadCount(UserPrincipal coach) {
        return notificationRepository.countByCoachUserIdAndReadAtIsNull(coach.getId());
    }

    @Transactional
    public void markRead(UserPrincipal coach, Long notificationId) {
        CoachNotification notification = notificationRepository.findByIdAndCoachUserId(notificationId, coach.getId())
                .orElseThrow(() -> new NotFoundException("Уведомление не найдено"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllRead(UserPrincipal coach) {
        for (CoachNotification notification : notificationRepository.findTop50ByCoachUserIdOrderByCreatedAtDesc(coach.getId())) {
            if (notification.getReadAt() == null) {
                notification.setReadAt(Instant.now());
                notificationRepository.save(notification);
            }
        }
    }

    @Transactional
    public void notifyStudentJoinedGroup(Student student, TrainingGroup group, Long actorCoachId) {
        String studentName = student.getFirstName() + " " + student.getLastName();
        String title = "Новый ученик в группе";
        String body = studentName + " добавлен(а) в «" + group.getName() + "»";

        Set<Long> recipients = new HashSet<>();
        Long ownerId = group.getCoach().getId();
        if (!ownerId.equals(actorCoachId)) {
            recipients.add(ownerId);
        }
        for (User clubCoach : userRepository.findByClubIdAndRole(group.getClub().getId(), Role.COACH)) {
            if (!clubCoach.getId().equals(actorCoachId)) {
                recipients.add(clubCoach.getId());
            }
        }

        Instant now = Instant.now();
        for (Long coachUserId : recipients) {
            notificationRepository.save(CoachNotification.builder()
                    .coachUserId(coachUserId)
                    .kind(CoachNotificationKind.STUDENT_JOINED_GROUP)
                    .title(title)
                    .body(body)
                    .studentId(student.getId())
                    .groupId(group.getId())
                    .createdAt(now)
                    .build());
        }
    }

    private CoachNotificationDto toDto(CoachNotification n) {
        return CoachNotificationDto.builder()
                .id(n.getId())
                .kind(n.getKind())
                .title(n.getTitle())
                .body(n.getBody())
                .studentId(n.getStudentId())
                .groupId(n.getGroupId())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
