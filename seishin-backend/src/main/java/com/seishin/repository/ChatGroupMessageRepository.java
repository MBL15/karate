package com.seishin.repository;

import com.seishin.domain.entity.ChatGroupMessage;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatGroupMessageRepository extends JpaRepository<ChatGroupMessage, Long> {
    @EntityGraph(attributePaths = {"sender", "group"})
    List<ChatGroupMessage> findByGroupIdOrderBySentAtAsc(Long groupId);

    @EntityGraph(attributePaths = {"sender"})
    Optional<ChatGroupMessage> findTopByGroupIdOrderBySentAtDesc(Long groupId);

    @Query("SELECT DISTINCT m.group.id FROM ChatGroupMessage m WHERE m.group.club.id = :clubId AND LOWER(m.body) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Long> findGroupIdsWithMatchingMessages(Long clubId, String query);
}
