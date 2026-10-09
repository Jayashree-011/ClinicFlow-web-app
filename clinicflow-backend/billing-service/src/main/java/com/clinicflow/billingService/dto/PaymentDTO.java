package com.clinicflow.billingService.dto;

import com.clinicflow.billingService.entity.Payment;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {

    private Long paymentId;
    private Long invoiceId;
    private Long patientId;
    private BigDecimal amount;
    private Payment.PaymentMethod paymentMethod;
    private LocalDateTime paidAt;
    private Payment.PaymentStatus status;

    /**
     * Converts this DTO into a Payment Entity.
     * Useful for saving data from a POST/PUT request.
     */
    public Payment toEntity() {
        return Payment.builder()
                .invoiceId(this.invoiceId)
                .patientId(this.patientId)
                .amount(this.amount)
                .paymentMethod(this.paymentMethod)
                .paidAt(this.paidAt != null ? this.paidAt : LocalDateTime.now())
                .status(this.status)
                .build();
    }

    /**
     * Optional: Static factory method to create a DTO from an Entity.
     * Useful for sending data back to the client.
     */
    public static PaymentDTO fromEntity(Payment payment) {
        return PaymentDTO.builder()
                .paymentId(payment.getPaymentId())
                .invoiceId(payment.getInvoiceId())
                .patientId(payment.getPatientId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paidAt(payment.getPaidAt())
                .status(payment.getStatus())
                .build();
    }
}