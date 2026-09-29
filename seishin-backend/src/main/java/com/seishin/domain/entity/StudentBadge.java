package com.seishin.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "student_badges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "badge_id", nullable = false)
    private BadgeDefinition badge;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issued_by_coach_id", nullable = false)
    private User issuedByCoach;

    @Column(nullable = false)
    private Instant issuedAt;

    @Column(length = 300)
    private String note;
}
