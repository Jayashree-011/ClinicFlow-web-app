package com.clinicflow.billingService.controller;

import com.clinicflow.billingService.dto.ServiceItemDTO;
import com.clinicflow.billingService.entity.ServiceItem;
import com.clinicflow.billingService.exception.ObjectNotFoundException;
import com.clinicflow.billingService.service.ServiceItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for the service-item catalog.
 *
 * Base path: /api/billing/service-items
 *
 * Service items represent billable line items (consultations, lab tests,
 * imaging procedures, etc.) that can be looked up by category and attached
 * to an invoice.  These are also the price catalog used by consultation-service,
 * prescription-service, and lab-service when auto-creating invoices.
 */
@RestController
@RequestMapping("/api/billing/service-items")
@RequiredArgsConstructor
public class ServiceItemController {

    private final ServiceItemService serviceItemService;

    /* ── Create ──────────────────────────────────────────────────────────── */

    @PostMapping
    public ResponseEntity<ServiceItemDTO> createServiceItem(@RequestBody ServiceItemDTO dto) {
        return ResponseEntity.ok(serviceItemService.createServiceItem(dto));
    }

    /* ── Read ────────────────────────────────────────────────────────────── */

    @GetMapping
    public ResponseEntity<List<ServiceItemDTO>> getAllServiceItems() {
        return ResponseEntity.ok(serviceItemService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceItemDTO> getServiceItemById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceItemService.getById(id));
    }

    /** All line items attached to a specific invoice. */
    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<List<ServiceItemDTO>> getByInvoice(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(serviceItemService.getByInvoice(invoiceId));
    }

    /** All line items ever billed to a patient across all invoices. */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ServiceItemDTO>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(serviceItemService.getByPatient(patientId));
    }

    /**
     * Price catalog lookup by billing category.
     * Example: GET /api/billing/service-items/category/CONSULTATION
     * Valid values: CONSULTATION, LAB_TEST, IMAGING, PROCEDURE, OTHER
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<ServiceItemDTO>> getByCategory(
            @PathVariable ServiceItem.BillingCategory category) {
        return ResponseEntity.ok(serviceItemService.getByCategory(category));
    }

    /* ── Update ──────────────────────────────────────────────────────────── */

    @PutMapping("/{id}")
    public ResponseEntity<ServiceItemDTO> updateServiceItem(
            @PathVariable Long id, @RequestBody ServiceItemDTO dto) {
        return ResponseEntity.ok(serviceItemService.updateServiceItem(id, dto));
    }

    /* ── Delete ──────────────────────────────────────────────────────────── */

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteServiceItem(@PathVariable Long id) {
        serviceItemService.deleteServiceItem(id);
        return ResponseEntity.noContent().build();
    }

    /* ── Exception handling ──────────────────────────────────────────────── */

    @ExceptionHandler(ObjectNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ObjectNotFoundException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(400).body(ex.getMessage());
    }
}
