package com.clinicflow.Encounter.dto;

import com.clinicflow.Encounter.entity.ProblemStatus;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProblemListDTO {
    
    private Long problemId;
    private Long patientId;
    private Long encounterId;
    private String code;
    private String description;
    private LocalDate onsetDate;
    private ProblemStatus status;
    private String icdCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
