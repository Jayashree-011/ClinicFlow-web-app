package com.clinicflow.prescription.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Feign client for billing-service.
 * Resolved via Eureka — hits the service's internal port, bypassing the gateway.
 */
@FeignClient(name = "billing-service",
             fallback = BillingServiceFeignClientFallback.class)
public interface BillingServiceFeignClient {

    @PostMapping("/api/billing/invoices")
    Map<String, Object> createInvoice(@RequestBody Map<String, Object> payload);
}
