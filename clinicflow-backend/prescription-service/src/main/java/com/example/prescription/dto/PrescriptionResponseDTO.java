package com.clinicflow.prescription.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PrescriptionResponseDTO {

    private Long rxId;
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

    private String status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime issuedAt;
}
