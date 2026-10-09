package com.clinicflow.Encounter.dto;

import lombok.Data;

@Data
public class PrescriptionSyncResponse {
    private Long rxId;
    private String status;
}
