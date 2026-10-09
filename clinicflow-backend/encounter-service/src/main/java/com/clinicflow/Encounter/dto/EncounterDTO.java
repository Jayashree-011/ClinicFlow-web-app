package com.clinicflow.Encounter.dto;

import com.clinicflow.Encounter.entity.EncounterStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EncounterDTO {

    private Long encounterId;
    private Long patientId;
    private Long doctorId;
    private String visitType;
    private String chiefComplaint;
    /** Arbitrary JSON structure (Map/List or null). */
    private Object vitals;
    private Object notes;
    private Object diagnoses;
    private Object orders;
    private Object prescriptions;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private EncounterStatus status;
    private Long signedBy;
    private LocalDateTime signedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
