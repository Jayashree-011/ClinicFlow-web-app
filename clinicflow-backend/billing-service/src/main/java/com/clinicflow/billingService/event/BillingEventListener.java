package com.clinicflow.billingService.event;

import com.clinicflow.billingService.client.NotificationServiceClient;
import com.clinicflow.billingService.entity.Invoice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Reacts to billing lifecycle events published by {@link com.clinicflow.billingService.service.BillingService}.
 *
 * <p>This is the <em>internal</em> async hook.  Notification calls are
 * fire-and-forget: a downed notification-service never blocks billing operations.</p>
 */
@Component
public class BillingEventListener {

    @Autowired(required = false)
    private NotificationServiceClient notificationServiceClient;

    /**
     * Fires after every new invoice is persisted.
     * Notifies the patient that a new invoice has been generated.
     */
    @EventListener
    @Async
    public void onInvoiceCreated(InvoiceCreatedEvent event) {
        Invoice inv = event.getInvoice();
        System.out.printf("📋 [BillingEvent] Invoice #%d created — patient #%d | status: %s | total: %s%n",
                inv.getInvoiceId(), inv.getPatientId(), inv.getStatus(), inv.getTotalAmount());

        if (notificationServiceClient != null && inv.getPatientId() != null) {
            notificationServiceClient.notifyInvoiceCreated(
                    inv.getPatientId(), inv.getInvoiceId(), inv.getTotalAmount());
        }
    }

    /**
     * Fires whenever an invoice transitions to PAID.
     * Sends a payment-confirmed notification to the patient.
     */
    @EventListener
    @Async
    public void onInvoiceStatusChanged(InvoiceStatusChangedEvent event) {
        Invoice inv = event.getInvoice();
        System.out.printf("💰 [BillingEvent] Invoice #%d → %s — patient #%d | total: %s%n",
                inv.getInvoiceId(), event.getNewStatus(), inv.getPatientId(), inv.getTotalAmount());

        if (notificationServiceClient != null
                && inv.getPatientId() != null
                && Invoice.InvoiceStatus.PAID.equals(event.getNewStatus())) {
            notificationServiceClient.notifyInvoicePaid(
                    inv.getPatientId(), inv.getInvoiceId(), inv.getTotalAmount());
        }
    }
}
