package com.clinicflow.billingService.service;

import com.clinicflow.billingService.client.EncounterServiceClient;
import com.clinicflow.billingService.dto.EncounterDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business-layer facade over {@link EncounterServiceClient}.
 *
 * Wraps Feign calls with defensive error handling so billing logic is never
 * blocked by a transient encounter-service outage.  All methods return
 * {@code null} / empty list on failure rather than propagating the exception
 * upward (callers treat {@code null} as "encounter not found").
 */
@Service
@RequiredArgsConstructor
public class EncounterService {

    private final EncounterServiceClient encounterServiceClient;

    /**
     * Returns the raw encounter object from encounter-service, or {@code null}
     * when the encounter does not exist or the service is unavailable.
     */
    public Object getEncounterById(Long encounterId) {
        if (encounterId == null) return null;
        try {
            return encounterServiceClient.getEncounterById(encounterId);
        } catch (Exception e) {
            System.out.println("⚠️  [EncounterService] Could not fetch encounter #"
                    + encounterId + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * Returns all encounters for a patient, or an empty list when the service
     * is unavailable.
     */
    public List<EncounterDTO> getEncountersByPatient(Long patientId) {
        if (patientId == null) return List.of();
        try {
            return encounterServiceClient.getEncountersByPatientId(patientId);
        } catch (Exception e) {
            System.out.println("⚠️  [EncounterService] Could not fetch encounters for patient #"
                    + patientId + ": " + e.getMessage());
            return List.of();
        }
    }
}
