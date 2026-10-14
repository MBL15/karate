package com.seishin.service;

import com.seishin.domain.entity.ClassSessionPlan;
import com.seishin.domain.entity.TrainingGroup;
import com.seishin.repository.ClassSessionPlanRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.coach.SessionPlanDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionPlanService {

    private final ClassSessionPlanRepository planRepository;
    private final CoachAccessService coachAccessService;

    @Transactional(readOnly = true)
    public Optional<SessionPlanDto> getPlan(Long groupId, LocalDate sessionDate, LocalTime startTime) {
        return planRepository.findByGroupIdAndSessionDateAndStartTime(groupId, sessionDate, startTime)
                .map(this::toDto);
    }

    @Transactional
    public SessionPlanDto savePlan(UserPrincipal coach, SessionPlanDto dto) {
        TrainingGroup group = coachAccessService.requireGroupAccess(coach, dto.getGroupId());
        String title = trim(dto.getTopicTitle());
        String text = trim(dto.getTopicText());
        var existing = planRepository.findByGroupIdAndSessionDateAndStartTime(
                dto.getGroupId(), dto.getSessionDate(), dto.getStartTime());
        if (title.isEmpty() && text.isEmpty()) {
            existing.ifPresent(planRepository::delete);
            dto.setTopicTitle(null);
            dto.setTopicText(null);
            return dto;
        }
        ClassSessionPlan plan = existing.orElseGet(() -> ClassSessionPlan.builder()
                .group(group)
                .sessionDate(dto.getSessionDate())
                .startTime(dto.getStartTime())
                .build());
        plan.setTopicTitle(title.isEmpty() ? null : title);
        plan.setTopicText(text.isEmpty() ? null : text);
        plan.setUpdatedAt(Instant.now());
        planRepository.save(plan);
        return toDto(plan);
    }

    public Optional<SessionPlanTopics> topicsFor(Long groupId, LocalDate sessionDate, LocalTime startTime) {
        return planRepository.findByGroupIdAndSessionDateAndStartTime(groupId, sessionDate, startTime)
                .map(p -> new SessionPlanTopics(p.getTopicTitle(), p.getTopicText()));
    }

    private SessionPlanDto toDto(ClassSessionPlan plan) {
        SessionPlanDto dto = new SessionPlanDto();
        dto.setGroupId(plan.getGroup().getId());
        dto.setSessionDate(plan.getSessionDate());
        dto.setStartTime(plan.getStartTime());
        dto.setTopicTitle(plan.getTopicTitle());
        dto.setTopicText(plan.getTopicText());
        return dto;
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    public record SessionPlanTopics(String topicTitle, String topicText) {}
}
