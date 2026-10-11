package com.seishin.web.controller;

import com.seishin.security.SecurityUtils;
import com.seishin.service.AuthService;
import com.seishin.web.dto.auth.AuthResponseDto;
import com.seishin.web.dto.auth.CompleteProfileDto;
import com.seishin.web.dto.auth.InviteLinkDto;
import com.seishin.web.dto.auth.LoginDto;
import com.seishin.web.dto.auth.RegisterDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterDto dto) {
        return ResponseEntity.ok(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginDto dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @PostMapping("/profile")
    public ResponseEntity<Void> completeProfile(@Valid @RequestBody CompleteProfileDto dto) {
        authService.completeCoachProfile(SecurityUtils.requireCoach(), dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invite/lookup")
    public ResponseEntity<Map<String, Object>> lookupInvite(@Valid @RequestBody InviteLinkDto dto) {
        SecurityUtils.requireParent();
        return ResponseEntity.ok(authService.lookupInvite(dto));
    }

    @PostMapping("/invite/link")
    public ResponseEntity<Map<String, Object>> linkInvite(@Valid @RequestBody InviteLinkDto dto) {
        return ResponseEntity.ok(authService.linkByInvite(SecurityUtils.requireParent(), dto));
    }
}
