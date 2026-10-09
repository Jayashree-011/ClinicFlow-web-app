package com.clinicflow.prescription.controller;

import org.springframework.web.bind.annotation.*;

import com.clinicflow.prescription.dto.*;
import com.clinicflow.prescription.service.PrescriptionService;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService service;

    public PrescriptionController(PrescriptionService service) {
        this.service = service;
    }

    // ✅ CREATE
    @PostMapping
    public PrescriptionResponseDTO create(@RequestBody PrescriptionRequestDTO dto) {
        return service.create(dto);
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public PrescriptionResponseDTO get(@PathVariable Long id) {
        return service.get(id);
    }

    // ✅ GET BY PATIENT
    @GetMapping("/patient/{patientId}")
    public List<PrescriptionResponseDTO> getByPatient(@PathVariable Long patientId) {
        return service.getByPatient(patientId);
    }

    // ✅ UPDATE → ISSUE
    @PutMapping("/{id}/issue")
    public PrescriptionResponseDTO issue(@PathVariable Long id) {
        return service.issue(id);
    }

    // ✅ UPDATE → DISPENSE
    @PutMapping("/{id}/dispense")
    public PrescriptionResponseDTO dispense(@PathVariable Long id) {
        return service.dispense(id);
    }

    // ✅ GET ALL ISSUED (pharmacy queue)
    @GetMapping("/issued")
    public List<PrescriptionResponseDTO> getIssued() {
        return service.getIssued();
    }

    // ✅ GET BY ENCOUNTER
    @GetMapping("/encounter/{encounterId}")
    public List<PrescriptionResponseDTO> getByEncounter(@PathVariable Long encounterId) {
        return service.getByEncounter(encounterId);
    }

    // ✅ DELETE (SOFT) — sets status CANCELLED
    @DeleteMapping("/{id}")
    public PrescriptionResponseDTO cancel(@PathVariable Long id) {
        return service.cancel(id);
    }

    // ✅ HARD DELETE — permanently removes row from DB
    @DeleteMapping("/{id}/hard")
    public void hardDelete(@PathVariable Long id) {
        service.hardDelete(id);
    }

}