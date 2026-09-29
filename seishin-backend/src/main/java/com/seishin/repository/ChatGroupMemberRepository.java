package com.seishin.repository;

import com.seishin.domain.entity.ChatGroupMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatGroupMemberRepository extends JpaRepository<ChatGroupMember, Long> {
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    int countByGroupId(Long groupId);

    @EntityGraph(attributePaths = {"group", "group.club"})
    List<ChatGroupMember> findByUserId(Long userId);
}
