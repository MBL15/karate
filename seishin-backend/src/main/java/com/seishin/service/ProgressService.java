package com.seishin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final BeltProgressService beltProgressService;

    @Transactional
    public void recalculateProgress(Long studentId) {
        beltProgressService.recalculateProgress(studentId);
    }
}
