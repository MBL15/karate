package com.seishin.repository;

import com.seishin.domain.entity.GroupStudent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupStudentRepository extends JpaRepository<GroupStudent, Long> {
    List<GroupStudent> findByGroupId(Long groupId);

    List<GroupStudent> findByStudentId(Long studentId);

    boolean existsByGroupIdAndStudentId(Long groupId, Long studentId);

    void deleteByGroupIdAndStudentId(Long groupId, Long studentId);

    void deleteByStudentId(Long studentId);
}
