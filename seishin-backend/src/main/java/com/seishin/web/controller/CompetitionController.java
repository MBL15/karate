package com.seishin.web.controller;

import com.seishin.security.SecurityUtils;
import com.seishin.service.CompetitionService;
import com.seishin.web.dto.coach.RegistrationResultDto;
import com.seishin.web.dto.competition.CategoryOverrideDto;
import com.seishin.web.dto.competition.CompetitionDto;
import com.seishin.web.dto.competition.CreateCompetitionDto;
import com.seishin.web.dto.competition.RegistrationDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coach/competitions")
@RequiredArgsConstructor
public class CompetitionController {

    private final CompetitionService competitionService;

    @GetMapping
    public ResponseEntity<List<CompetitionDto>> list() {
        return ResponseEntity.ok(competitionService.listForCoach(SecurityUtils.requireCoach()));
    }

    @PostMapping
    public ResponseEntity<CompetitionDto> create(@Valid @RequestBody CreateCompetitionDto dto) {
        return ResponseEntity.ok(competitionService.createCompetition(SecurityUtils.requireCoach(), dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompetitionDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(competitionService.getCompetition(SecurityUtils.requireCoach(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        competitionService.deleteCompetition(SecurityUtils.requireCoach(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/auto-categorize")
    public ResponseEntity<CompetitionDto> autoCategorize(@PathVariable Long id) {
        return ResponseEntity.ok(competitionService.autoCategorize(SecurityUtils.requireCoach(), id));
    }

    @PatchMapping("/registrations/{registrationId}/category")
    public ResponseEntity<RegistrationDto> overrideCategory(
            @PathVariable Long registrationId,
            @Valid @RequestBody CategoryOverrideDto dto) {
        return ResponseEntity.ok(competitionService.overrideCategory(SecurityUtils.requireCoach(), registrationId, dto));
    }

    @PatchMapping("/registrations/{registrationId}/result")
    public ResponseEntity<RegistrationDto> updateResult(
            @PathVariable Long registrationId,
            @Valid @RequestBody RegistrationResultDto dto) {
        return ResponseEntity.ok(competitionService.updateResult(SecurityUtils.requireCoach(), registrationId, dto));
    }

    @DeleteMapping("/registrations/{registrationId}/result")
    public ResponseEntity<RegistrationDto> clearResult(@PathVariable Long registrationId) {
        return ResponseEntity.ok(competitionService.clearResult(SecurityUtils.requireCoach(), registrationId));
    }

    @GetMapping("/{id}/export.xlsx")
    public ResponseEntity<byte[]> export(@PathVariable Long id) {
        byte[] data = competitionService.exportExcel(SecurityUtils.requireCoach(), id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=competition-" + id + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
