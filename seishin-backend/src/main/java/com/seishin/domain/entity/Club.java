package com.seishin.domain.entity;

import com.seishin.domain.enums.BeltAssignmentMode;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clubs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    /** Постоянный 6-значный код: его можно передать нескольким ученикам. */
    @Column(length = 6, unique = true)
    private String joinCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BeltAssignmentMode beltAssignmentMode = BeltAssignmentMode.READINESS;

    /** Занятий на поясе по умолчанию (режим ATTENDANCE), если у уровня не задано своё. */
    @Column(nullable = false)
    @Builder.Default
    private int beltSessionsRequired = 20;

    /** Автоматически повышать пояс при 100% посещений (только ATTENDANCE). */
    @Column(nullable = false)
    @Builder.Default
    private boolean beltAutoPromote = false;
}
