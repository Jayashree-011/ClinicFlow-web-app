package com.clinicflow.lab.client;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Circuit-breaker fallback for BillingServiceFeignClient (billing-service).
 *
 * Invoice creation from a lab order is fire-and-forget — billing-service
 * being down must never prevent a lab order from being created.
 * Returns an empty map so BillingServiceClient.createLabOrderInvoice() gets
 * a no-op result without throwing.
 */
@Component
public class BillingServiceFeignClientFallback implements BillingServiceFeignClient {

    @Override
    public Map<String, Object> createInvoice(Map<String, Object> payload) {
        System.out.println("⚡ [CB OPEN] billing-service unavailable — lab order invoice creation skipped");
        return Map.of();
    }
}
