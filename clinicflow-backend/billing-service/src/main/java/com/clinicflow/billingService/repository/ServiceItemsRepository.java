package com.clinicflow.billingService.repository;
import com.clinicflow.billingService.entity.ServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ServiceItemsRepository extends JpaRepository<ServiceItem, Long> {
    List<ServiceItem> findByInvoiceId(Long invoiceId);
    List<ServiceItem> findByPatientId(Long patientId);
    List<ServiceItem> findByBillingCategory(ServiceItem.BillingCategory billingCategory);
}