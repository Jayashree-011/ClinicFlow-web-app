package com.clinicflow.lab.client;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Fire-and-forget wrapper around {@link BillingServiceFeignClient}.
 *
 * A billing-service outage must never block lab order creation.
 * Default lab fee is a placeholder — replace with a
 * ServiceItem catalog lookup once billing Fault #8 is fixed.
 */
@Component
public class BillingServiceClient {

    private static final double LAB_ORDER_FEE = 75.00;

    private final BillingServiceFeignClient feignClient;

    public BillingServiceClient(BillingServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    /**
     * Creates a PENDING invoice when a lab order is placed.
     *
     * @param patientId  patient PK (from lab order)
     * @param encounterId encounter PK (nullable)
     * @param labOrderId the newly saved lab order PK
     */
    public void createLabOrderInvoice(Long patientId, Long encounterId, Long labOrderId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("patientId",  patientId);
            payload.put("encounterId", encounterId);
            payload.put("labOrderId", labOrderId);
            payload.put("amount",     LAB_ORDER_FEE);
            payload.put("taxes",      0.0);
            payload.put("discounts",  0.0);
            payload.put("status",     "PENDING");
            feignClient.createInvoice(payload);
            System.out.println("✅ Billing invoice created for lab order #" + labOrderId
                    + " (patient #" + patientId + ")");
        } catch (Exception e) {
            System.out.println("⚠️  Could not create billing invoice for lab order #"
                    + labOrderId + ": " + e.getMessage());
        }
    }
}
