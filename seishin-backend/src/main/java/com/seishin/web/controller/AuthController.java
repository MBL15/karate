package com.seishin.web.controller;

import com.seishin.security.SecurityUtils;
import com.seishin.service.AuthService;
import com.seishin.web.dto.auth.AuthResponseDto;
import com.seishin.web.dto.auth.InviteLinkDto;
import com.seishin.web.dto.auth.OtpRequestDto;
import com.seishin.web.dto.auth.OtpVerifyDto;
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
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterDto dto) {
        return ResponseEntity.ok(authService.register(dto));
    }

    @PostMapping("/otp/request")
    public ResponseEntity<Map<String, String>> requestOtp(@Valid @RequestBody OtpRequestDto dto) {
        return ResponseEntity.ok(authService.requestOtp(dto));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponseDto> verifyOtp(@Valid @RequestBody OtpVerifyDto dto) {
        return ResponseEntity.ok(authService.verifyOtp(dto));
    }

    @PostMapping("/invite/link")
    public ResponseEntity<Map<String, Object>> linkInvite(@Valid @RequestBody InviteLinkDto dto) {
        return ResponseEntity.ok(authService.linkByInvite(SecurityUtils.requireParent(), dto));
    }
}
