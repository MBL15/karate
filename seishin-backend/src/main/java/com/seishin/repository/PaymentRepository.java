package com.seishin.repository;

import com.seishin.domain.entity.Payment;
import com.seishin.domain.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStudentId(Long studentId);

    List<Payment> findByParentId(Long parentId);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByStudentClubId(Long clubId);
}
