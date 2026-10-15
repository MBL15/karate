package com.seishin.service;

import com.seishin.domain.entity.Club;
import com.seishin.repository.ClubRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.coach.CoachClubProfileDto;
import com.seishin.web.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClubProfileService {

    private final ClubRepository clubRepository;

    @Transactional(readOnly = true)
    public CoachClubProfileDto getProfile(UserPrincipal coach) {
        Club club = requireClub(coach);
        return toDto(club);
    }

    @Transactional
    public CoachClubProfileDto updateProfile(UserPrincipal coach, CoachClubProfileDto dto) {
        Club club = requireClub(coach);
        if (dto.getName() != null) {
            String name = dto.getName().trim();
            if (name.isEmpty()) {
                throw new BadRequestException("Укажите название клуба");
            }
            if (!name.equals(club.getName()) && clubRepository.findByName(name).isPresent()) {
                throw new BadRequestException("Клуб с таким названием уже существует");
            }
            club.setName(name);
        }
        if (dto.getDescription() != null) {
            club.setDescription(blankToNull(dto.getDescription()));
        }
        if (dto.getAddress() != null) {
            club.setAddress(blankToNull(dto.getAddress()));
        }
        if (dto.getLogo() != null) {
            club.setLogo(blankToNull(dto.getLogo()));
        }
        if (dto.getBeltStateJson() != null) {
            club.setBeltStateJson(dto.getBeltStateJson());
        }
        return toDto(clubRepository.save(club));
    }

    private Club requireClub(UserPrincipal coach) {
        if (coach.getClubId() == null) {
            throw new BadRequestException("Тренер не привязан к клубу");
        }
        return clubRepository.findById(coach.getClubId())
                .orElseThrow(() -> new BadRequestException("Клуб не найден"));
    }

    private CoachClubProfileDto toDto(Club club) {
        return CoachClubProfileDto.builder()
                .name(club.getName())
                .description(club.getDescription())
                .address(club.getAddress())
                .logo(club.getLogo())
                .beltStateJson(club.getBeltStateJson())
                .build();
    }

    private static String blankToNull(String value) {
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
