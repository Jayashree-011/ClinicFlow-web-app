package com.clinicflow.billingService.event;

import com.clinicflow.billingService.entity.Invoice;
import org.springframework.context.ApplicationEvent;

/**
 * Published synchronously inside billing-service whenever a new invoice is
 * persisted.  Listeners can react immediately (send notifications, update
 * insurance claims, etc.) and the same listener contract can be replaced with
 * a Kafka / RabbitMQ outbox pattern when a message broker is introduced.
 */
public class InvoiceCreatedEvent extends ApplicationEvent {

    private final Invoice invoice;

    public InvoiceCreatedEvent(Object source, Invoice invoice) {
        super(source);
        this.invoice = invoice;
    }

    public Invoice getInvoice() {
        return invoice;
    }
}
