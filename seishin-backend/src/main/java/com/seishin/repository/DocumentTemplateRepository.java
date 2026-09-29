package com.seishin.repository;

import com.seishin.domain.entity.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, Long> {
    List<DocumentTemplate> findByClubId(Long clubId);
}
