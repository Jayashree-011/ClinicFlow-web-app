package com.clinicflow.prescription.client;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Fire-and-forget wrapper around {@link NotificationServiceFeignClient}.
 *
 * All notification calls are best-effort: failures are logged and swallowed so
 * that a notification-service outage never blocks prescription operations.
 */
@Component
public class NotificationServiceClient {

    private final NotificationServiceFeignClient feignClient;

    public NotificationServiceClient(NotificationServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    /**
     * Notifies the patient that a prescription has been issued and is ready.
     */
    public void notifyPrescriptionIssued(Long patientId, Long rxId, String medicationName) {
        String msg = "Your prescription" +
                (medicationName != null ? " for " + medicationName : "") +
                " has been issued and is ready for pickup.";
        send(patientId, rxId, msg, "PRESCRIPTION", "INFO");
    }

    /**
     * Notifies the patient that their prescription has been dispensed.
     */
    public void notifyPrescriptionDispensed(Long patientId, Long rxId, String medicationName) {
        String msg = "Your prescription" +
                (medicationName != null ? " for " + medicationName : "") +
                " has been dispensed.";
        send(patientId, rxId, msg, "PRESCRIPTION", "INFO");
    }

    // ── Internal helper ───────────────────────────────────────────────────────

    private void send(Long patientId, Long entityId,
                      String message, String category, String severity) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("patientId", patientId);
            if (entityId != null) payload.put("entityId", entityId);
            payload.put("message",  message);
            payload.put("category", category);
            payload.put("channel",  "PUSH");
            payload.put("severity", severity);
            payload.put("status",   "UNREAD");
            feignClient.send(payload);
            System.out.println("✅ Notification sent [" + category + "]: " + message);
        } catch (Exception e) {
            System.out.println("⚠️  Could not send notification [" + category + "]: " + e.getMessage());
        }
    }
}
