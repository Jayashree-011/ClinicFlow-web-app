package com.clinicflow.lab.dto;

import com.clinicflow.lab.entity.LabResult;

import java.time.LocalDateTime;

public class LabResultDTO {

    private Long resultId;
    private Long labOrderId;
    private String testCode;
    private String resultValue;
    private String units;
    private String referenceRangeJson;
    private LabResult.Flag flag;
    private LocalDateTime reportedAt;
    private Long reportedBy;

    // Constructors, Getters and Setters
    public LabResultDTO() {}

    public LabResultDTO(Long resultId, Long labOrderId, String testCode, String resultValue, String units, String referenceRangeJson, LabResult.Flag flag, LocalDateTime reportedAt, Long reportedBy) {
        this.resultId = resultId;
        this.labOrderId = labOrderId;
        this.testCode = testCode;
        this.resultValue = resultValue;
        this.units = units;
        this.referenceRangeJson = referenceRangeJson;
        this.flag = flag;
        this.reportedAt = reportedAt;
        this.reportedBy = reportedBy;
    }

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

    public LabResult.Flag getFlag() {
        return flag;
    }

    public void setFlag(LabResult.Flag flag) {
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