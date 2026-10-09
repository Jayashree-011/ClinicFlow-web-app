package com.clinicflow.Encounter.client;

import com.clinicflow.Encounter.dto.PatientDTO;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Circuit-breaker fallback for ConsultationClient (consultation-service).
 *
 * getPatientById  → returns null; callers must guard against null patients
 *                   (encounter creation proceeds but patient info is absent).
 * getAllPatients  → returns empty list; UI receives empty data gracefully.
 */
@Component
public class ConsultationClientFallback implements ConsultationClient {

    @Override
    public PatientDTO getPatientById(Long patientId) {
        System.out.println("⚡ [CB OPEN] consultation-service unavailable — patient lookup returning null for id #" + patientId);
        return null;
    }

    @Override
    public List<PatientDTO> getAllPatients() {
        System.out.println("⚡ [CB OPEN] consultation-service unavailable — returning empty patient list");
        return List.of();
    }
}
