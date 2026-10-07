package com.seishin.service;

import com.seishin.domain.entity.BeltLevel;
import com.seishin.domain.entity.Club;
import com.seishin.domain.enums.BeltAssignmentMode;
import com.seishin.repository.BeltLevelRepository;
import com.seishin.repository.ClubRepository;
import com.seishin.repository.StudentRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.coach.BeltSettingsDto;
import com.seishin.web.dto.coach.UpdateBeltLevelDto;
import com.seishin.web.exception.BadRequestException;
import com.seishin.web.exception.NotFoundException;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BeltService {

    private final BeltLevelRepository beltLevelRepository;
    private final ClubRepository clubRepository;
    private final StudentRepository studentRepository;
    private final BeltProgressService beltProgressService;

    public List<BeltLevelDto> listBeltLadder(UserPrincipal coach) {
        return beltLevelRepository.findByClubIdOrderBySortOrderAsc(coach.getClubId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public BeltSettingsDto getSettings(UserPrincipal coach) {
        Club club = requireClub(coach);
        BeltSettingsDto dto = new BeltSettingsDto();
        dto.setAssignmentMode(club.getBeltAssignmentMode());
        dto.setSessionsRequired(club.getBeltSessionsRequired());
        dto.setAutoPromote(club.isBeltAutoPromote());
        return dto;
    }

    @Transactional
    public BeltSettingsDto updateSettings(UserPrincipal coach, BeltSettingsDto dto) {
        Club club = requireClub(coach);
        if (dto.getAssignmentMode() == null) {
            throw new BadRequestException("Укажите режим присвоения поясов");
        }
        if (dto.getSessionsRequired() < 1) {
            throw new BadRequestException("Нужно хотя бы одно занятие на пояс");
        }
        club.setBeltAssignmentMode(dto.getAssignmentMode());
        club.setBeltSessionsRequired(dto.getSessionsRequired());
        club.setBeltAutoPromote(dto.isAutoPromote() && dto.getAssignmentMode() == BeltAssignmentMode.ATTENDANCE);
        studentRepository.findByClubId(club.getId()).forEach(s -> beltProgressService.recalculateProgress(s.getId()));
        return getSettings(coach);
    }

    @Transactional
    public BeltLevelDto updateLevel(UserPrincipal coach, Long beltLevelId, UpdateBeltLevelDto dto) {
        BeltLevel belt = beltLevelRepository.findById(beltLevelId)
                .orElseThrow(() -> new NotFoundException("Пояс не найден"));
        if (!belt.getClub().getId().equals(coach.getClubId())) {
            throw new BadRequestException("Пояс другого клуба");
        }
        belt.setSessionsRequired(dto.getSessionsRequired());
        belt = beltLevelRepository.save(belt);
        Long beltId = belt.getId();
        studentRepository.findByClubId(coach.getClubId()).stream()
                .filter(s -> s.getBeltLevel() != null && beltId.equals(s.getBeltLevel().getId()))
                .forEach(s -> beltProgressService.recalculateProgress(s.getId()));
        return toDto(belt);
    }

    private Club requireClub(UserPrincipal coach) {
        Long clubId = coach.getClubId();
        if (clubId == null) {
            throw new BadRequestException("Тренер не привязан к клубу");
        }
        return clubRepository.findById(clubId)
                .orElseThrow(() -> new BadRequestException("Клуб не найден"));
    }

    private BeltLevelDto toDto(BeltLevel b) {
        return BeltLevelDto.builder()
                .id(b.getId())
                .name(b.getName())
                .color(b.getColor())
                .sortOrder(b.getSortOrder())
                .sessionsRequired(b.getSessionsRequired())
                .build();
    }

    @Data
    @Builder
    public static class BeltLevelDto {
        private Long id;
        private String name;
        private String color;
        private int sortOrder;
        private Integer sessionsRequired;
    }
}
