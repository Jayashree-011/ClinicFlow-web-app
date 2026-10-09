package com.clinicflow.Encounter.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProblemListCreateRequest {
    
    private Long patientId;
    private Long encounterId;
    private String code;
    private String description;
    private LocalDate onsetDate;
    private String icdCode;
}
