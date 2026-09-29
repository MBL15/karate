package com.seishin.service;

import com.seishin.domain.entity.BeltLevel;
import com.seishin.repository.BeltLevelRepository;
import com.seishin.security.UserPrincipal;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BeltService {

    private final BeltLevelRepository beltLevelRepository;

    public List<BeltLevelDto> listBeltLadder(UserPrincipal coach) {
        return beltLevelRepository.findByClubIdOrderBySortOrderAsc(coach.getClubId()).stream()
                .map(this::toDto)
                .toList();
    }

    private BeltLevelDto toDto(BeltLevel b) {
        return BeltLevelDto.builder()
                .id(b.getId())
                .name(b.getName())
                .color(b.getColor())
                .sortOrder(b.getSortOrder())
                .build();
    }

    @Data
    @Builder
    public static class BeltLevelDto {
        private Long id;
        private String name;
        private String color;
        private int sortOrder;
    }
}
