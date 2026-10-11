package com.seishin.web.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping(value = "/api/info", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> apiInfo() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "Karate Hub");
        body.put("status", "ok");
        body.put("docs", "README.md");
        body.put("auth", Map.of(
                "register", "POST /api/auth/register",
                "login", "POST /api/auth/login"
        ));
        body.put("h2Console", "/h2-console");
        return body;
    }

    @GetMapping(value = "/health", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
