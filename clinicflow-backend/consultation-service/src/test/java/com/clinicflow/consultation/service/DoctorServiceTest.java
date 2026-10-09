package com.clinicflow.consultation.service;

import com.clinicflow.consultation.client.UserServiceClient;
import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.exception.ObjectNotFoundException;
import com.clinicflow.consultation.repository.DoctorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DoctorService Unit Tests")
class DoctorServiceTest {

    @Mock private DoctorRepository doctorRepository;
    @Mock private UserServiceClient userServiceClient;
    @InjectMocks private DoctorService doctorService;

    // ─── getDoctorById ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getDoctorById: returns doctor when found")
    void getDoctorById_whenFound_returnsDoctor() {
        Doctor doctor = buildDoctor(1L, "Dr. Smith", "Cardiology");
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

        Doctor result = doctorService.getDoctorById(1L);

        assertThat(result).isEqualTo(doctor);
    }

    @Test
    @DisplayName("getDoctorById: throws ObjectNotFoundException when not found")
    void getDoctorById_whenNotFound_throwsObjectNotFoundException() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> doctorService.getDoctorById(99L))
                .isInstanceOf(ObjectNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── registerDoctor ───────────────────────────────────────────────────────

    @Test
    @DisplayName("registerDoctor: returns existing doctor if same name+specialty already exists")
    void registerDoctor_whenAlreadyExists_returnsExistingDoctor() {
        Doctor existing = buildDoctor(1L, "Dr. Smith", "Cardiology");
        when(doctorRepository.findByNameContainingIgnoreCase("Dr. Smith"))
                .thenReturn(List.of(existing));

        Doctor result = doctorService.registerDoctor(
                buildDoctor(null, "Dr. Smith", "Cardiology"), 10L);

        assertThat(result).isEqualTo(existing);
        verify(doctorRepository, never()).save(any());
        verify(userServiceClient, never()).createDoctorUser(any());
    }

    @Test
    @DisplayName("registerDoctor: saves new doctor and provisions user account")
    void registerDoctor_whenNew_savesAndProvisions() {
        Doctor newDoctor = buildDoctor(null, "Dr. Jones", "Neurology");
        Doctor saved    = buildDoctor(2L, "Dr. Jones", "Neurology");

        when(doctorRepository.findByNameContainingIgnoreCase("Dr. Jones"))
                .thenReturn(List.of());
        when(doctorRepository.save(newDoctor)).thenReturn(saved);

        Doctor result = doctorService.registerDoctor(newDoctor, 10L);

        assertThat(result).isEqualTo(saved);
        verify(doctorRepository).save(newDoctor);
        verify(userServiceClient).createDoctorUser(saved);
    }

    @Test
    @DisplayName("registerDoctor (no provision): saves new doctor without provisioning")
    void registerDoctor_withoutProvision_savesOnly() {
        Doctor newDoctor = buildDoctor(null, "Dr. Lee", "Pediatrics");
        Doctor saved     = buildDoctor(3L, "Dr. Lee", "Pediatrics");

        when(doctorRepository.findByNameContainingIgnoreCase("Dr. Lee"))
                .thenReturn(List.of());
        when(doctorRepository.save(newDoctor)).thenReturn(saved);

        Doctor result = doctorService.registerDoctor(newDoctor, 10L, false);

        assertThat(result).isEqualTo(saved);
        verify(userServiceClient, never()).createDoctorUser(any());
    }

    @Test
    @DisplayName("registerDoctor: matches on specialty case-insensitively")
    void registerDoctor_whenSameNameDifferentSpecialty_savesNew() {
        // Same name but DIFFERENT specialty → treated as a new doctor
        Doctor existingCardio = buildDoctor(1L, "Dr. Smith", "Cardiology");
        Doctor newOrtho       = buildDoctor(null, "Dr. Smith", "Orthopedics");
        Doctor savedOrtho     = buildDoctor(4L, "Dr. Smith", "Orthopedics");

        when(doctorRepository.findByNameContainingIgnoreCase("Dr. Smith"))
                .thenReturn(List.of(existingCardio));
        when(doctorRepository.save(newOrtho)).thenReturn(savedOrtho);

        Doctor result = doctorService.registerDoctor(newOrtho, 10L, false);

        assertThat(result).isEqualTo(savedOrtho);
    }

    // ─── updateDoctor ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateDoctor: updates name and specialty")
    void updateDoctor_whenFound_updatesFields() {
        Doctor existing = buildDoctor(1L, "Dr. Smith", "Cardiology");
        Doctor updates  = buildDoctor(null, "Dr. Smith Jr.", "Interventional Cardiology");

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(doctorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Doctor result = doctorService.updateDoctor(1L, updates);

        assertThat(result.getName()).isEqualTo("Dr. Smith Jr.");
        assertThat(result.getSpecialty()).isEqualTo("Interventional Cardiology");
    }

    @Test
    @DisplayName("updateDoctor: throws when doctor not found")
    void updateDoctor_whenNotFound_throwsObjectNotFoundException() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> doctorService.updateDoctor(99L, buildDoctor(null, "X", "Y")))
                .isInstanceOf(ObjectNotFoundException.class);
    }

    // ─── deleteDoctor ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteDoctor: deletes doctor when found")
    void deleteDoctor_whenFound_deletesDoctor() {
        Doctor doctor = buildDoctor(1L, "Dr. Smith", "Cardiology");
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        doNothing().when(doctorRepository).delete(doctor);

        doctorService.deleteDoctor(1L);

        verify(doctorRepository).delete(doctor);
    }

    @Test
    @DisplayName("deleteDoctor: throws when doctor not found")
    void deleteDoctor_whenNotFound_throws() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> doctorService.deleteDoctor(99L))
                .isInstanceOf(ObjectNotFoundException.class);
    }

    // ─── getAllDoctors ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllDoctors: returns full list from repository")
    void getAllDoctors_returnsAll() {
        List<Doctor> doctors = List.of(
                buildDoctor(1L, "Dr. Smith", "Cardiology"),
                buildDoctor(2L, "Dr. Jones", "Neurology"));
        when(doctorRepository.findAll()).thenReturn(doctors);

        List<Doctor> result = doctorService.getAllDoctors();

        assertThat(result).hasSize(2);
    }

    // ─── getDoctorsBySpecialty ─────────────────────────────────────────────────

    @Test
    @DisplayName("getDoctorsBySpecialty: filters by specialty")
    void getDoctorsBySpecialty_returnsMatchingDoctors() {
        List<Doctor> cardiologists = List.of(buildDoctor(1L, "Dr. Smith", "Cardiology"));
        when(doctorRepository.findBySpecialty("Cardiology")).thenReturn(cardiologists);

        List<Doctor> result = doctorService.getDoctorsBySpecialty("Cardiology");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSpecialty()).isEqualTo("Cardiology");
    }

    // ─── getDoctorsByName ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getDoctorsByName: searches case-insensitively")
    void getDoctorsByName_returnsMatchingDoctors() {
        List<Doctor> result = List.of(buildDoctor(1L, "Dr. Smith", "Cardiology"));
        when(doctorRepository.findByNameContainingIgnoreCase("smith")).thenReturn(result);

        List<Doctor> found = doctorService.getDoctorsByName("smith");

        assertThat(found).hasSize(1);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Doctor buildDoctor(Long id, String name, String specialty) {
        Doctor d = new Doctor();
        d.setDoctorId(id);
        d.setName(name);
        d.setSpecialty(specialty);
        return d;
    }
}
