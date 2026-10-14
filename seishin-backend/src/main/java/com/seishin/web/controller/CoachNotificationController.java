package com.seishin.web.controller;

import com.seishin.security.SecurityUtils;
import com.seishin.service.CoachNotificationService;
import com.seishin.web.dto.coach.CoachNotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coach/notifications")
@RequiredArgsConstructor
public class CoachNotificationController {

    private final CoachNotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<CoachNotificationDto>> list() {
        return ResponseEntity.ok(notificationService.listForCoach(SecurityUtils.requireCoach()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        long count = notificationService.unreadCount(SecurityUtils.requireCoach());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(SecurityUtils.requireCoach(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead(SecurityUtils.requireCoach());
        return ResponseEntity.noContent().build();
    }
}
