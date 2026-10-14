package com.seishin.service;

import com.seishin.domain.entity.BadgeDefinition;
import com.seishin.domain.entity.BeltLevel;
import com.seishin.domain.entity.Club;
import com.seishin.repository.BadgeDefinitionRepository;
import com.seishin.repository.BeltLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ClubDefaultsService {

    private static final List<PresetBadge> PRESET_BADGES = List.of(
            new PresetBadge("Дисциплина", "Собранность и уважение на татами"),
            new PresetBadge("Техника", "Чистое выполнение техники"),
            new PresetBadge("Старание", "Работал в полную силу"),
            new PresetBadge("Прогресс", "Заметный рост за тренировку"),
            new PresetBadge("Лидер", "Помогал другим и вёл за собой"),
            new PresetBadge("Кумитэ", "Лучший в спарринге"));

    private final BadgeDefinitionRepository badgeDefinitionRepository;
    private final BeltLevelRepository beltLevelRepository;

    @Transactional
    public void ensureDefaults(Club club) {
        ensurePresetBadges(club);
        ensureStarterBelts(club);
    }

    @Transactional
    public void ensurePresetBadges(Club club) {
        var existing = badgeDefinitionRepository.findByClubId(club.getId());
        var names = existing.stream()
                .map(b -> b.getName().trim().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
        for (PresetBadge preset : PRESET_BADGES) {
            if (names.contains(preset.name().toLowerCase(Locale.ROOT))) {
                continue;
            }
            badgeDefinitionRepository.save(BadgeDefinition.builder()
                    .club(club)
                    .name(preset.name())
                    .description(preset.description())
                    .cumulative(false)
                    .requiredCount(1)
                    .build());
        }
    }

    @Transactional
    public void ensureStarterBelts(Club club) {
        if (!beltLevelRepository.findByClubIdOrderBySortOrderAsc(club.getId()).isEmpty()) {
            return;
        }
        String[][] ladder = {
                {"10 кю · Белый", "#f8fafc"},
                {"9 кю · Жёлтый", "#facc15"},
                {"8 кю · Оранжевый", "#f97316"},
                {"7 кю · Зелёный", "#16a34a"},
                {"6 кю · Голубой", "#38bdf8"},
                {"5 кю · Синий", "#2563eb"},
                {"4 кю · Фиолетовый", "#7c3aed"},
                {"3 кю · Коричневый", "#92400e"},
                {"2 кю · Коричневый", "#92400e"},
                {"1 кю · Коричневый", "#92400e"},
                {"1 дан · Чёрный", "#111827"},
        };
        for (int i = 0; i < ladder.length; i++) {
            beltLevelRepository.save(BeltLevel.builder()
                    .club(club)
                    .name(ladder[i][0])
                    .color(ladder[i][1])
                    .sortOrder(i + 1)
                    .sessionsRequired(24)
                    .build());
        }
    }

    private record PresetBadge(String name, String description) {}
}
