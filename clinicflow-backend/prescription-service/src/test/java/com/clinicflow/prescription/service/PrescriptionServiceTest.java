package com.clinicflow.prescription.service;

import com.clinicflow.prescription.client.BillingServiceClient;
import com.clinicflow.prescription.client.NotificationServiceClient;
import com.clinicflow.prescription.dto.PrescriptionRequestDTO;
import com.clinicflow.prescription.dto.PrescriptionResponseDTO;
import com.clinicflow.prescription.entity.MedicationMaster;
import com.clinicflow.prescription.entity.Prescription;
import com.clinicflow.prescription.entity.PrescriptionStatus;
import com.clinicflow.prescription.repository.MedicationMasterRepository;
import com.clinicflow.prescription.repository.PrescriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PrescriptionService Unit Tests")
class PrescriptionServiceTest {

    @Mock private PrescriptionRepository     prescriptionRepo;
    @Mock private MedicationMasterRepository medicationRepo;
    @Mock private BillingServiceClient       billingServiceClient;
    @Mock private NotificationServiceClient  notificationServiceClient;
    @InjectMocks private PrescriptionService prescriptionService;

    // ─── create ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create: resolves medication name from master table when medId provided")
    void create_withMedId_resolvesMedicationNameFromMaster() {
        MedicationMaster master = new MedicationMaster();
        master.setMedId(1L);
        master.setName("Aspirin 500mg");

        PrescriptionRequestDTO dto = buildRequestDTO(1L, "AnyName", 10L, 5L, 3L);
        Prescription saved = buildPrescription(1L, PrescriptionStatus.DRAFT, "Aspirin 500mg");

        when(medicationRepo.findById(1L)).thenReturn(Optional.of(master));
        when(prescriptionRepo.save(any(Prescription.class))).thenReturn(saved);

        PrescriptionResponseDTO result = prescriptionService.create(dto);

        assertThat(result.getMedicationName()).isEqualTo("Aspirin 500mg");
    }

    @Test
    @DisplayName("create: falls back to DTO medication name when medId not in master")
    void create_whenMedIdNotInMaster_usesDtoName() {
        PrescriptionRequestDTO dto = buildRequestDTO(99L, "Custom Drug", 10L, 5L, 3L);
        Prescription saved = buildPrescription(1L, PrescriptionStatus.DRAFT, "Custom Drug");

        when(medicationRepo.findById(99L)).thenReturn(Optional.empty());
        when(prescriptionRepo.save(any())).thenReturn(saved);

        PrescriptionResponseDTO result = prescriptionService.create(dto);

        assertThat(result.getMedicationName()).isEqualTo("Custom Drug");
    }

    @Test
    @DisplayName("create: uses DTO medication name when medId is null")
    void create_withoutMedId_usesDtoName() {
        PrescriptionRequestDTO dto = buildRequestDTO(null, "Ibuprofen 400mg", 10L, 5L, 3L);
        Prescription saved = buildPrescription(1L, PrescriptionStatus.DRAFT, "Ibuprofen 400mg");

        when(prescriptionRepo.save(any())).thenReturn(saved);

        PrescriptionResponseDTO result = prescriptionService.create(dto);

        assertThat(result.getMedicationName()).isEqualTo("Ibuprofen 400mg");
        verify(medicationRepo, never()).findById(any());
    }

    @Test
    @DisplayName("create: sets status to DRAFT")
    void create_setsDraftStatus() {
        PrescriptionRequestDTO dto = buildRequestDTO(null, "Aspirin", 10L, 5L, 3L);
        Prescription saved = buildPrescription(1L, PrescriptionStatus.DRAFT, "Aspirin");

        when(prescriptionRepo.save(any())).thenReturn(saved);

        PrescriptionResponseDTO result = prescriptionService.create(dto);

        assertThat(result.getStatus()).isEqualTo("DRAFT");
    }

    // ─── get ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("get: returns DTO when prescription found")
    void get_whenFound_returnsDTO() {
        Prescription p = buildPrescription(1L, PrescriptionStatus.DRAFT, "Aspirin");
        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(p));

        PrescriptionResponseDTO result = prescriptionService.get(1L);

