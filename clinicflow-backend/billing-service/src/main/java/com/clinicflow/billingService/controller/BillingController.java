//WEB LAYER FOR FINANCE MODULE
package com.clinicflow.billingService.controller;

import com.clinicflow.billingService.entity.Invoice;
import com.clinicflow.billingService.entity.Payment;
import com.clinicflow.billingService.service.BillingService;
import com.clinicflow.billingService.service.EncounterService;
import com.clinicflow.billingService.service.PdfExportService;
import com.clinicflow.billingService.client.PatientServiceClient;
import com.clinicflow.billingService.dto.InvoiceDTO;
import com.clinicflow.billingService.dto.PatientDTO;
import com.clinicflow.billingService.dto.PaymentDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.clinicflow.billingService.exception.ObjectNotFoundException;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {
    private final BillingService     billingService;
    private final PdfExportService   pdfExportService;
    private final PatientServiceClient patientService;
    private final EncounterService   encounterService;   // service layer — not raw Feign client

    // --- Invoice CRUD Operations ---

    @PostMapping("/invoices")
    public ResponseEntity<Invoice> generateInvoice(@RequestBody InvoiceDTO invoiceDto) {
        PatientDTO patient = patientService.getPatient(invoiceDto.getPatientId());
        if (patient == null) {
            throw new ObjectNotFoundException("Patient id " + invoiceDto.getPatientId() + " not found");
        }
        // Reuse the Feign call already made above — no extra network hop
        if (invoiceDto.getPatientName() == null || invoiceDto.getPatientName().isBlank()) {
            invoiceDto.setPatientName(patient.getName());
        }
        if (invoiceDto.getEncounterId() != null && invoiceDto.getEncounterId() != 0
                && encounterService.getEncounterById(invoiceDto.getEncounterId()) == null) {
            throw new ObjectNotFoundException("Encounter id " + invoiceDto.getEncounterId() + " not found");
        }
        return ResponseEntity.ok(billingService.createInvoice(invoiceDto.toEntity()));
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(billingService.getAllInvoices());
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return billingService.getByInvoiceId(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ObjectNotFoundException("Invoice not found with ID: " + id));
    }

    @PutMapping("/invoices/{id}")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id, @RequestBody InvoiceDTO invoiceDto) {
        if(patientService.getPatient(invoiceDto.getPatientId())==null){
            throw new ObjectNotFoundException("Patient id "+invoiceDto.getPatientId()+" not found");
        }
        if(invoiceDto.getEncounterId() != null && invoiceDto.getEncounterId() != 0
                && encounterService.getEncounterById(invoiceDto.getEncounterId()) == null){
            throw new ObjectNotFoundException("Encounter id "+invoiceDto.getEncounterId()+" not found");
        }
        return ResponseEntity.ok(billingService.updateInvoice(id, invoiceDto.toEntity()));
    }

    @DeleteMapping("/invoices/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        billingService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    // --- Specialized Queries ---

    @GetMapping("/invoices/patient/{patientId}")
    public ResponseEntity<List<Invoice>> getPatientInvoices(@PathVariable Long patientId) {
        List<Invoice> invoices = billingService.getInvoicesByPatientId(patientId);
        return ResponseEntity.ok(invoices);
    }

    // --- Payment Operations ---

    @PostMapping("/payments")
    public ResponseEntity<PaymentDTO> recordPayment(@RequestBody PaymentDTO paymentDto) {
        if(patientService.getPatient(paymentDto.getPatientId())==null){
            throw new ObjectNotFoundException("Patient id "+paymentDto.getPatientId()+" not found");
        }
        if(billingService.getByInvoiceId(paymentDto.getInvoiceId()).isEmpty()){
            throw new ObjectNotFoundException("Invoice ID "+paymentDto.getInvoiceId()+" not found");
        }
        Payment savedPayment = billingService.processPayment(paymentDto.toEntity());
        return ResponseEntity.ok(PaymentDTO.fromEntity(savedPayment));
    }

    @GetMapping("/payments/invoice/{invoiceId}")
    public ResponseEntity<List<Payment>> getInvoicePayments(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(billingService.getPaymentsByInvoiceId(invoiceId));
    }

    @PutMapping("/payments/{id}")
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody PaymentDTO paymentDto) {
        // Ensure the DTO reflects the ID from the URL path
        paymentDto.setPaymentId(id);
        if(patientService.getPatient(paymentDto.getPatientId())==null){
            throw new ObjectNotFoundException("Patient id "+paymentDto.getPatientId()+" not found");
        }
        if(billingService.getByInvoiceId(paymentDto.getInvoiceId()).isEmpty()){
            throw new ObjectNotFoundException("Invoice ID "+paymentDto.getInvoiceId()+" not found");
        }
        Payment updatedPayment = billingService.updatePayment(id, paymentDto.toEntity());
        return ResponseEntity.ok(updatedPayment);
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        billingService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }

    // --- Backfill patient names for invoices that were created before the patientName column existed ---

    @PutMapping("/invoices/backfill-names")
    public ResponseEntity<Map<String, Object>> backfillPatientNames() {
        List<Invoice> missing = billingService.getAllInvoices().stream()
                .filter(inv -> inv.getPatientName() == null || inv.getPatientName().isBlank())
                .collect(java.util.stream.Collectors.toList());

        int updated = 0, skipped = 0;
        for (Invoice inv : missing) {
            try {
                PatientDTO p = patientService.getPatient(inv.getPatientId());
                if (p != null && p.getName() != null && !p.getName().isBlank()) {
                    billingService.updatePatientName(inv.getInvoiceId(), p.getName());
                    updated++;
                } else {
                    skipped++;
                }
            } catch (Exception e) {
                skipped++;   // consultation-service unavailable or patient deleted — skip gracefully
            }
        }

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("processed", missing.size());
        result.put("updated",   updated);
        result.put("skipped",   skipped);
        return ResponseEntity.ok(result);
    }

    // --- Patient Lookup (proxies consultation-service, used by the frontend for name resolution) ---

    @GetMapping("/patient/{id}")
    public ResponseEntity<PatientDTO> getPatientById(@PathVariable Long id) {
        // FeignExceptionHandler already maps FeignException.NotFound → 404
        PatientDTO patient = patientService.getPatient(id);
        return ResponseEntity.ok(patient);
    }

    // --- Export Operations ---

    @GetMapping("/invoices/{invoiceId}/pdf")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long invoiceId) {
        Optional<Invoice> invoice = billingService.getByInvoiceId(invoiceId);
        if (invoice.isEmpty()) {
            throw new ObjectNotFoundException("No payments found for invoice ID: " + invoiceId);
        }
        byte[] pdfBytes = pdfExportService.generateInvoicePdf(invoice.get()); // Placeholder for actual PDF generation logic
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=invoice_" + invoiceId + ".pdf")
                .body(pdfBytes);
    }

    // --- Exception Handling ---

    @ExceptionHandler(ObjectNotFoundException.class)
    public ResponseEntity<String> handleObjectNotFound(ObjectNotFoundException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleBusinessLogicError(IllegalStateException ex) {
        return ResponseEntity.status(400).body(ex.getMessage());
    }
}