package com.clinicflow.billingService.event;

import com.clinicflow.billingService.entity.Invoice;
import org.springframework.context.ApplicationEvent;

/**
 * Published whenever an invoice's status transitions (e.g. PENDING → PAID,
 * PENDING → CANCELLED).  Downstream listeners can trigger payment confirmations,
 * patient notifications, or insurance claim updates.
 */
public class InvoiceStatusChangedEvent extends ApplicationEvent {

    private final Invoice invoice;
    private final Invoice.InvoiceStatus newStatus;

    public InvoiceStatusChangedEvent(Object source, Invoice invoice, Invoice.InvoiceStatus newStatus) {
        super(source);
        this.invoice   = invoice;
        this.newStatus = newStatus;
    }

    public Invoice getInvoice()                     { return invoice;   }
    public Invoice.InvoiceStatus getNewStatus()     { return newStatus; }
}
