package com.clinicflow.pharmacy.dto;

import lombok.Data;

@Data
public class DispenseRequestDTO {

    private Long rxId;
    private Long inventoryId;
    private Long patientId;
    private Long dispensedBy;
    private Integer quantity;
    private String notes;
}