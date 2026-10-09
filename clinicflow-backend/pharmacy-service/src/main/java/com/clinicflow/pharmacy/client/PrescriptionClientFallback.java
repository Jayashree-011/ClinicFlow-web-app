package com.clinicflow.pharmacy.client;

import org.springframework.stereotype.Component;

/**
 * Circuit-breaker fallback for PrescriptionClient (prescription-service).
 *
 * markDispensed is a status-sync call — if prescription-service is down the
 * pharmacy can still complete the dispense locally.  The status will remain
 * out of sync until prescription-service recovers, at which point a retry
 * or reconciliation job can catch up.
 */
@Component
public class PrescriptionClientFallback implements PrescriptionClient {

    @Override
    public void markDispensed(Long id) {
        System.out.println("⚡ [CB OPEN] prescription-service unavailable — dispense status mark skipped for rx #" + id);
    }
}
