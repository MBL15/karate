package com.seishin.security;

import com.seishin.domain.enums.Role;
import com.seishin.web.exception.ForbiddenException;
import com.seishin.web.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UserPrincipal currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Требуется авторизация");
        }
        return principal;
    }

    public static UserPrincipal requireCoach() {
        UserPrincipal user = currentUser();
        if (user.getRole() != Role.COACH) {
            throw new ForbiddenException("Доступ только для тренера");
        }
        return user;
    }

    public static UserPrincipal requireParent() {
        UserPrincipal user = currentUser();
        if (user.getRole() != Role.PARENT) {
            throw new ForbiddenException("Доступ только для родителя");
        }
        return user;
    }
}
