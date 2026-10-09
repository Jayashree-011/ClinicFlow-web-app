package com.clinicflow.consultation.client;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Fire-and-forget wrapper around {@link BillingServiceFeignClient}.
 *
 * All billing calls are best-effort: failures are logged and swallowed so that
 * a billing-service outage never blocks appointment booking or status updates.
 *
 * Default amounts are placeholder consultation fees.  Replace with a
 * ServiceItem catalog lookup (billing-service Fault #8) once that endpoint exists.
 */
@Component
public class BillingServiceClient {

    private static final double CONSULTATION_FEE = 100.00;

    private final BillingServiceFeignClient feignClient;

    public BillingServiceClient(BillingServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    /**
     * Creates a PENDING invoice when an appointment is booked.
     *
     * @param patientId     consultation-service patient PK
     * @param appointmentId the newly saved appointment PK
     * @param serviceType   optional service-type label (e.g. "General", "Follow-up")
     */
    public void createAppointmentInvoice(Long patientId, Long appointmentId, String serviceType) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("patientId",     patientId);
            payload.put("appointmentId", appointmentId);
            payload.put("amount",        CONSULTATION_FEE);
            payload.put("taxes",         0.0);
            payload.put("discounts",     0.0);
            payload.put("status",        "PENDING");
            feignClient.createInvoice(payload);
            System.out.println("✅ Billing invoice created for appointment #" + appointmentId
                    + " (patient #" + patientId + ", type=" + serviceType + ")");
        } catch (Exception e) {
            System.out.println("⚠️  Could not create billing invoice for appointment #"
                    + appointmentId + ": " + e.getMessage());
        }
    }
}
