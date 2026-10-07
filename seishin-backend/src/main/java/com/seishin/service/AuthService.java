package com.seishin.service;

import com.seishin.domain.entity.Club;
import com.seishin.domain.entity.InviteCode;
import com.seishin.domain.entity.OtpToken;
import com.seishin.domain.entity.ParentStudentLink;
import com.seishin.domain.entity.User;
import com.seishin.domain.enums.Role;
import com.seishin.repository.ClubRepository;
import com.seishin.repository.GroupStudentRepository;
import com.seishin.repository.InviteCodeRepository;
import com.seishin.repository.OtpTokenRepository;
import com.seishin.repository.ParentStudentLinkRepository;
import com.seishin.repository.UserRepository;
import com.seishin.security.JwtTokenProvider;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.auth.AuthResponseDto;
import com.seishin.web.dto.auth.CompleteProfileDto;
import com.seishin.web.dto.auth.InviteLinkDto;
import com.seishin.web.dto.auth.LoginDto;
import com.seishin.web.dto.auth.OtpRequestDto;
import com.seishin.web.dto.auth.OtpVerifyDto;
import com.seishin.web.dto.auth.RegisterDto;
import com.seishin.web.exception.BadRequestException;
import com.seishin.web.exception.NotFoundException;
import com.seishin.web.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final ParentStudentLinkRepository parentStudentLinkRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${seishin.otp.ttl-minutes:5}")
    private int otpTtlMinutes;

    @Value("${seishin.otp.dev-code:123456}")
    private String devOtpCode;

    @Transactional
    public AuthResponseDto register(RegisterDto dto) {
        String login = normalizeLogin(dto.getLogin());
        if (userRepository.findByLogin(login).isPresent()) {
            throw new BadRequestException("Этот логин уже занят");
        }
        String first = dto.getFirstName().trim();
        String last = dto.getLastName() == null ? "" : dto.getLastName().trim();
        String name;
        Club club = null;
        if (dto.getRole() == Role.COACH) {
            if (last.isEmpty()) {
                throw new BadRequestException("Укажите фамилию");
            }
            name = first + " " + last;
            club = resolveCoachClub(dto.getClubName());
        } else {
            name = last.isEmpty() ? first : first + " " + last;
        }
        User user = userRepository.save(User.builder()
                .login(login)
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .role(dto.getRole())
                .name(name)
                .club(club)
                .build());
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponseDto login(LoginDto dto) {
        User user = userRepository.findByLogin(normalizeLogin(dto.getLogin()))
                .orElseThrow(() -> new UnauthorizedException("Неверный логин или пароль"));
        if (user.getRole() != dto.getRole()) {
            throw new BadRequestException("Роль не совпадает с учётной записью");
        }
        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Неверный логин или пароль");
        }
        return buildAuthResponse(user);
    }

    private String normalizeLogin(String login) {
        return login.trim().toLowerCase();
    }

    private String normalizeInviteCode(String raw) {
        String code = raw == null ? "" : raw.trim();
        if (!code.matches("\\d{6}")) {
            throw new BadRequestException("Код — 6 цифр");
        }
        return code;
    }

    @Transactional
    public Map<String, String> requestOtp(OtpRequestDto dto) {
        User user = userRepository.findByPhone(dto.getPhone())
                .orElseThrow(() -> new NotFoundException("Пользователь не найден. Сначала зарегистрируйтесь"));
        if (user.getRole() != dto.getRole()) {
            throw new BadRequestException("Роль не совпадает с учётной записью");
        }
        issueOtp(dto.getPhone(), dto.getRole());
        return Map.of(
                "message", "OTP отправлен (тестовый код: " + devOtpCode + ")",
                "expiresInMinutes", String.valueOf(otpTtlMinutes));
    }

    private void issueOtp(String phone, Role role) {
        OtpToken token = OtpToken.builder()
                .phone(phone)
                .code(devOtpCode)
                .role(role)
                .expiresAt(Instant.now().plus(otpTtlMinutes, ChronoUnit.MINUTES))
                .used(false)
                .build();
        otpTokenRepository.save(token);
        log.info("[MOCK SMS OTP] phone={} role={} code={}", phone, role, devOtpCode);
    }

    private Club resolveCoachClub(String clubName) {
        if (clubName != null && !clubName.isBlank()) {
            String name = clubName.trim();
            return clubRepository.findByName(name)
                    .orElseGet(() -> clubRepository.save(Club.builder().name(name).build()));
        }
        return clubRepository.findByName("Karate Hub")
                .or(() -> clubRepository.findAll().stream().findFirst())
                .orElseGet(() -> clubRepository.save(Club.builder().name("Karate Hub").build()));
    }

    @Transactional
    public void completeCoachProfile(UserPrincipal principal, CompleteProfileDto dto) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            String email = dto.getEmail().trim();
            if (!email.contains("@")) {
                throw new BadRequestException("Укажите корректный email");
            }
            user.setEmail(email);
        }
        if (dto.getBirthDate() != null) {
            user.setBirthDate(dto.getBirthDate());
        }
        if (dto.getExperienceYears() != null) {
            user.setCoachExperienceYears(dto.getExperienceYears());
        }
        if (dto.getKarateStyle() != null && !dto.getKarateStyle().isBlank()) {
            user.setKarateStyle(dto.getKarateStyle().trim());
        }
        userRepository.save(user);
    }

    @Transactional
    public AuthResponseDto verifyOtp(OtpVerifyDto dto) {
        OtpToken token = otpTokenRepository.findTopByPhoneAndUsedFalseOrderByExpiresAtDesc(dto.getPhone())
                .orElseThrow(() -> new UnauthorizedException("OTP не найден"));
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("OTP истёк");
        }
        if (!token.getCode().equals(dto.getCode()) || token.getRole() != dto.getRole()) {
            throw new UnauthorizedException("Неверный OTP");
        }
        token.setUsed(true);
        otpTokenRepository.save(token);
        User user = userRepository.findByPhone(dto.getPhone())
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> lookupInvite(InviteLinkDto dto) {
        String code = normalizeInviteCode(dto.getCode());
        Club club = clubRepository.findByJoinCode(code).orElse(null);
        if (club != null) {
            Map<String, Object> body = new HashMap<>();
            body.put("kind", "CLUB");
            body.put("clubName", club.getName());
            return body;
        }
        InviteCode invite = inviteCodeRepository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new BadRequestException("Неверный код"));
        if (invite.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Код приглашения истёк");
        }
        Map<String, Object> body = new HashMap<>();
        body.put("clubName", invite.getClub().getName());
        if (invite.getStudent() == null) {
            body.put("kind", "CLUB");
            return body;
        }
        body.put("kind", "STUDENT");
        body.put("studentName", invite.getStudent().getFirstName() + " " + invite.getStudent().getLastName());
        return body;
    }

    @Transactional
    public Map<String, Object> linkByInvite(UserPrincipal parent, InviteLinkDto dto) {
        String code = normalizeInviteCode(dto.getCode());
        if (clubRepository.findByJoinCode(code).isPresent()) {
            throw new BadRequestException("Это код клуба — укажите данные ребёнка");
        }
        InviteCode invite = inviteCodeRepository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new BadRequestException("Неверный или использованный код"));
        if (invite.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Код приглашения истёк");
        }
        if (invite.getStudent() == null) {
            throw new BadRequestException("Это код клуба — используйте его при добавлении ребёнка");
        }
        if (parentStudentLinkRepository.existsByParentIdAndStudentId(parent.getId(), invite.getStudent().getId())) {
            throw new BadRequestException("Ребёнок уже привязан");
        }
        var student = invite.getStudent();
        parentStudentLinkRepository.save(ParentStudentLink.builder()
                .parent(userRepository.getReferenceById(parent.getId()))
                .student(student)
                .build());
        invite.setUsedAt(Instant.now());
        invite.setUsedByParent(userRepository.getReferenceById(parent.getId()));
        invite.setActive(false);
        inviteCodeRepository.save(invite);
        String groupName = groupStudentRepository.findByStudentId(student.getId()).stream()
                .findFirst()
                .map(link -> link.getGroup().getName())
                .orElse(null);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Ребёнок успешно привязан");
        body.put("studentId", student.getId());
        body.put("studentName", student.getFirstName() + " " + student.getLastName());
        body.put("age", AgeCalculator.age(student.getBirthDate()));
        body.put("clubName", student.getClub().getName());
        if (groupName != null) {
            body.put("groupName", groupName);
        }
        return body;
    }

    private AuthResponseDto buildAuthResponse(User user) {
        return AuthResponseDto.builder()
                .token(jwtTokenProvider.createToken(user))
                .userId(user.getId())
                .name(user.getName())
                .login(user.getLogin())
                .phone(user.getPhone())
                .role(user.getRole())
                .clubId(user.getClub() != null ? user.getClub().getId() : null)
                .build();
    }
}
