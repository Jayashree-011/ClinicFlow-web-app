package com.clinicflow.billingService.entity;
import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "insurance_claims")
@Getter
@Setter
@Builder    
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceClaim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long claimId;

    @Column(nullable = false)
    private Long invoiceId;

    @Column(nullable = false)
    private Long patientId;

    @Column(columnDefinition = "TEXT")
    private String claimPayloadJson; // e.g., {"serviceItemId": 1, "amount": 100.00}

    @Column(columnDefinition = "TEXT")
    private String responseJson; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)   
    private ClaimStatus status;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    public enum ClaimStatus {
        SUBMITTED,
        APPROVED,
        REJECTED,
        PENDING
    }
}
    