package com.clinicflow.consultation.client;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Fire-and-forget wrapper around {@link NotificationServiceFeignClient}.
 *
 * All notification calls are best-effort: failures are logged and swallowed so
 * that a notification-service outage never blocks appointment or patient operations.
 */
@Component
public class NotificationServiceClient {

    private final NotificationServiceFeignClient feignClient;

    public NotificationServiceClient(NotificationServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    /**
     * Sends an in-app (PUSH) notification to the patient when their appointment is booked.
     */
    public void notifyAppointmentBooked(Long patientId, Long appointmentId, String serviceType) {
        send(patientId, null, appointmentId,
                "Your appointment has been booked" + (serviceType != null ? " (" + serviceType + ")" : "") + ".",
                "APPOINTMENT", "INFO");
    }

    /**
     * Sends an in-app notification when an appointment's status changes
     * (e.g. Confirmed, Cancelled, In Progress).
     */
    public void notifyAppointmentStatusChanged(Long patientId, Long appointmentId, String newStatus) {
        String message = switch (newStatus == null ? "" : newStatus.toUpperCase()) {
            case "CONFIRMED"   -> "Your appointment has been confirmed.";
            case "CANCELLED"   -> "Your appointment has been cancelled.";
            case "IN_PROGRESS" -> "Your appointment is now in progress.";
            case "COMPLETED"   -> "Your appointment has been completed.";
            default -> "Your appointment status has been updated to: " + newStatus + ".";
        };
        send(patientId, null, appointmentId, message, "APPOINTMENT", "INFO");
    }

    // ── Internal helper ───────────────────────────────────────────────────────

    private void send(Long patientId, Long userId, Long entityId,
                      String message, String category, String severity) {
        try {
            Map<String, Object> payload = new HashMap<>();
            if (patientId != null) payload.put("patientId", patientId);
            if (userId    != null) payload.put("userId",    userId);
            if (entityId  != null) payload.put("entityId",  entityId);
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
