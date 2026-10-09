package com.clinicflow.billingService.repository;
import com.clinicflow.billingService.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByPatientId(Long patientId);
    List<Payment> findByInvoiceId(Long invoiceId);
}