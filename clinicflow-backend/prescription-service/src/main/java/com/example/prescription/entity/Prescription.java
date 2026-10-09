package com.clinicflow.prescription.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "prescription")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rxId;

    private Long encounterId;
    private Long patientId;
    private Long doctorId;

    // ✅ Only FK reference (correct for microservice)
    private Long medId;
    private String medicationName;

    private String dosage;
    private String frequency;
    private Integer durationDays;
    private Integer quantity;
    private Integer repeats;
    private String route;
    private String notes;

    @Enumerated(EnumType.STRING)
    private PrescriptionStatus status;

    private LocalDateTime issuedAt;
}
