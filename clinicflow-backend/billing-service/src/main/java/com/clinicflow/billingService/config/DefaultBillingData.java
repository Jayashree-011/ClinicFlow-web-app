package com.clinicflow.billingService.config;

import com.clinicflow.billingService.entity.Invoice;
import com.clinicflow.billingService.entity.Payment;
import com.clinicflow.billingService.service.BillingService;
import com.clinicflow.billingService.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Seeds four representative invoices on every startup (idempotent — each seed
 * method checks for existing data before inserting).
 *
 * The four invoices cover every source-reference type so that the
 * auto-generated description logic is exercised from day one:
 *
 *   #1  Patient 1  appointmentId=1   → "Consultation fee …"          PAID  (credit card)
 *   #2  Patient 2  encounterId=2     → "Clinical encounter …"        PENDING
 *   #3  Patient 3  prescriptionId=1  → "Prescription charge …"       PAID  (insurance)
 *   #4  Patient 1  labOrderId=1      → "Lab order fee …"             CANCELLED
 *
 * Uses @EventListener(ApplicationReadyEvent) so that Eureka discovery is fully
 * up before any inter-service calls are attempted (consistent with other seeders).
 */
@Configuration
@RequiredArgsConstructor
public class DefaultBillingData {

    private final BillingService     billingService;
    private final InvoiceRepository  invoiceRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void seedDefaultData() {
        seedInvoiceOne();
        seedInvoiceTwo();
        seedInvoiceThree();
        seedInvoiceFour();
    }

    // ── Invoice 1 ─────────────────────────────────────────────────────────────
    // Patient 1 | Appointment #1 | Encounter #1 | PAID via credit card
    // Description: "Consultation fee for Patient #1 — Appointment #1. Total: $275.00 (incl. $25.00 tax)"
    private void seedInvoiceOne() {
        if (!invoiceRepository.findByPatientId(1L).isEmpty()) return;

        Invoice invoice = Invoice.builder()
                .patientId(1L)
                .appointmentId(1L)
                .encounterId(1L)
                .subtotal(new BigDecimal("250.00"))
                .taxes(new BigDecimal("25.00"))
                .discounts(new BigDecimal("0.00"))
                .status(Invoice.InvoiceStatus.PENDING)
                .issuedAt(LocalDateTime.now().minusDays(5))
                .lineItemsJson("[{\"description\":\"Consultation Fee\",\"amount\":150.00},"
                             + "{\"description\":\"Blood Panel\",\"amount\":100.00}]")
                .build();

        Invoice saved = billingService.createInvoice(invoice);
        System.out.println("✅ Invoice #" + saved.getInvoiceId()
                + " seeded (patient 1, appointment 1) — " + saved.getDescription());

        Payment payment = Payment.builder()
                .invoiceId(saved.getInvoiceId())
                .patientId(1L)
                .amount(new BigDecimal("275.00"))
                .paymentMethod(Payment.PaymentMethod.CREDIT_CARD)
                .status(Payment.PaymentStatus.COMPLETED)
                .paidAt(LocalDateTime.now().minusDays(4))
                .build();

        billingService.processPayment(payment);
        System.out.println("✅  └─ Payment recorded (credit card, $275.00)");
    }

    // ── Invoice 2 ─────────────────────────────────────────────────────────────
    // Patient 2 | Encounter #2 | PENDING — no payment yet
    // Description: "Clinical encounter for Patient #2 — Encounter #2. Total: $508.00 (incl. $48.00 tax, less $20.00 discount)"
    private void seedInvoiceTwo() {
        if (!invoiceRepository.findByPatientId(2L).isEmpty()) return;

        Invoice invoice = Invoice.builder()
                .patientId(2L)
                .encounterId(2L)
                .subtotal(new BigDecimal("480.00"))
                .taxes(new BigDecimal("48.00"))
                .discounts(new BigDecimal("20.00"))
                .status(Invoice.InvoiceStatus.PENDING)
                .issuedAt(LocalDateTime.now().minusDays(3))
                .lineItemsJson("[{\"description\":\"Diagnostic Evaluation\",\"amount\":200.00},"
                             + "{\"description\":\"MRI Imaging\",\"amount\":280.00}]")
                .build();

        Invoice saved = billingService.createInvoice(invoice);
        System.out.println("✅ Invoice #" + saved.getInvoiceId()
                + " seeded (patient 2, encounter 2, PENDING) — " + saved.getDescription());
    }

    // ── Invoice 3 ─────────────────────────────────────────────────────────────
    // Patient 3 | Prescription #1 | Encounter #3 | PAID via insurance
    // Description: "Prescription charge for Patient #3 — Prescription #1. Total: $166.00 (incl. $16.00 tax, less $10.00 discount)"
    private void seedInvoiceThree() {
        if (!invoiceRepository.findByPatientId(3L).isEmpty()) return;

        Invoice invoice = Invoice.builder()
                .patientId(3L)
                .prescriptionId(1L)
                .encounterId(3L)
                .subtotal(new BigDecimal("160.00"))
                .taxes(new BigDecimal("16.00"))
                .discounts(new BigDecimal("10.00"))
                .status(Invoice.InvoiceStatus.PENDING)
                .issuedAt(LocalDateTime.now().minusDays(2))
                .lineItemsJson("[{\"description\":\"Follow-up Consultation\",\"amount\":100.00},"
                             + "{\"description\":\"Prescribed Medication\",\"amount\":60.00}]")
                .build();

        Invoice saved = billingService.createInvoice(invoice);
        System.out.println("✅ Invoice #" + saved.getInvoiceId()
                + " seeded (patient 3, prescription 1) — " + saved.getDescription());

        Payment payment = Payment.builder()
                .invoiceId(saved.getInvoiceId())
                .patientId(3L)
                .amount(new BigDecimal("166.00"))
                .paymentMethod(Payment.PaymentMethod.INSURANCE)
                .status(Payment.PaymentStatus.COMPLETED)
                .paidAt(LocalDateTime.now().minusDays(1))
                .build();

        billingService.processPayment(payment);
        System.out.println("✅  └─ Payment recorded (insurance, $166.00)");
    }

    // ── Invoice 4 ─────────────────────────────────────────────────────────────
    // Patient 1 | Lab Order #1 | Encounter #4 | CANCELLED
    // Description: "Lab order fee for Patient #1 — Lab Order #1. Total: $352.00 (incl. $32.00 tax)"
    private void seedInvoiceFour() {
        boolean alreadyExists = invoiceRepository.findByPatientId(1L).stream()
                .anyMatch(i -> Long.valueOf(1L).equals(i.getLabOrderId()));
        if (alreadyExists) return;

        Invoice invoice = Invoice.builder()
                .patientId(1L)
                .labOrderId(1L)
                .encounterId(4L)
                .subtotal(new BigDecimal("320.00"))
                .taxes(new BigDecimal("32.00"))
                .discounts(new BigDecimal("0.00"))
                .status(Invoice.InvoiceStatus.CANCELLED)
                .issuedAt(LocalDateTime.now().minusDays(1))
                .lineItemsJson("[{\"description\":\"Full Blood Count\",\"amount\":180.00},"
                             + "{\"description\":\"Urine Analysis\",\"amount\":140.00}]")
                .build();

        Invoice saved = billingService.createInvoice(invoice);
        System.out.println("✅ Invoice #" + saved.getInvoiceId()
                + " seeded (patient 1, lab order 1, CANCELLED) — " + saved.getDescription());
    }
}
