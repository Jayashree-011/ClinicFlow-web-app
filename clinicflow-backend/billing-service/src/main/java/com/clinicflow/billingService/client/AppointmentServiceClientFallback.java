package com.clinicflow.billingService.client;

import com.clinicflow.billingService.dto.AppointmentDTO;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Circuit-breaker fallback for AppointmentServiceClient (consultation-service).
 * Returns an empty list so callers receive a graceful empty result
 * rather than a cascading failure when consultation-service is down.
 */
@Component
public class AppointmentServiceClientFallback implements AppointmentServiceClient {

    @Override
    public List<AppointmentDTO> getAppointmentsByPatientId(Long patientId) {
        System.out.println("⚡ [CB OPEN] consultation-service unavailable — returning empty appointment list for patient #" + patientId);
        return List.of();
    }
}
