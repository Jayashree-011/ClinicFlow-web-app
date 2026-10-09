package com.clinicflow.lab.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_order")
public class LabOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long labOrderId;

    private Long encounterId;
    private Long patientId;
    private Long orderedBy;

    @Column(columnDefinition = "TEXT")
    private String testsJson;

    private String sampleId;
    private LocalDateTime collectedAt;
    private String status;
    private String resultUri;

    // Getters and Setters
    public Long getLabOrderId() {
        return labOrderId;
    }

    public void setLabOrderId(Long labOrderId) {
        this.labOrderId = labOrderId;
    }

    public Long getEncounterId() {
        return encounterId;
    }

    public void setEncounterId(Long encounterId) {
        this.encounterId = encounterId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getOrderedBy() {
        return orderedBy;
    }

    public void setOrderedBy(Long orderedBy) {
        this.orderedBy = orderedBy;
    }

    public String getTestsJson() {
        return testsJson;
    }

    public void setTestsJson(String testsJson) {
        this.testsJson = testsJson;
    }

    public String getSampleId() {
        return sampleId;
    }

    public void setSampleId(String sampleId) {
        this.sampleId = sampleId;
    }

    public LocalDateTime getCollectedAt() {
        return collectedAt;
    }

    public void setCollectedAt(LocalDateTime collectedAt) {
        this.collectedAt = collectedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResultUri() {
        return resultUri;
    }

    public void setResultUri(String resultUri) {
        this.resultUri = resultUri;
    }
}