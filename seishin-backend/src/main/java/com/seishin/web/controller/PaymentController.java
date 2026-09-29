package com.seishin.web.controller;

import com.seishin.security.SecurityUtils;
import com.seishin.service.PaymentService;
import com.seishin.web.dto.payment.PaymentDto;
import com.seishin.web.dto.payment.UpdatePaymentDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<List<PaymentDto>> list() {
        return ResponseEntity.ok(paymentService.listPayments(SecurityUtils.currentUser()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PaymentDto> update(@PathVariable Long id, @Valid @RequestBody UpdatePaymentDto dto) {
        return ResponseEntity.ok(paymentService.updatePayment(SecurityUtils.requireCoach(), id, dto));
    }

    @PostMapping("/reminders")
    public ResponseEntity<List<Map<String, Object>>> sendReminders() {
        return ResponseEntity.ok(paymentService.sendReminders(SecurityUtils.requireCoach()));
    }
}
