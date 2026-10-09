package com.clinicflow.billingService.client;

import com.clinicflow.billingService.dto.PatientDTO;
import org.springframework.stereotype.Component;

/**
 * Circuit-breaker fallback for PatientServiceClient (consultation-service).
 *
 * Returns null so BillingController's existing null-check throws a clean 404
 * ("Patient not found") rather than letting a FeignException propagate as 500.
 * The circuit opens after 5 consecutive failures and stays open for 10 s.
 */
@Component
public class PatientServiceClientFallback implements PatientServiceClient {

    @Override
    public PatientDTO getPatient(Long id) {
        System.out.println("⚡ [CB OPEN] consultation-service unavailable — patient lookup returning null for id " + id);
        return null;
    }
}
