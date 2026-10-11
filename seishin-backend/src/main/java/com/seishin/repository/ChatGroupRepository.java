package com.seishin.repository;

import com.seishin.domain.entity.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {
    List<ChatGroup> findByClubId(Long clubId);
}
