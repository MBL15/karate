package com.seishin.repository;

import com.seishin.domain.entity.User;
import com.seishin.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);

    Optional<User> findByLogin(String login);

    List<User> findByClubIdAndRole(Long clubId, Role role);
}
