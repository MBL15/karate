package com.seishin.web.controller;

import com.seishin.security.SecurityUtils;
import com.seishin.service.ChatService;
import com.seishin.service.DocumentService;
import com.seishin.service.ParentService;
import com.seishin.service.PaymentService;
import com.seishin.web.dto.chat.ChatMessageDto;
import com.seishin.web.dto.chat.ChatThreadDto;
import com.seishin.web.dto.chat.SendChatMessageDto;
import com.seishin.web.dto.common.StudentSummaryDto;
import com.seishin.web.dto.competition.RegistrationDto;
import com.seishin.web.dto.document.DocumentDto;
import com.seishin.web.dto.parent.*;
import com.seishin.web.dto.payment.PaymentDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parent")
@RequiredArgsConstructor
public class ParentController {

    private final ParentService parentService;
    private final PaymentService paymentService;
    private final DocumentService documentService;
    private final ChatService chatService;

    @GetMapping("/children")
    public ResponseEntity<List<StudentSummaryDto>> children() {
        return ResponseEntity.ok(parentService.listChildren(SecurityUtils.requireParent()));
    }

    @PostMapping("/children")
    public ResponseEntity<StudentSummaryDto> createChild(@Valid @RequestBody CreateChildDto dto) {
        return ResponseEntity.ok(parentService.createChild(SecurityUtils.requireParent(), dto));
    }

    @GetMapping("/children/{id}/home")
    public ResponseEntity<ParentChildHomeDto> home(@PathVariable Long id) {
        return ResponseEntity.ok(parentService.getChildHome(SecurityUtils.requireParent(), id));
    }

    @GetMapping("/children/{id}/profile")
    public ResponseEntity<ParentChildProfileDto> profile(@PathVariable Long id) {
        return ResponseEntity.ok(parentService.getChildProfile(SecurityUtils.requireParent(), id));
    }

    @GetMapping("/children/{id}/achievements")
    public ResponseEntity<List<AchievementDto>> achievements(@PathVariable Long id) {
        return ResponseEntity.ok(parentService.getAchievements(SecurityUtils.requireParent(), id));
    }

    @GetMapping("/children/{id}/history")
    public ResponseEntity<List<HistoryEntryDto>> history(@PathVariable Long id) {
        return ResponseEntity.ok(parentService.getHistory(SecurityUtils.requireParent(), id));
    }

    @GetMapping("/children/{id}/payments")
    public ResponseEntity<List<PaymentDto>> childPayments(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.listForParentChild(SecurityUtils.requireParent(), id));
    }

    @GetMapping("/competitions")
    public ResponseEntity<List<UpcomingCompetitionDto>> competitions() {
        return ResponseEntity.ok(parentService.listCompetitionsForParent(SecurityUtils.requireParent()));
    }

    @PostMapping("/competitions/{competitionId}/respond")
    public ResponseEntity<RegistrationDto> respond(
            @PathVariable Long competitionId,
            @Valid @RequestBody CompetitionRsvpDto dto) {
        return ResponseEntity.ok(parentService.respondCompetition(SecurityUtils.requireParent(), competitionId, dto));
    }

    @GetMapping("/documents")
    public ResponseEntity<List<DocumentDto>> documents() {
        return ResponseEntity.ok(documentService.listForParent(SecurityUtils.requireParent()));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<DocumentDto> document(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(SecurityUtils.requireParent(), id));
    }

    @GetMapping("/chat/threads")
    public ResponseEntity<List<ChatThreadDto>> chatThreads(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(chatService.listThreadsForParent(SecurityUtils.requireParent(), q));
    }

    @GetMapping("/children/{id}/messages")
    public ResponseEntity<List<ChatMessageDto>> messages(@PathVariable Long id) {
        return ResponseEntity.ok(chatService.listForParent(SecurityUtils.requireParent(), id));
    }

    @GetMapping("/chat/groups/{groupId}/messages")
    public ResponseEntity<List<ChatMessageDto>> groupMessages(@PathVariable Long groupId) {
        return ResponseEntity.ok(chatService.listGroupForParent(SecurityUtils.requireParent(), groupId));
    }

    @PostMapping("/chat/groups/{groupId}/messages")
    public ResponseEntity<ChatMessageDto> sendGroupMessage(
            @PathVariable Long groupId,
            @Valid @RequestBody SendChatMessageDto dto) {
        return ResponseEntity.ok(chatService.sendGroupForParent(SecurityUtils.requireParent(), groupId, dto));
    }

    @PostMapping("/children/{id}/messages")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendChatMessageDto dto) {
        return ResponseEntity.ok(chatService.sendForParent(SecurityUtils.requireParent(), id, dto));
    }
}
