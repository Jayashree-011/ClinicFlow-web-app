package com.clinicflow.Encounter.dto;

import lombok.Data;

@Data
public class PrescriptionSyncRequest {

    private Long encounterId;
    private Long patientId;
    private Long doctorId;

    private Long medId;
    private String medicationName;

    private String dosage;
    private String frequency;
    private Integer durationDays;
    private Integer quantity;
    private Integer repeats;
    private String route;
    private String notes;
}
