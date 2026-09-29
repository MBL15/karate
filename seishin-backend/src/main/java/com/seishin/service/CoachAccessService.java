package com.seishin.service;

import com.seishin.domain.entity.TrainingGroup;
import com.seishin.repository.GroupAssistantRepository;
import com.seishin.repository.TrainingGroupRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.exception.ForbiddenException;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CoachAccessService {

    private final TrainingGroupRepository groupRepository;
    private final GroupAssistantRepository groupAssistantRepository;

    public TrainingGroup requireGroupAccess(UserPrincipal coach, Long groupId) {
        TrainingGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Группа не найдена"));
        if (!group.getClub().getId().equals(coach.getClubId())) {
            throw new ForbiddenException("Группа другого клуба");
        }
        boolean owner = group.getCoach().getId().equals(coach.getId());
        boolean assistant = groupAssistantRepository.existsByGroupIdAndCoachId(groupId, coach.getId());
        if (!owner && !assistant) {
            throw new ForbiddenException("Нет доступа к группе");
        }
        return group;
    }

    public boolean isAssistant(UserPrincipal coach, TrainingGroup group) {
        return !group.getCoach().getId().equals(coach.getId())
                && groupAssistantRepository.existsByGroupIdAndCoachId(group.getId(), coach.getId());
    }
}
