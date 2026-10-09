package com.clinicflow.pharmacy.client;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Fire-and-forget wrapper around {@link NotificationServiceFeignClient}.
 *
 * All notification calls are best-effort: failures are logged and swallowed so
 * that a notification-service outage never blocks medication dispensing.
 */
@Component
public class NotificationServiceClient {

    private final NotificationServiceFeignClient feignClient;

    public NotificationServiceClient(NotificationServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    /**
     * Notifies the patient that their medication has been dispensed from the pharmacy.
     */
    public void notifyMedicationDispensed(Long patientId, Long dispenseId, String medicationName) {
        String msg = "Your medication" +
                (medicationName != null ? " (" + medicationName + ")" : "") +
                " has been dispensed. Please collect it from the pharmacy.";
        send(patientId, dispenseId, msg, "PHARMACY", "INFO");
    }

    /**
     * Notifies relevant staff when a medication's stock level has gone LOW or OUT_OF_STOCK.
     * Uses userId (pharmacist/admin) rather than patientId.
     */
    public void notifyLowStock(String medicationName, int remainingQty) {
        String severity = remainingQty == 0 ? "CRITICAL" : "WARNING";
        String msg = remainingQty == 0
                ? "🚨 " + medicationName + " is OUT OF STOCK. Reorder immediately."
                : "⚠️ " + medicationName + " stock is LOW (" + remainingQty + " units remaining). Please reorder.";
        try {
            Map<String, Object> payload = new HashMap<>();
            // No patientId — this alert targets pharmacy staff (no specific userId known here)
            // A real implementation would query the user-service for pharmacy role users.
            // For now we set userId=0 as a broadcast placeholder.
            payload.put("userId",   0L);
            payload.put("message",  msg);
            payload.put("category", "PHARMACY");
            payload.put("channel",  "PUSH");
            payload.put("severity", severity);
            payload.put("status",   "UNREAD");
            feignClient.send(payload);
            System.out.println("✅ Stock alert sent [PHARMACY/" + severity + "]: " + msg);
        } catch (Exception e) {
            System.out.println("⚠️  Could not send stock alert: " + e.getMessage());
        }
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
