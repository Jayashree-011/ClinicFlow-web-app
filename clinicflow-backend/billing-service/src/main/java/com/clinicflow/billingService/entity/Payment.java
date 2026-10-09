package com.clinicflow.billingService.entity;
import java.time.LocalDateTime;
import java.math.BigDecimal;    
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;    
@Entity
@Table(name = "payments")
@Getter
@Setter 
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    @Column(nullable = false)
    private Long invoiceId;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column(nullable = false)
    private LocalDateTime paidAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)   
    private PaymentStatus status;

    public enum PaymentMethod {
        CASH,
        CREDIT_CARD,
        DEBIT_CARD,
        INSURANCE,
        MOBILE_PAYMENT,
        OTHER
    }
    public enum PaymentStatus {
        COMPLETED,
        PENDING,
        FAILED,
        REFUNDED
    }
}
    