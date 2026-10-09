package com.clinicflow.Encounter.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "encounter")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Encounter {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long encounterId;
    
    @Column(name = "patient_id", nullable = false)
    private Long patientId;
    
    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;
    
    @Column(name = "visit_type", nullable = false)
    private String visitType;
    
    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;
    
    @Column(name = "vitals", columnDefinition = "JSON")
    private String vitals;
    
    @Column(name = "notes", columnDefinition = "JSON")
    private String notes;
    
    @Column(name = "diagnoses", columnDefinition = "JSON")
    private String diagnoses;
    
    @Column(name = "orders", columnDefinition = "JSON")
    private String orders;
    
    @Column(name = "prescriptions", columnDefinition = "JSON")
    private String prescriptions;
    
    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;
    
    @Column(name = "end_at")
    private LocalDateTime endAt;
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private EncounterStatus status;
    
    @Column(name = "signed_by")
    private Long signedBy;
    
    @Column(name = "signed_at")
    private LocalDateTime signedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Version
    @Column(name = "version")
    private Long version;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = EncounterStatus.IN_PROGRESS;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
