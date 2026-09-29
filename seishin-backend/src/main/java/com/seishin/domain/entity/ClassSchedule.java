package com.seishin.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "class_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private TrainingGroup group;

    @Column(nullable = false)
    private int weekday;

    @Column(nullable = false)
    private LocalTime startTime;

    private LocalTime endTime;

    private String location;

    @Builder.Default
    private boolean active = true;
}
