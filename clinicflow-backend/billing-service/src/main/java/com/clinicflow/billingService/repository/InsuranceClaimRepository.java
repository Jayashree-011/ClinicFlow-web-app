package com.clinicflow.billingService.repository;
import com.clinicflow.billingService.entity.InsuranceClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface InsuranceClaimRepository extends JpaRepository<InsuranceClaim, Long> {
    List<InsuranceClaim> findByPatientId(Long patientId);
    List<InsuranceClaim> findByStatus(String status);
    java.util.Optional<InsuranceClaim> findByInvoiceId(Long invoiceId);
}