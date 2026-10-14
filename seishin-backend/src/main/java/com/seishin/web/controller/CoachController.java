package com.seishin.web.controller;

import com.seishin.security.SecurityUtils;
import com.seishin.service.BeltService;
import com.seishin.service.ChatService;
import com.seishin.service.ClubProfileService;
import com.seishin.service.CoachService;
import com.seishin.service.ScheduleService;
import com.seishin.service.SessionPlanService;
import com.seishin.web.dto.chat.ChatMessageDto;
import com.seishin.web.dto.chat.ChatThreadDto;
import com.seishin.web.dto.chat.CreateChatGroupDto;
import com.seishin.web.dto.chat.SendChatMessageDto;
import com.seishin.web.dto.coach.*;
import com.seishin.web.dto.common.StudentSummaryDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachController {

    private final CoachService coachService;
    private final BeltService beltService;
    private final ScheduleService scheduleService;
    private final ChatService chatService;
    private final SessionPlanService sessionPlanService;
    private final ClubProfileService clubProfileService;

    @GetMapping("/dashboard")
    public ResponseEntity<CoachDashboardDto> dashboard() {
        return ResponseEntity.ok(coachService.getDashboard(SecurityUtils.requireCoach()));
    }

    @GetMapping("/students")
    public ResponseEntity<List<StudentSummaryDto>> listStudents() {
        return ResponseEntity.ok(coachService.listStudents(SecurityUtils.requireCoach()));
    }

    @PostMapping("/students")
    public ResponseEntity<StudentSummaryDto> createStudent(@Valid @RequestBody CreateStudentDto dto) {
        return ResponseEntity.ok(coachService.createStudent(SecurityUtils.requireCoach(), dto));
    }

    @DeleteMapping("/students/{studentId}")
    public ResponseEntity<Void> removeStudent(@PathVariable Long studentId) {
        coachService.removeStudent(SecurityUtils.requireCoach(), studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groups")
    public ResponseEntity<List<GroupSummaryDto>> listGroups() {
        return ResponseEntity.ok(coachService.listGroups(SecurityUtils.requireCoach()));
    }

    @GetMapping("/groups/{groupId}/students")
    public ResponseEntity<List<StudentSummaryDto>> listGroupStudents(@PathVariable Long groupId) {
        return ResponseEntity.ok(coachService.listGroupStudents(SecurityUtils.requireCoach(), groupId));
    }

    @PostMapping("/groups")
    public ResponseEntity<GroupSummaryDto> createGroup(@Valid @RequestBody CreateGroupDto dto) {
        return ResponseEntity.ok(coachService.createGroup(SecurityUtils.requireCoach(), dto));
    }

    @PostMapping("/groups/{groupId}/students/{studentId}")
    public ResponseEntity<Void> addStudentToGroup(
            @PathVariable Long groupId,
            @PathVariable Long studentId) {
        coachService.addStudentToGroup(SecurityUtils.requireCoach(), groupId, studentId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/groups/{groupId}/students/{studentId}")
    public ResponseEntity<Void> removeStudentFromGroup(
            @PathVariable Long groupId,
            @PathVariable Long studentId) {
        coachService.removeStudentFromGroup(SecurityUtils.requireCoach(), groupId, studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/badges")
    public ResponseEntity<List<BadgeDefinitionDto>> listBadges() {
        return ResponseEntity.ok(coachService.listBadges(SecurityUtils.requireCoach()));
    }

    @GetMapping("/badges/issued")
    public ResponseEntity<List<IssuedBadgeDto>> listIssuedBadges() {
        return ResponseEntity.ok(coachService.listIssuedBadges(SecurityUtils.requireCoach()));
    }

    @PostMapping("/students/{studentId}/belt")
    public ResponseEntity<StudentSummaryDto> assignBelt(
            @PathVariable Long studentId,
            @Valid @RequestBody AssignBeltDto dto) {
        return ResponseEntity.ok(coachService.assignBelt(SecurityUtils.requireCoach(), studentId, dto));
    }

    @PatchMapping("/students/{studentId}")
    public ResponseEntity<StudentSummaryDto> updateStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody UpdateStudentDto dto) {
        return ResponseEntity.ok(coachService.updateStudent(SecurityUtils.requireCoach(), studentId, dto));
    }

    @PatchMapping("/groups/{groupId}")
    public ResponseEntity<GroupSummaryDto> updateGroup(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateGroupDto dto) {
        return ResponseEntity.ok(coachService.updateGroup(SecurityUtils.requireCoach(), groupId, dto));
    }

    @GetMapping("/club/profile")
    public ResponseEntity<CoachClubProfileDto> clubProfile() {
        return ResponseEntity.ok(clubProfileService.getProfile(SecurityUtils.requireCoach()));
    }

    @PutMapping("/club/profile")
    public ResponseEntity<CoachClubProfileDto> updateClubProfile(@Valid @RequestBody CoachClubProfileDto dto) {
        return ResponseEntity.ok(clubProfileService.updateProfile(SecurityUtils.requireCoach(), dto));
    }

    @GetMapping("/sessions/plan")
    public ResponseEntity<SessionPlanDto> getSessionPlan(
            @RequestParam Long groupId,
            @RequestParam LocalDate sessionDate,
            @RequestParam java.time.LocalTime startTime) {
        SessionPlanDto dto = sessionPlanService.getPlan(groupId, sessionDate, startTime).orElseGet(() -> {
            SessionPlanDto empty = new SessionPlanDto();
            empty.setGroupId(groupId);
            empty.setSessionDate(sessionDate);
            empty.setStartTime(startTime);
            return empty;
        });
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/sessions/plan")
    public ResponseEntity<SessionPlanDto> saveSessionPlan(@Valid @RequestBody SessionPlanDto dto) {
        return ResponseEntity.ok(sessionPlanService.savePlan(SecurityUtils.requireCoach(), dto));
    }

    @GetMapping("/sessions/attendance")
    public ResponseEntity<SessionAttendanceDto> getSessionAttendance(
            @RequestParam Long groupId,
            @RequestParam LocalDate sessionDate,
            @RequestParam(required = false) java.time.LocalTime startTime) {
        var time = startTime != null ? startTime : java.time.LocalTime.of(17, 0);
        return ResponseEntity.ok(coachService.getSessionAttendance(
                SecurityUtils.requireCoach(), groupId, sessionDate, time));
    }

    @PostMapping("/sessions/attendance/bulk")
    public ResponseEntity<Void> bulkAttendance(@Valid @RequestBody BulkAttendanceDto dto) {
        coachService.recordBulkAttendance(SecurityUtils.requireCoach(), dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/badges/issue")
    public ResponseEntity<Void> issueBadge(@Valid @RequestBody IssueBadgeDto dto) {
        coachService.issueBadge(SecurityUtils.requireCoach(), dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/invite-codes")
    public ResponseEntity<InviteCodeResponseDto> createInviteCode(@Valid @RequestBody CreateInviteCodeDto dto) {
        return ResponseEntity.ok(coachService.createInviteCode(SecurityUtils.requireCoach(), dto));
    }

    @GetMapping("/belts")
    public ResponseEntity<List<BeltService.BeltLevelDto>> beltLadder() {
        return ResponseEntity.ok(beltService.listBeltLadder(SecurityUtils.requireCoach()));
    }

    @GetMapping("/belts/settings")
    public ResponseEntity<BeltSettingsDto> beltSettings() {
        return ResponseEntity.ok(beltService.getSettings(SecurityUtils.requireCoach()));
    }

    @PutMapping("/belts/settings")
    public ResponseEntity<BeltSettingsDto> updateBeltSettings(@Valid @RequestBody BeltSettingsDto dto) {
        return ResponseEntity.ok(beltService.updateSettings(SecurityUtils.requireCoach(), dto));
    }

    @PatchMapping("/belts/{beltLevelId}")
    public ResponseEntity<BeltService.BeltLevelDto> updateBeltLevel(
            @PathVariable Long beltLevelId,
            @Valid @RequestBody UpdateBeltLevelDto dto) {
        return ResponseEntity.ok(beltService.updateLevel(SecurityUtils.requireCoach(), beltLevelId, dto));
    }

    @GetMapping("/schedule")
    public ResponseEntity<List<ScheduleSlotDto>> listSchedule() {
        return ResponseEntity.ok(scheduleService.listSchedule(SecurityUtils.requireCoach()));
    }

    @PostMapping("/schedule")
    public ResponseEntity<ScheduleSlotDto> createSchedule(@Valid @RequestBody CreateScheduleDto dto) {
        return ResponseEntity.ok(scheduleService.createSlot(SecurityUtils.requireCoach(), dto));
    }

    @DeleteMapping("/schedule/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSlot(SecurityUtils.requireCoach(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/classes")
    public ResponseEntity<List<ClassEventDto>> listClasses(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        return ResponseEntity.ok(scheduleService.listClasses(SecurityUtils.requireCoach(), from, to));
    }

    @PostMapping("/classes/reminders")
    public ResponseEntity<List<TrainingReminderDto>> sendTrainingReminders(
            @Valid @RequestBody SendTrainingRemindersDto dto) {
        return ResponseEntity.ok(scheduleService.sendReminders(SecurityUtils.requireCoach(), dto));
    }

    @GetMapping("/chat/threads")
    public ResponseEntity<List<ChatThreadDto>> chatThreads(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(chatService.listThreadsForCoach(SecurityUtils.requireCoach(), q));
    }

    @PostMapping("/chat/groups")
    public ResponseEntity<ChatThreadDto> createChatGroup(@Valid @RequestBody CreateChatGroupDto dto) {
        return ResponseEntity.ok(chatService.createGroupForCoach(SecurityUtils.requireCoach(), dto));
    }

    @GetMapping("/chat/groups/{groupId}/messages")
    public ResponseEntity<List<ChatMessageDto>> groupMessages(@PathVariable Long groupId) {
        return ResponseEntity.ok(chatService.listGroupForCoach(SecurityUtils.requireCoach(), groupId));
    }

    @PostMapping("/chat/groups/{groupId}/messages")
    public ResponseEntity<ChatMessageDto> sendGroupMessage(
            @PathVariable Long groupId,
            @Valid @RequestBody SendChatMessageDto dto) {
        return ResponseEntity.ok(chatService.sendGroupForCoach(SecurityUtils.requireCoach(), groupId, dto));
    }

    @GetMapping("/students/{studentId}/messages")
    public ResponseEntity<List<ChatMessageDto>> studentMessages(@PathVariable Long studentId) {
        return ResponseEntity.ok(chatService.listForCoach(SecurityUtils.requireCoach(), studentId));
    }

    @PostMapping("/students/{studentId}/messages")
    public ResponseEntity<ChatMessageDto> sendStudentMessage(
            @PathVariable Long studentId,
            @Valid @RequestBody SendChatMessageDto dto) {
        return ResponseEntity.ok(chatService.sendForCoach(SecurityUtils.requireCoach(), studentId, dto));
    }
}
