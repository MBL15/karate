package com.seishin.repository;

import com.seishin.domain.entity.ClassSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long> {
    List<ClassSchedule> findByGroupClubIdAndActiveTrueOrderByWeekdayAscStartTimeAsc(Long clubId);

    List<ClassSchedule> findByGroupIdAndActiveTrueOrderByWeekdayAscStartTimeAsc(Long groupId);

    long countByGroupClubId(Long clubId);
}
