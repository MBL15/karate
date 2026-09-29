package com.seishin.repository;

import com.seishin.domain.entity.ChatMessage;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @EntityGraph(attributePaths = {"sender", "student"})
    List<ChatMessage> findByStudentIdOrderBySentAtAsc(Long studentId);

    @EntityGraph(attributePaths = {"sender"})
    Optional<ChatMessage> findTopByStudentIdOrderBySentAtDesc(Long studentId);

    @Query("SELECT DISTINCT m.student.id FROM ChatMessage m WHERE m.student.club.id = :clubId AND LOWER(m.body) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Long> findStudentIdsWithMatchingMessages(Long clubId, String query);
}
