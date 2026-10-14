package com.seishin.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "training_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;

    /** Скрыта из расписания и списков, состав на сервере сохраняется. */
    @Column(nullable = true)
    @Builder.Default
    private Boolean hidden = false;

    public boolean isHidden() {
        return Boolean.TRUE.equals(hidden);
    }

    public void setHidden(boolean value) {
        this.hidden = value;
    }
}
