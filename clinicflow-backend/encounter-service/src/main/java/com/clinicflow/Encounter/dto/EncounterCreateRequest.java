package com.clinicflow.Encounter.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EncounterCreateRequest {

    private Long patientId;
    private Long doctorId;
    private String visitType;
    private String chiefComplaint;
    /** Arbitrary JSON structure (deserialized as Map/List by Jackson 3). */
    private Object vitals;
    /** Arbitrary JSON structure (deserialized as Map/List by Jackson 3). */
    private Object notes;
    private LocalDateTime startAt;
}
