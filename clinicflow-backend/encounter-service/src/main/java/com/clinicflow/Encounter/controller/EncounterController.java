package com.clinicflow.Encounter.controller;

import com.clinicflow.Encounter.dto.EncounterCreateRequest;
import com.clinicflow.Encounter.dto.EncounterDTO;
import com.clinicflow.Encounter.entity.EncounterStatus;
import com.clinicflow.Encounter.service.EncounterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/encounter")
@Slf4j
public class EncounterController {
    
    private final EncounterService encounterService;
    
    @Autowired
    public EncounterController(EncounterService encounterService) {
        this.encounterService = encounterService;
    }
    
    @PostMapping
    public ResponseEntity<EncounterDTO> createEncounter(@RequestBody EncounterCreateRequest request) {
        log.info("Received request to create encounter for patient: {}", request.getPatientId());
        EncounterDTO encounter = encounterService.createEncounter(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(encounter);
    }
    
    @GetMapping("/{encounterId}")
    public ResponseEntity<EncounterDTO> getEncounterById(@PathVariable Long encounterId) {
        log.info("Fetching encounter: {}", encounterId);
        EncounterDTO encounter = encounterService.getEncounterById(encounterId);
        return ResponseEntity.ok(encounter);
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<EncounterDTO>> getEncountersByPatientId(@PathVariable Long patientId) {
        log.info("Fetching encounters for patient: {}", patientId);
        List<EncounterDTO> encounters = encounterService.getEncountersByPatient(patientId);
        return ResponseEntity.ok(encounters);
    }
    
    @GetMapping("/doctor/{doctorId}/status/{status}")
    public ResponseEntity<List<EncounterDTO>> getDoctorEncountersByStatus(
            @PathVariable Long doctorId,
            @PathVariable EncounterStatus status) {
        log.info("Fetching encounters for doctor: {} with status: {}", doctorId, status);
        List<EncounterDTO> encounters = encounterService.getEncountersByDoctorAndStatus(doctorId, status);
        return ResponseEntity.ok(encounters);
    }
    
    @GetMapping("/patient/{patientId}/range")
    public ResponseEntity<List<EncounterDTO>> getEncountersByDateRange(
            @PathVariable Long patientId,
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        log.info("Fetching encounters for patient: {} in range: {} to {}", patientId, start, end);
        List<EncounterDTO> encounters = encounterService.getEncountersByDateRange(patientId, start, end);
        return ResponseEntity.ok(encounters);
    }
    
    @PutMapping("/{encounterId}")
    public ResponseEntity<EncounterDTO> updateEncounter(
            @PathVariable Long encounterId,
            @RequestBody EncounterDTO requestDTO) {
        log.info("Updating encounter: {}", encounterId);
        EncounterDTO encounter = encounterService.updateEncounter(encounterId, requestDTO);
        return ResponseEntity.ok(encounter);
    }
    
    @PostMapping("/{encounterId}/complete")
    public ResponseEntity<EncounterDTO> completeEncounter(@PathVariable Long encounterId) {
        log.info("Completing encounter: {}", encounterId);
        EncounterDTO encounter = encounterService.completeEncounter(encounterId);
        return ResponseEntity.ok(encounter);
    }
    
    @PostMapping("/{encounterId}/sign")
    public ResponseEntity<EncounterDTO> signEncounter(
            @PathVariable Long encounterId,
            @RequestParam Long doctorId) {
        log.info("Signing encounter: {} by doctor: {}", encounterId, doctorId);
        EncounterDTO encounter = encounterService.signEncounter(encounterId, doctorId);
        return ResponseEntity.ok(encounter);
    }
    
    @PostMapping("/{encounterId}/cancel")
    public ResponseEntity<EncounterDTO> cancelEncounter(@PathVariable Long encounterId) {
        log.info("Cancelling encounter: {}", encounterId);
        EncounterDTO encounter = encounterService.cancelEncounter(encounterId);
        return ResponseEntity.ok(encounter);
    }
    
    @PostMapping("/{encounterId}/diagnosis")
    public ResponseEntity<EncounterDTO> addDiagnosis(
            @PathVariable Long encounterId,
            @RequestBody Object diagnosis) {
        log.info("Adding diagnosis to encounter: {}", encounterId);
        EncounterDTO encounter = encounterService.addDiagnosis(encounterId, diagnosis);
        return ResponseEntity.ok(encounter);
    }
    
    @PostMapping("/{encounterId}/vitals")
    public ResponseEntity<EncounterDTO> addVitals(
            @PathVariable Long encounterId,
            @RequestBody Object vitals) {
        log.info("Adding vitals to encounter: {}", encounterId);
        EncounterDTO encounter = encounterService.addVitals(encounterId, vitals);
        return ResponseEntity.ok(encounter);
    }
    
    @GetMapping("/patient/{patientId}/active")
    public ResponseEntity<Boolean> hasActiveEncounters(@PathVariable Long patientId) {
        log.info("Checking if patient has active encounters: {}", patientId);
        boolean hasActive = encounterService.hasActiveEncounters(patientId);
        return ResponseEntity.ok(hasActive);
    }
}
