package com.seishin.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "belt_level_id")
    private BeltLevel beltLevel;

    /** Когда ученику присвоен текущий пояс (для подсчёта посещений). */
    private Instant beltAssignedAt;

    @Column(nullable = false)
    @Builder.Default
    private double progressPercent = 0;

    @Builder.Default
    private boolean guest = false;

    @Column(length = 500)
    private String coachRecommendation;
}
