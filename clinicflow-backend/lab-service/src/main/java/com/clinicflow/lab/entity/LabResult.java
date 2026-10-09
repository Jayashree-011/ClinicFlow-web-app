package com.clinicflow.lab.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_result")
public class LabResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long resultId;

    private Long labOrderId;
    private String testCode;
    private String resultValue;
    private String units;

    @Column(columnDefinition = "TEXT")
    private String referenceRangeJson;

    @Enumerated(EnumType.STRING)
    private Flag flag;

    private LocalDateTime reportedAt;
    private Long reportedBy;

    public enum Flag {
        NORMAL, HIGH, LOW, CRITICAL
    }

    // Getters and Setters
    public Long getResultId() {
        return resultId;
    }

    public void setResultId(Long resultId) {
        this.resultId = resultId;
    }

    public Long getLabOrderId() {
        return labOrderId;
    }

    public void setLabOrderId(Long labOrderId) {
        this.labOrderId = labOrderId;
    }

    public String getTestCode() {
        return testCode;
    }

    public void setTestCode(String testCode) {
        this.testCode = testCode;
    }

    public String getResultValue() {
        return resultValue;
    }

    public void setResultValue(String resultValue) {
        this.resultValue = resultValue;
    }

    public String getUnits() {
        return units;
    }

    public void setUnits(String units) {
        this.units = units;
    }

    public String getReferenceRangeJson() {
        return referenceRangeJson;
    }

    public void setReferenceRangeJson(String referenceRangeJson) {
        this.referenceRangeJson = referenceRangeJson;
    }

    public Flag getFlag() {
        return flag;
    }

    public void setFlag(Flag flag) {
        this.flag = flag;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(LocalDateTime reportedAt) {
        this.reportedAt = reportedAt;
    }

    public Long getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(Long reportedBy) {
        this.reportedBy = reportedBy;
    }
}