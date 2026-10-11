package com.seishin.service;

import java.time.LocalDate;
import java.time.Period;

public final class AgeCalculator {

    private AgeCalculator() {
    }

    public static int age(LocalDate birthDate) {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}
