package com.seishin.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "belt_levels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeltLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String color;

    @Column(nullable = false)
    private int sortOrder;
}
