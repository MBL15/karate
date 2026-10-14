package com.seishin.service;

import com.seishin.domain.entity.Payment;
import com.seishin.domain.entity.Student;
import com.seishin.domain.enums.PaymentStatus;
import com.seishin.domain.enums.Role;
import com.seishin.repository.PaymentRepository;
import com.seishin.repository.StudentRepository;
import com.seishin.security.UserPrincipal;
import com.seishin.web.dto.payment.CreatePaymentDto;
import com.seishin.web.dto.payment.PaymentDto;
import com.seishin.web.dto.payment.UpdatePaymentDto;
import com.seishin.web.exception.ForbiddenException;
import com.seishin.web.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ParentAccessService parentAccessService;
    private final StudentRepository studentRepository;

    private static final DateTimeFormatter MONTH_LABEL =
            DateTimeFormatter.ofPattern("LLLL yyyy", Locale.forLanguageTag("ru"));

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
    public PaymentDto ensureMonthlyPayment(UserPrincipal coach, CreatePaymentDto dto) {
        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new NotFoundException("Ученик не найден"));
        if (!student.getClub().getId().equals(coach.getClubId())) {
            throw new ForbiddenException("Ученик другого клуба");
        }
        LocalDate monthStart = dto.getMonth().withDayOfMonth(1);
        Payment existing = paymentRepository.findByStudentId(student.getId()).stream()
                .filter(p -> p.getDueDate() != null && p.getDueDate().withDayOfMonth(1).equals(monthStart))
                .findFirst()
                .orElse(null);
        if (existing != null) {
            return toDto(existing);
        }
        String label = monthStart.format(MONTH_LABEL);
        if (!label.isEmpty()) {
            label = label.substring(0, 1).toUpperCase(Locale.ROOT) + label.substring(1);
        }
        Payment payment = Payment.builder()
                .student(student)
                .amount(BigDecimal.ZERO)
                .periodLabel(label)
                .description(dto.getDescription() != null && !dto.getDescription().isBlank()
                        ? dto.getDescription().trim()
                        : "Абонемент за " + label.toLowerCase(Locale.ROOT))
                .status(PaymentStatus.PENDING)
                .dueDate(monthStart)
                .build();
        return toDto(paymentRepository.save(payment));
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