        assertThat(result.getRxId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("get: throws NoSuchElementException when prescription not found")
    void get_whenNotFound_throwsNoSuchElement() {
        when(prescriptionRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> prescriptionService.get(99L))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("99");
    }

    // ─── getByPatient ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getByPatient: returns all prescriptions for patient")
    void getByPatient_returnsList() {
        List<Prescription> prescriptions = List.of(
                buildPrescription(1L, PrescriptionStatus.ISSUED, "Aspirin"),
                buildPrescription(2L, PrescriptionStatus.DISPENSED, "Panadol"));
        when(prescriptionRepo.findByPatientId(10L)).thenReturn(prescriptions);

        List<PrescriptionResponseDTO> result = prescriptionService.getByPatient(10L);

        assertThat(result).hasSize(2);
    }

    // ─── issue ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("issue: sets status to ISSUED and sets issuedAt")
    void issue_setsIssuedStatusAndTimestamp() {
        Prescription p = buildPrescription(1L, PrescriptionStatus.DRAFT, "Aspirin");
        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(p));
        when(prescriptionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PrescriptionResponseDTO result = prescriptionService.issue(1L);

        assertThat(result.getStatus()).isEqualTo("ISSUED");
        assertThat(p.getIssuedAt()).isNotNull();
    }

    @Test
    @DisplayName("issue: calls billing and notification services (fire-and-forget)")
    void issue_callsBillingAndNotification() {
        Prescription p = buildPrescription(1L, PrescriptionStatus.DRAFT, "Aspirin");
        p.setPatientId(5L);
        p.setEncounterId(100L);
        p.setMedicationName("Aspirin");
        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(p));
        when(prescriptionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        prescriptionService.issue(1L);

        verify(billingServiceClient).createPrescriptionInvoice(5L, 100L, 1L, "Aspirin");
        verify(notificationServiceClient).notifyPrescriptionIssued(5L, 1L, "Aspirin");
    }

    @Test
    @DisplayName("issue: throws NoSuchElementException when prescription not found")
    void issue_whenNotFound_throws() {
        when(prescriptionRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> prescriptionService.issue(99L))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ─── dispense ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("dispense: sets status to DISPENSED")
    void dispense_setsDispensedStatus() {
        Prescription p = buildPrescription(1L, PrescriptionStatus.ISSUED, "Aspirin");
        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(p));
        when(prescriptionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PrescriptionResponseDTO result = prescriptionService.dispense(1L);

        assertThat(result.getStatus()).isEqualTo("DISPENSED");
    }

    @Test
    @DisplayName("dispense: notifies patient after dispensing")
    void dispense_notifiesPatient() {
        Prescription p = buildPrescription(1L, PrescriptionStatus.ISSUED, "Aspirin");
        p.setPatientId(5L);
        p.setMedicationName("Aspirin");
        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(p));
        when(prescriptionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        prescriptionService.dispense(1L);

        verify(notificationServiceClient).notifyPrescriptionDispensed(5L, 1L, "Aspirin");
    }

    @Test
    @DisplayName("dispense: throws NoSuchElementException when not found")
    void dispense_whenNotFound_throws() {
        when(prescriptionRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> prescriptionService.dispense(99L))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ─── cancel ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancel: sets status to CANCELLED")
    void cancel_setsCancelledStatus() {
        Prescription p = buildPrescription(1L, PrescriptionStatus.DRAFT, "Aspirin");
        when(prescriptionRepo.findById(1L)).thenReturn(Optional.of(p));
        when(prescriptionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PrescriptionResponseDTO result = prescriptionService.cancel(1L);

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    @DisplayName("cancel: throws NoSuchElementException when not found")
    void cancel_whenNotFound_throws() {
        when(prescriptionRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> prescriptionService.cancel(99L))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ─── getByEncounter ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getByEncounter: returns prescriptions for an encounter")
    void getByEncounter_returnsList() {
        List<Prescription> prescriptions = List.of(
                buildPrescription(1L, PrescriptionStatus.ISSUED, "Aspirin"));
        when(prescriptionRepo.findByEncounterId(50L)).thenReturn(prescriptions);

        List<PrescriptionResponseDTO> result = prescriptionService.getByEncounter(50L);

        assertThat(result).hasSize(1);
    }

    // ─── getIssued ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getIssued: returns all ISSUED prescriptions (pharmacy queue)")
    void getIssued_returnsIssuedList() {
        List<Prescription> issued = List.of(
                buildPrescription(1L, PrescriptionStatus.ISSUED, "Aspirin"),
                buildPrescription(2L, PrescriptionStatus.ISSUED, "Panadol"));
        when(prescriptionRepo.findByStatus(PrescriptionStatus.ISSUED)).thenReturn(issued);

        List<PrescriptionResponseDTO> result = prescriptionService.getIssued();

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(r -> "ISSUED".equals(r.getStatus()));
    }

    // ─── hardDelete ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("hardDelete: permanently removes prescription when found")
    void hardDelete_whenFound_deletes() {
        when(prescriptionRepo.existsById(1L)).thenReturn(true);
        doNothing().when(prescriptionRepo).hardDeleteById(1L);

        prescriptionService.hardDelete(1L);

        verify(prescriptionRepo).hardDeleteById(1L);
    }

    @Test
    @DisplayName("hardDelete: throws NoSuchElementException when not found")
    void hardDelete_whenNotFound_throws() {
        when(prescriptionRepo.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> prescriptionService.hardDelete(99L))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("99");
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private PrescriptionRequestDTO buildRequestDTO(Long medId, String medicationName,
                                                    Long patientId, Long doctorId, Long encounterId) {
        PrescriptionRequestDTO dto = new PrescriptionRequestDTO();
        dto.setMedId(medId);
        dto.setMedicationName(medicationName);
        dto.setPatientId(patientId);
        dto.setDoctorId(doctorId);
        dto.setEncounterId(encounterId);
        dto.setDosage("500mg");
        dto.setFrequency("TID");
        dto.setDurationDays(7);
        dto.setQuantity(21);
        return dto;
    }

    private Prescription buildPrescription(Long id, PrescriptionStatus status, String medicationName) {
        Prescription p = new Prescription();
        p.setRxId(id);
        p.setStatus(status);
        p.setMedicationName(medicationName);
        p.setPatientId(10L);
        p.setDoctorId(5L);
        p.setEncounterId(100L);
        return p;
    }
}
