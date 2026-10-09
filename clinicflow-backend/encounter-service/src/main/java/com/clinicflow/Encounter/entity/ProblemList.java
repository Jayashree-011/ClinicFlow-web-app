package com.clinicflow.Encounter.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "problem_list")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProblemList {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long problemId;
    
    @Column(name = "patient_id", nullable = false)
    private Long patientId;
    
    @Column(name = "encounter_id", nullable = false)
    private Long encounterId;
    
    @Column(name = "code", nullable = false)
    private String code;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "onset_date")
    private LocalDate onsetDate;
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ProblemStatus status;
    
    @Column(name = "icd_code")
    private String icdCode;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ProblemStatus.ACTIVE;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
