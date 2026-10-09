package com.clinicflow.Encounter.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EncounterUpdateRequest {
    
    private String chiefComplaint;
    private Object vitals;
    private Object notes;
    private Object diagnoses;
    private Object orders;
    private Object prescriptions;
}
