package com.clinicflow.Encounter.service;

import com.clinicflow.Encounter.dto.EncounterCreateRequest;
import com.clinicflow.Encounter.dto.EncounterDTO;
import com.clinicflow.Encounter.entity.Encounter;
import com.clinicflow.Encounter.entity.EncounterStatus;
import com.clinicflow.Encounter.exception.EncounterNotFoundException;
import com.clinicflow.Encounter.exception.InvalidEncounterStateException;
import com.clinicflow.Encounter.repository.EncounterRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EncounterService Unit Tests")
class EncounterServiceTest {

    @Mock private EncounterRepository encounterRepository;
    @Spy  private ModelMapper         modelMapper = new ModelMapper();
    @Mock private ObjectMapper        objectMapper;
    @InjectMocks private EncounterService encounterService;

    // ─── createEncounter ──────────────────────────────────────────────────────

    @Test
    @DisplayName("createEncounter: saves encounter with IN_PROGRESS status")
    void createEncounter_setsInProgressStatus() {
        EncounterCreateRequest request = buildCreateRequest(1L, 10L, "OUTPATIENT");

        Encounter saved = buildEncounter(1L, 1L, 10L, EncounterStatus.IN_PROGRESS);
        when(encounterRepository.save(any(Encounter.class))).thenReturn(saved);

        EncounterDTO result = encounterService.createEncounter(request);

        assertThat(result.getStatus()).isEqualTo(EncounterStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("createEncounter: persists all required fields")
    void createEncounter_savesWithCorrectFields() {
        EncounterCreateRequest request = buildCreateRequest(1L, 10L, "INPATIENT");
        request.setChiefComplaint("Chest pain");

        Encounter saved = buildEncounter(1L, 1L, 10L, EncounterStatus.IN_PROGRESS);
        saved.setVisitType("INPATIENT");
        saved.setChiefComplaint("Chest pain");
        when(encounterRepository.save(any(Encounter.class))).thenReturn(saved);

        EncounterDTO result = encounterService.createEncounter(request);

        assertThat(result.getPatientId()).isEqualTo(1L);
        assertThat(result.getDoctorId()).isEqualTo(10L);
    }

    // ─── updateEncounter ──────────────────────────────────────────────────────

    @Test
    @DisplayName("updateEncounter: updates fields when encounter is IN_PROGRESS")
    void updateEncounter_whenInProgress_updatesFields() {
        Encounter existing = buildEncounter(1L, 1L, 10L, EncounterStatus.IN_PROGRESS);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(encounterRepository.save(any())).thenReturn(existing);

        EncounterDTO updates = new EncounterDTO();
        updates.setChiefComplaint("Updated complaint");

        EncounterDTO result = encounterService.updateEncounter(1L, updates);

        assertThat(existing.getChiefComplaint()).isEqualTo("Updated complaint");
    }

    @Test
    @DisplayName("updateEncounter: throws InvalidEncounterStateException when encounter is SIGNED")
    void updateEncounter_whenSigned_throwsInvalidState() {
        Encounter signed = buildEncounter(1L, 1L, 10L, EncounterStatus.SIGNED);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(signed));

        assertThatThrownBy(() -> encounterService.updateEncounter(1L, new EncounterDTO()))
                .isInstanceOf(InvalidEncounterStateException.class)
                .hasMessageContaining("signed");
    }

    @Test
    @DisplayName("updateEncounter: throws EncounterNotFoundException when encounter missing")
    void updateEncounter_whenNotFound_throws() {
        when(encounterRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> encounterService.updateEncounter(99L, new EncounterDTO()))
                .isInstanceOf(EncounterNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── completeEncounter ────────────────────────────────────────────────────

    @Test
    @DisplayName("completeEncounter: sets status COMPLETED and stamps endAt")
    void completeEncounter_whenInProgress_setsCompleted() {
        Encounter encounter = buildEncounter(1L, 1L, 10L, EncounterStatus.IN_PROGRESS);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(encounter));
        when(encounterRepository.save(any())).thenReturn(encounter);

        EncounterDTO result = encounterService.completeEncounter(1L);

        assertThat(encounter.getStatus()).isEqualTo(EncounterStatus.COMPLETED);
        assertThat(encounter.getEndAt()).isNotNull();
    }

    @Test
    @DisplayName("completeEncounter: throws InvalidEncounterStateException when not IN_PROGRESS")
    void completeEncounter_whenNotInProgress_throwsInvalidState() {
        Encounter encounter = buildEncounter(1L, 1L, 10L, EncounterStatus.COMPLETED);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(encounter));

        assertThatThrownBy(() -> encounterService.completeEncounter(1L))
                .isInstanceOf(InvalidEncounterStateException.class)
                .hasMessageContaining("Cannot complete");
    }

    @Test
    @DisplayName("completeEncounter: throws EncounterNotFoundException when not found")
    void completeEncounter_whenNotFound_throws() {
        when(encounterRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> encounterService.completeEncounter(99L))
                .isInstanceOf(EncounterNotFoundException.class);
    }

    // ─── signEncounter ────────────────────────────────────────────────────────

    @Test
    @DisplayName("signEncounter: sets status SIGNED, signedBy, and signedAt")
    void signEncounter_whenCompleted_setSigned() {
        Encounter encounter = buildEncounter(1L, 1L, 10L, EncounterStatus.COMPLETED);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(encounter));
        when(encounterRepository.save(any())).thenReturn(encounter);

        encounterService.signEncounter(1L, 10L);

        assertThat(encounter.getStatus()).isEqualTo(EncounterStatus.SIGNED);
        assertThat(encounter.getSignedBy()).isEqualTo(10L);
        assertThat(encounter.getSignedAt()).isNotNull();
    }

