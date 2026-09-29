package com.seishin.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/login",
            "/register",
            "/for-parents",
            "/for-coaches",
            "/coach",
            "/coach/students",
            "/coach/awards",
            "/coach/competitions",
            "/coach/**",
            "/app",
            "/app/**",
            "/parent",
            "/profile",
            "/achievements",
            "/competition",
            "/history"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
