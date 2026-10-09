package com.clinicflow.billingService.client;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Fire-and-forget wrapper around {@link NotificationServiceFeignClient}.
 *
 * All notification calls are best-effort: failures are logged and swallowed so
 * that a notification-service outage never blocks invoice or payment operations.
 */
@Component
public class NotificationServiceClient {

    private final NotificationServiceFeignClient feignClient;

    public NotificationServiceClient(NotificationServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    /**
     * Notifies the patient when a new invoice is created.
     */
    public void notifyInvoiceCreated(Long patientId, Long invoiceId, BigDecimal totalAmount) {
        String amount = totalAmount != null ? String.format("$%.2f", totalAmount) : "";
        String msg = "A new invoice" +
                (invoiceId != null ? " #" + invoiceId : "") +
                " has been created for your account" +
                (amount.isEmpty() ? "." : ": " + amount + ".");
        send(patientId, invoiceId, msg, "BILLING", "INFO");
    }

    /**
     * Notifies the patient when their invoice has been fully paid.
     */
    public void notifyInvoicePaid(Long patientId, Long invoiceId, BigDecimal totalAmount) {
        String amount = totalAmount != null ? String.format("$%.2f", totalAmount) : "";
        String msg = "✅ Payment confirmed for Invoice" +
                (invoiceId != null ? " #" + invoiceId : "") +
                (amount.isEmpty() ? ". Thank you!" : " (" + amount + "). Thank you!");
        send(patientId, invoiceId, msg, "BILLING", "INFO");
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
