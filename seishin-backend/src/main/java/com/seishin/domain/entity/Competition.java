package com.seishin.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "competitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate eventDate;

    private String location;

    @Column(length = 1000)
    private String description;
}
