package com.clinicflow.billingService.service;

import com.clinicflow.billingService.entity.Invoice;
import com.clinicflow.billingService.entity.Payment;
import com.clinicflow.billingService.event.InvoiceCreatedEvent;
import com.clinicflow.billingService.event.InvoiceStatusChangedEvent;
import com.clinicflow.billingService.repository.InvoiceRepository;
import com.clinicflow.billingService.repository.PaymentRepository;
import com.clinicflow.billingService.exception.ObjectNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository      invoiceRepository;
    private final PaymentRepository      paymentRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Creates a new invoice, calculates the total amount, and auto-generates a description.
     */
    @Transactional
    public Invoice createInvoice(Invoice invoice) {
        invoice.setTotalAmount(calculateTotal(invoice));
        if (invoice.getIssuedAt() == null) {   // respect caller-supplied date (e.g. seed data)
            invoice.setIssuedAt(LocalDateTime.now());
        }
        invoice.setDescription(generateInvoiceDescription(invoice));
        Invoice saved = invoiceRepository.save(invoice);
        // Notify listeners (audit, future Kafka publish, notification-service hook)
        eventPublisher.publishEvent(new InvoiceCreatedEvent(this, saved));
        return saved;
    }

    /**
     * Processes a payment and updates the invoice status if fully paid.
     */
    /**
     * Processes a payment and updates the invoice status if fully paid.
     * Throws an exception if the invoice is already marked as PAID.
     */
    @Transactional
