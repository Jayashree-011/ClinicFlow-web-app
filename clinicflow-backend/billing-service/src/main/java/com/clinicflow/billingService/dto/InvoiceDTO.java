
package com.clinicflow.billingService.dto;

import com.clinicflow.billingService.entity.Invoice;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class InvoiceDTO {
    private Long patientId;
    private String patientName;   // populated from consultation-service by the controller
    private Long encounterId;
    private Long appointmentId;
    private Long prescriptionId;
    private Long labOrderId;
    private Double amount;
    private Double taxes;
    private Double discounts;
    private String status; // e.g., PENDING, PAID

    public InvoiceDTO(Invoice invoice) {
        this.patientId   = invoice.getPatientId();
        this.patientName = invoice.getPatientName();
        this.encounterId = invoice.getEncounterId();
        this.amount      = invoice.getTotalAmount().doubleValue();
        this.status      = invoice.getStatus().name();
        this.taxes       = invoice.getTaxes()     != null ? invoice.getTaxes().doubleValue()     : null;
        this.discounts   = invoice.getDiscounts() != null ? invoice.getDiscounts().doubleValue() : null;
    }

    public Invoice toEntity() {
        Invoice invoice = new Invoice();
        invoice.setPatientId(this.patientId);
        invoice.setPatientName(this.patientName);
        invoice.setEncounterId(this.encounterId);
        invoice.setAppointmentId(this.appointmentId);
        invoice.setPrescriptionId(this.prescriptionId);
        invoice.setLabOrderId(this.labOrderId);
        invoice.setStatus(Invoice.InvoiceStatus.valueOf(this.status));
        invoice.setSubtotal(  this.amount    != null ? new java.math.BigDecimal(this.amount)    : java.math.BigDecimal.ZERO);
        invoice.setTaxes(     this.taxes     != null ? new java.math.BigDecimal(this.taxes)     : java.math.BigDecimal.ZERO);
        invoice.setDiscounts( this.discounts != null ? new java.math.BigDecimal(this.discounts) : java.math.BigDecimal.ZERO);
        return invoice;
    }
}