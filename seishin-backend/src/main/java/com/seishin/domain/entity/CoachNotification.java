package com.seishin.domain.entity;

import com.seishin.domain.enums.CoachNotificationKind;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "coach_notifications", indexes = {
        @Index(name = "idx_coach_notifications_user_created", columnList = "coach_user_id,created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coach_user_id", nullable = false)
    private Long coachUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private CoachNotificationKind kind;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 500)
    private String body;

    private Long studentId;

    private Long groupId;

    private Instant readAt;

    @Column(nullable = false)
    private Instant createdAt;
}
