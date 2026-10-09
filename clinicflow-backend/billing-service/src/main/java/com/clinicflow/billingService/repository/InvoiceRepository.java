package com.clinicflow.billingService.repository;
import com.clinicflow.billingService.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByPatientIdAndStatus(Long patientId, String status);
    List<Invoice> findByPatientId(Long patientId);
    Optional<Invoice> findByInvoiceId(Long invoiceId);
}