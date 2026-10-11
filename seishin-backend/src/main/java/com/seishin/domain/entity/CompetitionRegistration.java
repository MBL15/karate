package com.seishin.domain.entity;

import com.seishin.domain.enums.Discipline;
import com.seishin.domain.enums.RsvpStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "competition_registrations", uniqueConstraints = @UniqueConstraint(columnNames = {"competition_id", "student_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompetitionRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private Double weightKg;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Discipline discipline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private RsvpStatus rsvpStatus = RsvpStatus.PENDING;

    @Column(length = 100)
    private String autoCategory;

    @Column(length = 100)
    private String coachOverrideCategory;

    private Instant parentRespondedAt;
}
