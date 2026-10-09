package com.clinicflow.Encounter.utility;

import com.clinicflow.Encounter.dto.EncounterDTO;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class EncounterValidator {

    public boolean validateVitals(Object vitals) {
        if (vitals == null) return true;
        if (vitals instanceof Map<?, ?> map) {
            return map.containsKey("bp") || map.containsKey("temp") || map.containsKey("pulse");
        }
        return true;
    }

    public boolean validateDiagnosis(Object diagnosis) {
        if (diagnosis == null) return true;
        if (diagnosis instanceof Map<?, ?> map) {
            return map.containsKey("icd10") || map.containsKey("description");
        }
        return true;
    }

    public boolean validateEncounterState(EncounterDTO encounter) {
        return encounter.getPatientId() != null &&
               encounter.getDoctorId() != null &&
               encounter.getStartAt() != null;
    }
}
