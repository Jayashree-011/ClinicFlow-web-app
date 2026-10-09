package com.clinicflow.Encounter.client;

import com.clinicflow.Encounter.dto.PrescriptionSyncRequest;
import com.clinicflow.Encounter.dto.PrescriptionSyncResponse;
import org.springframework.stereotype.Component;

/**
 * Circuit-breaker fallback for PrescriptionClient (prescription-service).
 *
 * Both methods return null — callers in encounter-service already wrap these
 * calls in try/catch and treat a null response as a skipped sync rather than
 * a hard failure, so encounter operations remain unblocked when
 * prescription-service is unavailable.
 */
@Component
public class PrescriptionClientFallback implements PrescriptionClient {

    @Override
    public PrescriptionSyncResponse createPrescription(PrescriptionSyncRequest request) {
        System.out.println("⚡ [CB OPEN] prescription-service unavailable — prescription creation skipped");
        return null;
    }

    @Override
    public PrescriptionSyncResponse issuePrescription(Long id) {
        System.out.println("⚡ [CB OPEN] prescription-service unavailable — prescription issue skipped for id #" + id);
        return null;
    }
}
