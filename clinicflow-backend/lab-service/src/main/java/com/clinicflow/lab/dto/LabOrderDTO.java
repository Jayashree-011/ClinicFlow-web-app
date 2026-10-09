package com.clinicflow.lab.dto;

import java.time.LocalDateTime;

public class LabOrderDTO {

    private Long labOrderId;
    private Long encounterId;
    private Long patientId;
    private Long orderedBy;
    private String testsJson;
    private String sampleId;
    private LocalDateTime collectedAt;
    private String status;
    private String resultUri;

    // Constructors, Getters and Setters
    public LabOrderDTO() {}

    public LabOrderDTO(Long labOrderId, Long encounterId, Long patientId, Long orderedBy, String testsJson, String sampleId, LocalDateTime collectedAt, String status, String resultUri) {
        this.labOrderId = labOrderId;
        this.encounterId = encounterId;
        this.patientId = patientId;
        this.orderedBy = orderedBy;
        this.testsJson = testsJson;
        this.sampleId = sampleId;
        this.collectedAt = collectedAt;
        this.status = status;
        this.resultUri = resultUri;
    }

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