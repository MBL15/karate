package com.seishin.domain.entity;

import com.seishin.domain.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "document_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private DocumentType type;

    @Lob
    @Column(nullable = false)
    private String content;
}
