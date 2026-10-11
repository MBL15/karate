package com.seishin.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "badge_definitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Builder.Default
    private boolean cumulative = true;

    @Column(nullable = false)
    @Builder.Default
    private int requiredCount = 1;
}
