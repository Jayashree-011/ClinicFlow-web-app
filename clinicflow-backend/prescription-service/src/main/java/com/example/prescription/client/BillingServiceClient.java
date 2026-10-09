package com.clinicflow.prescription.client;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Fire-and-forget wrapper around {@link BillingServiceFeignClient}.
 *
 * A billing-service outage must never block prescription issuing.
 * Default prescription fee is a placeholder — replace with a
 * ServiceItem catalog lookup once billing Fault #8 is fixed.
 */
@Component
public class BillingServiceClient {

    private static final double PRESCRIPTION_FEE = 50.00;

    private final BillingServiceFeignClient feignClient;

    public BillingServiceClient(BillingServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    /**
     * Creates a PENDING invoice when a prescription is issued.
     *
     * @param patientId      patient PK (from prescription entity)
     * @param encounterId    encounter PK (nullable)
     * @param prescriptionId the prescription's rxId
     * @param medicationName human-readable med name for the line-item label
     */
    public void createPrescriptionInvoice(Long patientId, Long encounterId,
                                          Long prescriptionId, String medicationName) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("patientId",      patientId);
            payload.put("encounterId",    encounterId);
            payload.put("prescriptionId", prescriptionId);
            payload.put("amount",         PRESCRIPTION_FEE);
            payload.put("taxes",          0.0);
            payload.put("discounts",      0.0);
            payload.put("status",         "PENDING");
            feignClient.createInvoice(payload);
            System.out.println("✅ Billing invoice created for prescription #" + prescriptionId
                    + " (" + medicationName + ", patient #" + patientId + ")");
        } catch (Exception e) {
            System.out.println("⚠️  Could not create billing invoice for prescription #"
                    + prescriptionId + ": " + e.getMessage());
        }
    }
}