    @Test
    @DisplayName("signEncounter: throws InvalidEncounterStateException when not COMPLETED")
    void signEncounter_whenNotCompleted_throwsInvalidState() {
        Encounter encounter = buildEncounter(1L, 1L, 10L, EncounterStatus.IN_PROGRESS);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(encounter));

        assertThatThrownBy(() -> encounterService.signEncounter(1L, 10L))
                .isInstanceOf(InvalidEncounterStateException.class)
                .hasMessageContaining("completed");
    }

    @Test
    @DisplayName("signEncounter: throws EncounterNotFoundException when not found")
    void signEncounter_whenNotFound_throws() {
        when(encounterRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> encounterService.signEncounter(99L, 10L))
                .isInstanceOf(EncounterNotFoundException.class);
    }

    // ─── cancelEncounter ──────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelEncounter: sets status CANCELLED when not SIGNED")
    void cancelEncounter_whenNotSigned_setsCancelled() {
        Encounter encounter = buildEncounter(1L, 1L, 10L, EncounterStatus.IN_PROGRESS);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(encounter));
        when(encounterRepository.save(any())).thenReturn(encounter);

        encounterService.cancelEncounter(1L);

        assertThat(encounter.getStatus()).isEqualTo(EncounterStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancelEncounter: throws InvalidEncounterStateException when SIGNED")
    void cancelEncounter_whenSigned_throwsInvalidState() {
        Encounter encounter = buildEncounter(1L, 1L, 10L, EncounterStatus.SIGNED);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(encounter));

        assertThatThrownBy(() -> encounterService.cancelEncounter(1L))
                .isInstanceOf(InvalidEncounterStateException.class)
                .hasMessageContaining("signed");
    }

    @Test
    @DisplayName("cancelEncounter: can cancel COMPLETED encounter (not yet signed)")
    void cancelEncounter_whenCompleted_setsCancelled() {
        Encounter encounter = buildEncounter(1L, 1L, 10L, EncounterStatus.COMPLETED);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(encounter));
        when(encounterRepository.save(any())).thenReturn(encounter);

        encounterService.cancelEncounter(1L);

        assertThat(encounter.getStatus()).isEqualTo(EncounterStatus.CANCELLED);
    }

    // ─── getEncounterById ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getEncounterById: returns DTO when encounter found")
    void getEncounterById_whenFound_returnsDTO() {
        Encounter encounter = buildEncounter(1L, 1L, 10L, EncounterStatus.IN_PROGRESS);
        when(encounterRepository.findById(1L)).thenReturn(Optional.of(encounter));

        EncounterDTO result = encounterService.getEncounterById(1L);

        assertThat(result.getEncounterId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getEncounterById: throws EncounterNotFoundException when not found")
    void getEncounterById_whenNotFound_throwsEncounterNotFound() {
        when(encounterRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> encounterService.getEncounterById(99L))
                .isInstanceOf(EncounterNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── getEncountersByPatient ────────────────────────────────────────────────

    @Test
    @DisplayName("getEncountersByPatient: returns all encounters for patient")
    void getEncountersByPatient_returnsList() {
        List<Encounter> encounters = List.of(
                buildEncounter(1L, 5L, 10L, EncounterStatus.SIGNED),
                buildEncounter(2L, 5L, 10L, EncounterStatus.IN_PROGRESS));
        when(encounterRepository.findByPatientId(5L)).thenReturn(encounters);

        List<EncounterDTO> result = encounterService.getEncountersByPatient(5L);

        assertThat(result).hasSize(2);
    }

    // ─── hasActiveEncounters ──────────────────────────────────────────────────

    @Test
    @DisplayName("hasActiveEncounters: returns true when patient has active encounters")
    void hasActiveEncounters_whenActive_returnsTrue() {
        when(encounterRepository.hasActiveEncounters(5L)).thenReturn(true);

        assertThat(encounterService.hasActiveEncounters(5L)).isTrue();
    }

    @Test
    @DisplayName("hasActiveEncounters: returns false when no active encounters")
    void hasActiveEncounters_whenNone_returnsFalse() {
        when(encounterRepository.hasActiveEncounters(5L)).thenReturn(false);

        assertThat(encounterService.hasActiveEncounters(5L)).isFalse();
    }

    // ─── getEncountersByDoctorAndStatus ───────────────────────────────────────

    @Test
    @DisplayName("getEncountersByDoctorAndStatus: returns matching encounters")
    void getEncountersByDoctorAndStatus_returnsFiltered() {
        List<Encounter> encounters = List.of(
                buildEncounter(1L, 1L, 10L, EncounterStatus.IN_PROGRESS));
        when(encounterRepository.findByDoctorIdAndStatus(10L, EncounterStatus.IN_PROGRESS))
                .thenReturn(encounters);

        List<EncounterDTO> result = encounterService.getEncountersByDoctorAndStatus(
                10L, EncounterStatus.IN_PROGRESS);

        assertThat(result).hasSize(1);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Encounter buildEncounter(Long id, Long patientId, Long doctorId,
                                     EncounterStatus status) {
        return Encounter.builder()
                .encounterId(id)
                .patientId(patientId)
                .doctorId(doctorId)
                .visitType("OUTPATIENT")
                .chiefComplaint("Test complaint")
                .status(status)
                .startAt(LocalDateTime.now())
                .build();
    }

    private EncounterCreateRequest buildCreateRequest(Long patientId, Long doctorId,
                                                       String visitType) {
        EncounterCreateRequest req = new EncounterCreateRequest();
        req.setPatientId(patientId);
        req.setDoctorId(doctorId);
        req.setVisitType(visitType);
        req.setStartAt(LocalDateTime.now());
        return req;
    }
}
