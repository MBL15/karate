package com.seishin.domain.entity;

import com.seishin.domain.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "phone"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;
}
