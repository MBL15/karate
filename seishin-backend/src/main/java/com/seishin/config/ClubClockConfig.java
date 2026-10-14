package com.seishin.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;
import java.util.TimeZone;

@Configuration
public class ClubClockConfig {

    @Value("${seishin.zone:Asia/Yekaterinburg}")
    private String zone;

    @PostConstruct
    void applyZone() {
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of(zone)));
    }
}
