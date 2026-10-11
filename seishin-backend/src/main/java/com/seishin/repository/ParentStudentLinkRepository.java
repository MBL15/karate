package com.seishin.repository;

import com.seishin.domain.entity.ParentStudentLink;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParentStudentLinkRepository extends JpaRepository<ParentStudentLink, Long> {
    @EntityGraph(attributePaths = {"student"})
    List<ParentStudentLink> findByParentId(Long parentId);

    Optional<ParentStudentLink> findByParentIdAndStudentId(Long parentId, Long studentId);

    boolean existsByParentIdAndStudentId(Long parentId, Long studentId);

    @EntityGraph(attributePaths = {"parent"})
    List<ParentStudentLink> findByStudentId(Long studentId);
}
