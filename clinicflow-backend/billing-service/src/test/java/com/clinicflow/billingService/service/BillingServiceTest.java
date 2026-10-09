package com.clinicflow.billingService.service;

import com.clinicflow.billingService.entity.Invoice;
import com.clinicflow.billingService.entity.Payment;
import com.clinicflow.billingService.event.InvoiceCreatedEvent;
import com.clinicflow.billingService.event.InvoiceStatusChangedEvent;
import com.clinicflow.billingService.exception.ObjectNotFoundException;
import com.clinicflow.billingService.repository.InvoiceRepository;
import com.clinicflow.billingService.repository.PaymentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingService Unit Tests")
class BillingServiceTest {

    @Mock private InvoiceRepository       invoiceRepository;
    @Mock private PaymentRepository       paymentRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @InjectMocks private BillingService billingService;

    // ─── createInvoice ────────────────────────────────────────────────────────

    @Test
    @DisplayName("createInvoice: calculates total = subtotal + taxes - discounts")
    void createInvoice_calculatesTotalCorrectly() {
        Invoice invoice = buildInvoice(null, 1L,
                new BigDecimal("100.00"),
                new BigDecimal("10.00"),
                new BigDecimal("5.00"));
        when(invoiceRepository.save(any())).thenAnswer(inv -> {
            Invoice i = inv.getArgument(0);
            i.setInvoiceId(1L);
            return i;
        });

        Invoice result = billingService.createInvoice(invoice);

        // 100 + 10 - 5 = 105
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("105.00"));
    }

    @Test
    @DisplayName("createInvoice: sets issuedAt when not provided")
    void createInvoice_setsIssuedAtWhenNull() {
        Invoice invoice = buildInvoice(null, 1L,
                new BigDecimal("50.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        invoice.setIssuedAt(null);

        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Invoice result = billingService.createInvoice(invoice);

        assertThat(result.getIssuedAt()).isNotNull();
    }

    @Test
    @DisplayName("createInvoice: preserves caller-supplied issuedAt")
    void createInvoice_preservesProvidedIssuedAt() {
        LocalDateTime fixedDate = LocalDateTime.of(2026, 1, 15, 10, 0);
        Invoice invoice = buildInvoice(null, 1L,
                new BigDecimal("50.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        invoice.setIssuedAt(fixedDate);

        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Invoice result = billingService.createInvoice(invoice);

        assertThat(result.getIssuedAt()).isEqualTo(fixedDate);
    }

    @Test
    @DisplayName("createInvoice: publishes InvoiceCreatedEvent")
    void createInvoice_publishesInvoiceCreatedEvent() {
        Invoice invoice = buildInvoice(null, 1L,
                new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        when(invoiceRepository.save(any())).thenAnswer(inv -> {
            Invoice i = inv.getArgument(0);
            i.setInvoiceId(1L);
            return i;
        });

        billingService.createInvoice(invoice);

        ArgumentCaptor<InvoiceCreatedEvent> captor = ArgumentCaptor.forClass(InvoiceCreatedEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().getInvoice().getInvoiceId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("createInvoice: generates description for appointment invoice")
    void createInvoice_generatesDescriptionForAppointment() {
        Invoice invoice = buildInvoice(null, 1L,
                new BigDecimal("150.00"), new BigDecimal("15.00"), BigDecimal.ZERO);
        invoice.setAppointmentId(200L);

        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Invoice result = billingService.createInvoice(invoice);

        assertThat(result.getDescription())
                .contains("Consultation fee")
                .contains("Patient #1")
                .contains("Appointment #200");
    }

    @Test
    @DisplayName("createInvoice: generates description for prescription invoice")
    void createInvoice_generatesDescriptionForPrescription() {
        Invoice invoice = buildInvoice(null, 1L,
                new BigDecimal("50.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        invoice.setPrescriptionId(300L);

        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Invoice result = billingService.createInvoice(invoice);

        assertThat(result.getDescription())
                .contains("Prescription charge")
                .contains("Prescription #300");
    }

    @Test
    @DisplayName("createInvoice: handles null subtotal/taxes/discounts gracefully")
    void createInvoice_whenNullFinancials_treatsAsZero() {
        Invoice invoice = new Invoice();
        invoice.setPatientId(1L);
        invoice.setStatus(Invoice.InvoiceStatus.PENDING);
        invoice.setSubtotal(null);
        invoice.setTaxes(null);
        invoice.setDiscounts(null);

        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Invoice result = billingService.createInvoice(invoice);

        assertThat(result.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ─── processPayment ───────────────────────────────────────────────────────

    @Test
    @DisplayName("processPayment: throws ObjectNotFoundException when invoice not found")
    void processPayment_whenInvoiceNotFound_throwsObjectNotFound() {
        Payment payment = buildPayment(null, 99L, new BigDecimal("100.00"),
                Payment.PaymentStatus.COMPLETED);
        when(invoiceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.processPayment(payment))
                .isInstanceOf(ObjectNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("processPayment: throws IllegalStateException when invoice already PAID")
    void processPayment_whenAlreadyPaid_throwsIllegalState() {
        Invoice paid = buildInvoice(1L, 1L,
                new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        paid.setStatus(Invoice.InvoiceStatus.PAID);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(paid));

        Payment payment = buildPayment(null, 1L, new BigDecimal("100.00"),
                Payment.PaymentStatus.COMPLETED);

        assertThatThrownBy(() -> billingService.processPayment(payment))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already settled");
    }

    @Test
    @DisplayName("processPayment: marks invoice PAID when full payment received")
    void processPayment_whenFullPayment_marksInvoicePaid() {
        Invoice invoice = buildInvoice(1L, 1L,
                new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        // total = 100
        invoice.setTotalAmount(new BigDecimal("100.00"));
        invoice.setStatus(Invoice.InvoiceStatus.PENDING);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Payment payment = buildPayment(null, 1L, new BigDecimal("100.00"),
                Payment.PaymentStatus.COMPLETED);

        billingService.processPayment(payment);

        assertThat(invoice.getStatus()).isEqualTo(Invoice.InvoiceStatus.PAID);
        verify(invoiceRepository).save(invoice);
        verify(eventPublisher).publishEvent(any(InvoiceStatusChangedEvent.class));
    }

    @Test
    @DisplayName("processPayment: invoice stays PENDING when payment is partial")
    void processPayment_whenPartialPayment_invoiceStaysPending() {
        Invoice invoice = buildInvoice(1L, 1L,
                new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        invoice.setTotalAmount(new BigDecimal("100.00"));
        invoice.setStatus(Invoice.InvoiceStatus.PENDING);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Payment payment = buildPayment(null, 1L, new BigDecimal("50.00"),
                Payment.PaymentStatus.COMPLETED);

        billingService.processPayment(payment);

        assertThat(invoice.getStatus()).isEqualTo(Invoice.InvoiceStatus.PENDING);
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("processPayment: sets paidAt timestamp")
    void processPayment_setsPaidAt() {
        Invoice invoice = buildInvoice(1L, 1L,
                new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        invoice.setTotalAmount(new BigDecimal("100.00"));
        invoice.setStatus(Invoice.InvoiceStatus.PENDING);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Payment payment = buildPayment(null, 1L, new BigDecimal("100.00"), null);

        Payment result = billingService.processPayment(payment);

        assertThat(result.getPaidAt()).isNotNull();
    }

    @Test
    @DisplayName("processPayment: defaults status to COMPLETED when null")
    void processPayment_whenStatusNull_defaultsToCompleted() {
        Invoice invoice = buildInvoice(1L, 1L,
                new BigDecimal("50.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        invoice.setTotalAmount(new BigDecimal("50.00"));
        invoice.setStatus(Invoice.InvoiceStatus.PENDING);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Payment payment = buildPayment(null, 1L, new BigDecimal("50.00"), null);

        Payment result = billingService.processPayment(payment);

        assertThat(result.getStatus()).isEqualTo(Payment.PaymentStatus.COMPLETED);
    }

    // ─── getByInvoiceId ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getByInvoiceId: returns invoice when found")
    void getByInvoiceId_whenFound_returnsInvoice() {
        Invoice invoice = buildInvoice(1L, 1L,
                new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        when(invoiceRepository.findByInvoiceId(1L)).thenReturn(Optional.of(invoice));

        Optional<Invoice> result = billingService.getByInvoiceId(1L);

        assertThat(result).isPresent();
    }

    // ─── getInvoicesByPatientId ───────────────────────────────────────────────

    @Test
    @DisplayName("getInvoicesByPatientId: returns all invoices for patient")
    void getInvoicesByPatientId_returnsPatientInvoices() {
        List<Invoice> invoices = List.of(
                buildInvoice(1L, 5L, new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO),
                buildInvoice(2L, 5L, new BigDecimal("50.00"), BigDecimal.ZERO, BigDecimal.ZERO));
        when(invoiceRepository.findByPatientId(5L)).thenReturn(invoices);

        List<Invoice> result = billingService.getInvoicesByPatientId(5L);

        assertThat(result).hasSize(2);
    }

    // ─── updateInvoice ────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateInvoice: recalculates total from updated financials")
    void updateInvoice_recalculatesTotal() {
        Invoice existing = buildInvoice(1L, 1L,
                new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        existing.setTotalAmount(new BigDecimal("100.00"));
        existing.setStatus(Invoice.InvoiceStatus.PENDING);

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Invoice updates = buildInvoice(null, 1L,
                new BigDecimal("200.00"), new BigDecimal("20.00"), new BigDecimal("10.00"));
        updates.setStatus(Invoice.InvoiceStatus.PENDING);

        Invoice result = billingService.updateInvoice(1L, updates);

        // 200 + 20 - 10 = 210
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("210.00"));
    }

    @Test
    @DisplayName("updateInvoice: throws ObjectNotFoundException when invoice not found")
    void updateInvoice_whenNotFound_throws() {
        when(invoiceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.updateInvoice(99L, new Invoice()))
                .isInstanceOf(ObjectNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── deleteInvoice ────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteInvoice: deletes when invoice found")
    void deleteInvoice_whenFound_deletes() {
        when(invoiceRepository.existsById(1L)).thenReturn(true);
        doNothing().when(invoiceRepository).deleteById(1L);

        billingService.deleteInvoice(1L);

        verify(invoiceRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deleteInvoice: throws ObjectNotFoundException when not found")
    void deleteInvoice_whenNotFound_throws() {
        when(invoiceRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> billingService.deleteInvoice(99L))
                .isInstanceOf(ObjectNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── deletePayment ────────────────────────────────────────────────────────

    @Test
    @DisplayName("deletePayment: deletes when payment found")
    void deletePayment_whenFound_deletes() {
        when(paymentRepository.existsById(1L)).thenReturn(true);
        doNothing().when(paymentRepository).deleteById(1L);

        billingService.deletePayment(1L);

        verify(paymentRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deletePayment: throws ObjectNotFoundException when not found")
    void deletePayment_whenNotFound_throws() {
        when(paymentRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> billingService.deletePayment(99L))
                .isInstanceOf(ObjectNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Invoice buildInvoice(Long id, Long patientId,
                                 BigDecimal subtotal, BigDecimal taxes, BigDecimal discounts) {
        Invoice inv = new Invoice();
        inv.setInvoiceId(id);
        inv.setPatientId(patientId);
        inv.setSubtotal(subtotal);
        inv.setTaxes(taxes);
        inv.setDiscounts(discounts);
        inv.setStatus(Invoice.InvoiceStatus.PENDING);
        inv.setIssuedAt(LocalDateTime.now());
        return inv;
    }

    private Payment buildPayment(Long id, Long invoiceId, BigDecimal amount,
                                  Payment.PaymentStatus status) {
        Payment p = new Payment();
        p.setPaymentId(id);
        p.setInvoiceId(invoiceId);
        p.setPatientId(1L);
        p.setAmount(amount);
        p.setPaymentMethod(Payment.PaymentMethod.CASH);
        p.setStatus(status);
        return p;
    }
}