public Payment processPayment(Payment payment) throws ObjectNotFoundException {
    // 1. Fetch the invoice and handle 404
    Invoice invoice = invoiceRepository.findById(payment.getInvoiceId())
            .orElseThrow(() -> new ObjectNotFoundException("Invoice not found with ID: " + payment.getInvoiceId()));

    // 2. Business Rule: Prevent double payment
    if (Invoice.InvoiceStatus.PAID.equals(invoice.getStatus())) {
        throw new IllegalStateException("Payment rejected: Invoice #" + payment.getInvoiceId() + " is already settled.");
    }

    // 3. Set payment metadata
    payment.setPaidAt(LocalDateTime.now());
    
    // Ensure status is COMPLETED unless the DTO explicitly said FAILED
    if (payment.getStatus() == null) {
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
    }

    // 4. Update Invoice status based on the payment
    if (payment.getStatus() == Payment.PaymentStatus.COMPLETED) {
        // If the amount covers the remaining total, mark as PAID
        if (payment.getAmount().compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(Invoice.InvoiceStatus.PAID);
            invoiceRepository.save(invoice);
            // Notify listeners (confirmation email hook, insurance claim trigger, etc.)
            eventPublisher.publishEvent(new InvoiceStatusChangedEvent(this, invoice, Invoice.InvoiceStatus.PAID));
        }
    }

    // 5. Save and Return the payment object
    return paymentRepository.save(payment);
}
    @Transactional(readOnly = true)
    public Optional<Invoice> getByInvoiceId(Long invoiceId) {
        return invoiceRepository.findByInvoiceId(invoiceId);
    }

    @Transactional(readOnly = true)
    public List<Invoice> getPendingInvoicesbyPatientId(Long patientId) {
        return invoiceRepository.findByPatientIdAndStatus(patientId, Invoice.InvoiceStatus.PENDING.name());
    }

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesByPatientId(Long patientId) {
        return invoiceRepository.findByPatientId(patientId);
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByInvoiceId(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    @Transactional(readOnly = true)
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @Transactional
    public Invoice updateInvoice(Long invoiceId, Invoice updatedInvoice) throws ObjectNotFoundException {
        Invoice existingInvoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ObjectNotFoundException("Invoice not found with ID: " + invoiceId));

        existingInvoice.setPatientId(updatedInvoice.getPatientId());
        existingInvoice.setStatus(updatedInvoice.getStatus());
        existingInvoice.setSubtotal(updatedInvoice.getSubtotal());
        existingInvoice.setTaxes(updatedInvoice.getTaxes());
        existingInvoice.setDiscounts(updatedInvoice.getDiscounts());

        // Recalculate total and regenerate description using the shared logic
        existingInvoice.setTotalAmount(calculateTotal(existingInvoice));
        existingInvoice.setDescription(generateInvoiceDescription(existingInvoice));

        return invoiceRepository.save(existingInvoice);
    }

    /** Backfill helper — sets patientName on a single invoice row */
    @Transactional
    public void updatePatientName(Long invoiceId, String patientName) {
        invoiceRepository.findById(invoiceId).ifPresent(inv -> {
            inv.setPatientName(patientName);
            invoiceRepository.save(inv);
        });
    }

    @Transactional
    public void deleteInvoice(Long invoiceId) {
        if (!invoiceRepository.existsById(invoiceId)) {
            throw new ObjectNotFoundException("Invoice not found with ID: " + invoiceId);
        }
        invoiceRepository.deleteById(invoiceId);
    }

    @Transactional
    public void deletePayment(Long paymentId) {
        if (!paymentRepository.existsById(paymentId)) {
            throw new ObjectNotFoundException("Payment not found with ID: " + paymentId);
        }
        paymentRepository.deleteById(paymentId);
    }

    @Transactional
    public Payment updatePayment(Long id, Payment paymentDetails) {
        return paymentRepository.findById(id)
                .map(existingPayment -> {
                    existingPayment.setAmount(paymentDetails.getAmount());
                    existingPayment.setPaymentMethod(paymentDetails.getPaymentMethod());
                    existingPayment.setPaidAt(paymentDetails.getPaidAt());
                    existingPayment.setStatus(paymentDetails.getStatus());
                    return paymentRepository.save(existingPayment);
                })
                .orElseThrow(() -> new ObjectNotFoundException("Payment not found with ID: " + id));
    }

    /**
     * Builds a human-readable description for an invoice based on its source context
     * (appointment, prescription, lab order, or encounter) and financial breakdown.
     * Called on every create and update so the description always stays current.
     */
    private String generateInvoiceDescription(Invoice invoice) {
        StringBuilder sb = new StringBuilder();

        // --- Source context ---
        if (invoice.getAppointmentId() != null) {
            sb.append("Consultation fee for Patient #").append(invoice.getPatientId())
              .append(" — Appointment #").append(invoice.getAppointmentId());
        } else if (invoice.getPrescriptionId() != null) {
            sb.append("Prescription charge for Patient #").append(invoice.getPatientId())
              .append(" — Prescription #").append(invoice.getPrescriptionId());
        } else if (invoice.getLabOrderId() != null) {
            sb.append("Lab order fee for Patient #").append(invoice.getPatientId())
              .append(" — Lab Order #").append(invoice.getLabOrderId());
        } else if (invoice.getEncounterId() != null) {
            sb.append("Clinical encounter for Patient #").append(invoice.getPatientId())
              .append(" — Encounter #").append(invoice.getEncounterId());
        } else {
            sb.append("Medical services for Patient #").append(invoice.getPatientId());
        }

        // --- Financial summary ---
        BigDecimal total = Optional.ofNullable(invoice.getTotalAmount()).orElse(BigDecimal.ZERO);
        sb.append(". Total: $").append(String.format("%.2f", total));

        BigDecimal taxes     = Optional.ofNullable(invoice.getTaxes()).orElse(BigDecimal.ZERO);
        BigDecimal discounts = Optional.ofNullable(invoice.getDiscounts()).orElse(BigDecimal.ZERO);
        boolean hasTax      = taxes.compareTo(BigDecimal.ZERO) > 0;
        boolean hasDiscount = discounts.compareTo(BigDecimal.ZERO) > 0;

        if (hasTax && hasDiscount) {
            sb.append(" (incl. $").append(String.format("%.2f", taxes)).append(" tax")
              .append(", less $").append(String.format("%.2f", discounts)).append(" discount)");
        } else if (hasTax) {
            sb.append(" (incl. $").append(String.format("%.2f", taxes)).append(" tax)");
        } else if (hasDiscount) {
            sb.append(" (less $").append(String.format("%.2f", discounts)).append(" discount)");
        }

        return sb.toString();
    }

    /**
     * Helper to ensure total calculation is consistent across the service.
     */
    private BigDecimal calculateTotal(Invoice invoice) {
        BigDecimal subtotal = Optional.ofNullable(invoice.getSubtotal()).orElse(BigDecimal.ZERO);
        BigDecimal taxes = Optional.ofNullable(invoice.getTaxes()).orElse(BigDecimal.ZERO);
        BigDecimal discounts = Optional.ofNullable(invoice.getDiscounts()).orElse(BigDecimal.ZERO);

        return subtotal.add(taxes).subtract(discounts);
    }
}