package com.clinicflow.billingService.dto;

import com.clinicflow.billingService.entity.ServiceItem;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceItemDTO {

    private Long serviceItemId;
    private String code;
    private String description;
    private Long patientId;
    private Long invoiceId;
    private BigDecimal price;
    private String department;
    private ServiceItem.BillingCategory billingCategory;
    private ServiceItem.ServiceStatus status;

    /**
     * Converts DTO to Entity for database persistence.
     */
    public ServiceItem toEntity() {
        return ServiceItem.builder()
                .serviceItemId(this.serviceItemId)
                .code(this.code)
                .description(this.description)
                .patientId(this.patientId)
                .invoiceId(this.invoiceId)
                .price(this.price)
                .department(this.department)
                .billingCategory(this.billingCategory)
                .status(this.status != null ? this.status : ServiceItem.ServiceStatus.ACTIVE)
                .build();
    }

    /**
     * Converts Entity to DTO for API responses.
     */
    public static ServiceItemDTO fromEntity(ServiceItem entity) {
        return ServiceItemDTO.builder()
                .serviceItemId(entity.getServiceItemId())
                .code(entity.getCode())
                .description(entity.getDescription())
                .patientId(entity.getPatientId())
                .invoiceId(entity.getInvoiceId())
                .price(entity.getPrice())
                .department(entity.getDepartment())
                .billingCategory(entity.getBillingCategory())
                .status(entity.getStatus())
                .build();
    }
}