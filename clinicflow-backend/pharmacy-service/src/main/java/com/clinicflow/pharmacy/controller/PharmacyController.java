package com.clinicflow.pharmacy.controller;

import org.springframework.web.bind.annotation.*;

import com.clinicflow.pharmacy.dto.*;
import com.clinicflow.pharmacy.service.PharmacyService;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
public class PharmacyController {

    private final PharmacyService service;

    public PharmacyController(PharmacyService service) {
        this.service = service;
    }

    // ✅ CREATE
    @PostMapping("/inventory")
    public InventoryItemDTO add(@RequestBody InventoryItemDTO dto) {
        return service.addStock(dto);
    }

    // ✅ READ ALL
    @GetMapping("/inventory")
    public List<InventoryItemDTO> all() {
        return service.getAllInventory();
    }

    // ✅ READ BY ID
    @GetMapping("/inventory/{id}")
    public InventoryItemDTO get(@PathVariable Long id) {
        return service.getInventoryById(id);
    }

    // ✅ READ BY MEDICATION
    @GetMapping("/inventory/medication/{medId}")
    public List<InventoryItemDTO> byMed(@PathVariable Long medId) {
        return service.getByMedication(medId);
    }

    // ✅ UPDATE
    @PutMapping("/inventory/{id}")
    public InventoryItemDTO update(@PathVariable Long id,
                                   @RequestBody InventoryItemDTO dto) {
        return service.update(id, dto);
    }

    // ✅ SOFT DELETE — marks item as REMOVED
    @DeleteMapping("/inventory/{id}")
    public InventoryItemDTO delete(@PathVariable Long id) {
        return service.delete(id);
    }

    // ✅ HARD DELETE — permanently removes one item from DB
    @DeleteMapping("/inventory/{id}/hard")
    public void hardDelete(@PathVariable Long id) {
        service.hardDelete(id);
    }

    // ✅ PURGE REMOVED — permanently deletes all REMOVED items; returns count
    @DeleteMapping("/inventory/purge-removed")
    public java.util.Map<String, Object> purgeRemoved() {
        int count = service.purgeRemoved();
        return java.util.Map.of("purged", count, "message",
                count + " removed item(s) permanently deleted.");
    }

    // ✅ PATCH STATUS — manual override (e.g. mark EXPIRED from UI)
    @PatchMapping("/inventory/{id}/status")
    public InventoryItemDTO patchStatus(@PathVariable Long id,
                                        @RequestParam String status) {
        return service.updateStatus(id, status);
    }

    // ✅ DISPENSE
    @PostMapping("/dispense")
    public DispenseResponseDTO dispense(@RequestBody DispenseRequestDTO dto) {
        return service.dispense(dto);
    }

    // ✅ HISTORY
    @GetMapping("/dispense/history/{patientId}")
    public List<DispenseResponseDTO> history(@PathVariable Long patientId) {
        return service.history(patientId);
    }

}