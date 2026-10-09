package com.clinicflow.billingService.client;

import com.clinicflow.billingService.dto.EncounterDTO;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Circuit-breaker fallback for EncounterServiceClient (encounter-service).
 *
 * Both methods return safe empty values — EncounterService already treats
 * null/empty as "encounter unavailable", so invoice creation can still proceed
 * without blocking on a downed encounter-service.
 */
@Component
public class EncounterServiceClientFallback implements EncounterServiceClient {

    @Override
    public Object getEncounterById(Long encounterId) {
        System.out.println("⚡ [CB OPEN] encounter-service unavailable — returning null for encounter #" + encounterId);
        return null;
    }

    @Override
    public List<EncounterDTO> getEncountersByPatientId(Long patientId) {
        System.out.println("⚡ [CB OPEN] encounter-service unavailable — returning empty list for patient #" + patientId);
        return List.of();
    }
}
