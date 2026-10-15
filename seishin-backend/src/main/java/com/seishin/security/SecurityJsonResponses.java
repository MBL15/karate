package com.seishin.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

final class SecurityJsonResponses {

    private SecurityJsonResponses() {
    }

    static void write(HttpServletResponse response, int status, String error, String message) throws IOException {
        String body = """
                {"timestamp":"%s","status":%d,"error":"%s","message":"%s"}
                """.formatted(Instant.now(), status, jsonEscape(error), jsonEscape(message)).trim();
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));
    }

    private static String jsonEscape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
