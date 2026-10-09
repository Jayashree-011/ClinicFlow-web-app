package com.clinicflow.prescription.client;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Circuit-breaker fallback for BillingServiceFeignClient (billing-service).
 *
 * Invoice creation from a prescription issue is fire-and-forget — billing-service
 * being down must never prevent a prescription from being issued to the patient.
 * Returns an empty map so BillingServiceClient.createPrescriptionInvoice() gets
 * a no-op result without throwing.
 */
@Component
public class BillingServiceFeignClientFallback implements BillingServiceFeignClient {

    @Override
    public Map<String, Object> createInvoice(Map<String, Object> payload) {
        System.out.println("⚡ [CB OPEN] billing-service unavailable — prescription invoice creation skipped");
        return Map.of();
    }
}
