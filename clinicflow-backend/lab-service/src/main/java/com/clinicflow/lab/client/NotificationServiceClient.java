package com.clinicflow.lab.client;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Fire-and-forget wrapper around {@link NotificationServiceFeignClient}.
 *
 * All notification calls are best-effort: failures are logged and swallowed so
 * that a notification-service outage never blocks lab result recording.
 */
@Component
public class NotificationServiceClient {

    private final NotificationServiceFeignClient feignClient;

    public NotificationServiceClient(NotificationServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    /**
     * Notifies the patient (and optionally the ordering clinician) that lab results
     * are ready. If the result is CRITICAL the severity is escalated accordingly.
     *
     * @param patientId   patient to notify
     * @param labOrderId  the originating lab order
     * @param testCode    test identifier (e.g. "CBC", "HBA1C")
     * @param flagStr     result flag string — "CRITICAL" triggers a CRITICAL severity
     */
    public void notifyLabResultReady(Long patientId, Long labOrderId,
                                     String testCode, String flagStr) {
        boolean critical = "CRITICAL".equalsIgnoreCase(flagStr);
        String severity = critical ? "CRITICAL" : "INFO";
        String msg = critical
                ? "⚠️ CRITICAL lab result for test " + testCode + ". Please contact your clinician immediately."
                : "Your lab results for test " + testCode + " are ready. Please log in to view them.";
        send(patientId, labOrderId, msg, "LAB", severity);
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
            System.out.println("✅ Notification sent [" + category + "/" + severity + "]: " + message);
        } catch (Exception e) {
            System.out.println("⚠️  Could not send notification [" + category + "]: " + e.getMessage());
        }
    }
}
