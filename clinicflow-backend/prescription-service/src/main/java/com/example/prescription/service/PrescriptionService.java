package com.clinicflow.prescription.service;

import org.springframework.stereotype.Service;

import com.clinicflow.prescription.client.BillingServiceClient;
import com.clinicflow.prescription.client.NotificationServiceClient;
import com.clinicflow.prescription.dto.*;
import com.clinicflow.prescription.entity.*;
import com.clinicflow.prescription.repository.*;

import java.util.NoSuchElementException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PrescriptionService {

    private final PrescriptionRepository     prescriptionRepo;
    private final MedicationMasterRepository medicationRepo;
    private final BillingServiceClient       billingServiceClient;
    private final NotificationServiceClient  notificationServiceClient;

    public PrescriptionService(PrescriptionRepository prescriptionRepo,
                               MedicationMasterRepository medicationRepo,
                               BillingServiceClient billingServiceClient,
                               NotificationServiceClient notificationServiceClient) {
        this.prescriptionRepo          = prescriptionRepo;
        this.medicationRepo            = medicationRepo;
        this.billingServiceClient      = billingServiceClient;
        this.notificationServiceClient = notificationServiceClient;
    }

    // ✅ CREATE
    public PrescriptionResponseDTO create(PrescriptionRequestDTO dto) {

        // Resolve medication name: prefer master table, fall back to DTO field
        String resolvedName = (dto.getMedId() != null)
                ? medicationRepo.findById(dto.getMedId())
                        .map(MedicationMaster::getName)
                        .orElse(dto.getMedicationName())
                : dto.getMedicationName();

        Prescription p = new Prescription();

        p.setEncounterId(dto.getEncounterId());
        p.setPatientId(dto.getPatientId());
        p.setDoctorId(dto.getDoctorId());

        p.setMedId(dto.getMedId());
        p.setMedicationName(resolvedName);

        p.setDosage(dto.getDosage());
        p.setFrequency(dto.getFrequency());
        p.setDurationDays(dto.getDurationDays());
        p.setQuantity(dto.getQuantity());
        p.setRepeats(dto.getRepeats());
        p.setRoute(dto.getRoute());
        p.setNotes(dto.getNotes());

        p.setStatus(PrescriptionStatus.DRAFT);

        return map(prescriptionRepo.save(p));
    }

    // ✅ GET BY ID
    public PrescriptionResponseDTO get(Long id) {
        return map(prescriptionRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Prescription not found with id: " + id)));
    }

    // ✅ GET BY PATIENT
    public List<PrescriptionResponseDTO> getByPatient(Long patientId) {
        return prescriptionRepo.findByPatientId(patientId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    // ✅ ISSUE
    public PrescriptionResponseDTO issue(Long id) {

        Prescription p = prescriptionRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Prescription not found with id: " + id));

        p.setStatus(PrescriptionStatus.ISSUED);
        p.setIssuedAt(LocalDateTime.now());

        PrescriptionResponseDTO result = map(prescriptionRepo.save(p));

        // Fire-and-forget: create a PENDING invoice in billing-service.
        // Failures are swallowed inside billingServiceClient — never blocks dispensing.
        billingServiceClient.createPrescriptionInvoice(
                p.getPatientId(),
                p.getEncounterId(),
                p.getRxId(),
                p.getMedicationName());

        // Fire-and-forget: notify the patient their prescription is ready.
        notificationServiceClient.notifyPrescriptionIssued(
                p.getPatientId(), p.getRxId(), p.getMedicationName());

        return result;
    }

    // ✅ GET BY ENCOUNTER
    public List<PrescriptionResponseDTO> getByEncounter(Long encounterId) {
        return prescriptionRepo.findByEncounterId(encounterId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    // ✅ DISPENSE
    public PrescriptionResponseDTO dispense(Long id) {

        Prescription p = prescriptionRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Prescription not found with id: " + id));

        p.setStatus(PrescriptionStatus.DISPENSED);
        PrescriptionResponseDTO result = map(prescriptionRepo.save(p));

        // Fire-and-forget: notify the patient their prescription has been dispensed.
        notificationServiceClient.notifyPrescriptionDispensed(
                p.getPatientId(), p.getRxId(), p.getMedicationName());

        return result;
    }

    // ✅ GET ALL ISSUED (pharmacy queue)
    public List<PrescriptionResponseDTO> getIssued() {
        return prescriptionRepo.findByStatus(PrescriptionStatus.ISSUED)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    // ✅ CANCEL
    public PrescriptionResponseDTO cancel(Long id) {

        Prescription p = prescriptionRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Prescription not found with id: " + id));

        p.setStatus(PrescriptionStatus.CANCELLED);
        return map(prescriptionRepo.save(p));
    }

    // ✅ HARD DELETE — permanently removes row from DB
    public void hardDelete(Long id) {
        if (!prescriptionRepo.existsById(id)) {
            throw new NoSuchElementException("Prescription not found with id: " + id);
        }
        prescriptionRepo.hardDeleteById(id);
    }


    // ✅ MAPPER
    private PrescriptionResponseDTO map(Prescription p) {

        PrescriptionResponseDTO dto = new PrescriptionResponseDTO();

        dto.setRxId(p.getRxId());
        dto.setPatientId(p.getPatientId());
        dto.setEncounterId(p.getEncounterId());
        dto.setDoctorId(p.getDoctorId());
        dto.setMedId(p.getMedId());
        dto.setMedicationName(p.getMedicationName());
        dto.setDosage(p.getDosage());
        dto.setFrequency(p.getFrequency());
        dto.setDurationDays(p.getDurationDays());
        dto.setQuantity(p.getQuantity());
        dto.setRepeats(p.getRepeats());
        dto.setRoute(p.getRoute());
        dto.setNotes(p.getNotes());
        dto.setStatus(p.getStatus().name());
        dto.setIssuedAt(p.getIssuedAt());

        return dto;
    }
}