package com.clinicflow.consultation.client;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Circuit-breaker fallback for BillingServiceFeignClient (billing-service).
 *
 * Invoice creation is fire-and-forget: a failed or open-circuit call must
 * never block the appointment booking flow.  Returns an empty map so the
 * wrapping BillingServiceClient.createAppointmentInvoice() sees a no-op
 * result without throwing.
 */
@Component
public class BillingServiceFeignClientFallback implements BillingServiceFeignClient {

    @Override
    public Map<String, Object> createInvoice(Map<String, Object> payload) {
        System.out.println("⚡ [CB OPEN] billing-service unavailable — appointment invoice creation skipped");
        return Map.of();
    }
}
