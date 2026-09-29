package com.seishin.service;

import com.seishin.domain.entity.Payment;
import com.seishin.domain.enums.PaymentStatus;
import com.seishin.domain.enums.Role;
import com.seishin.repository.PaymentRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.payment.PaymentDto;
import com.seishin.web.dto.payment.UpdatePaymentDto;
import com.seishin.web.exception.ForbiddenException;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ParentAccessService parentAccessService;

    public List<PaymentDto> listPayments(UserPrincipal user) {
        List<Payment> payments;
        if (user.getRole() == Role.COACH) {
            payments = paymentRepository.findByStudentClubId(user.getClubId());
        } else {
            payments = paymentRepository.findByParentId(user.getId());
        }
        return payments.stream().map(this::toDto).toList();
    }

    @Transactional
    public PaymentDto updatePayment(UserPrincipal coach, Long paymentId, UpdatePaymentDto dto) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Платёж не найден"));
        if (!payment.getStudent().getClub().getId().equals(coach.getClubId())) {
            throw new ForbiddenException("Платёж другого клуба");
        }
        payment.setStatus(dto.getStatus());
        if (dto.getStatus() == PaymentStatus.PAID) {
            payment.setPaidDate(dto.getPaidDate() != null ? dto.getPaidDate() : LocalDate.now());
        }
        return toDto(paymentRepository.save(payment));
    }

    public List<Map<String, Object>> sendReminders(UserPrincipal coach) {
        List<Payment> overdue = paymentRepository.findByStudentClubId(coach.getClubId()).stream()
                .filter(p -> p.getStatus() == PaymentStatus.OVERDUE || p.getStatus() == PaymentStatus.PENDING)
                .filter(p -> p.getDueDate() != null && !p.getDueDate().isAfter(LocalDate.now().plusDays(7)))
                .toList();
        List<Map<String, Object>> reminders = new ArrayList<>();
        for (Payment p : overdue) {
            reminders.add(Map.of(
                    "paymentId", p.getId(),
                    "studentName", p.getStudent().getFirstName() + " " + p.getStudent().getLastName(),
                    "amount", p.getAmount(),
                    "status", p.getStatus().name(),
                    "message", "Напоминание об оплате отправлено (mock)"
            ));
        }
        return reminders;
    }

    public List<PaymentDto> listForParentChild(UserPrincipal parent, Long studentId) {
        parentAccessService.requireLinkedChild(parent, studentId);
        return paymentRepository.findByStudentId(studentId).stream().map(this::toDto).toList();
    }

    private PaymentDto toDto(Payment p) {
        return PaymentDto.builder()
                .id(p.getId())
                .studentId(p.getStudent().getId())
                .studentName(p.getStudent().getFirstName() + " " + p.getStudent().getLastName())
                .periodLabel(p.getPeriodLabel())
                .description(p.getDescription())
                .amount(p.getAmount())
                .status(p.getStatus())
                .dueDate(p.getDueDate())
                .paidDate(p.getPaidDate())
                .build();
    }
}
