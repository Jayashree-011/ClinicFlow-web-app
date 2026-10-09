package com.clinicflow.consultation.service;

import com.clinicflow.consultation.client.BillingServiceClient;
import com.clinicflow.consultation.client.NotificationServiceClient;
import com.clinicflow.consultation.entity.Appointment;
import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.entity.Patient;
import com.clinicflow.consultation.exception.ObjectNotFoundException;
import com.clinicflow.consultation.repository.AppointmentRepository;
import com.clinicflow.consultation.repository.DoctorRepository;
import com.clinicflow.consultation.repository.PatientRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientAppointmentService Unit Tests")
class PatientAppointmentServiceTest {

    @Mock private PatientRepository        patientRepository;
    @Mock private AppointmentRepository    appointmentRepository;
    @Mock private DoctorRepository         doctorRepository;
    @Mock private BillingServiceClient     billingServiceClient;
    @Mock private NotificationServiceClient notificationServiceClient;
    @InjectMocks private PatientAppointmentService service;

    // ─── registerPatient ──────────────────────────────────────────────────────

    @Test
    @DisplayName("registerPatient: auto-generates MRN when blank")
    void registerPatient_whenMrnBlank_generatesMrn() {
        Patient patient = new Patient();
        patient.setMrn("");
        patient.setStatus("ACTIVE");
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Patient result = service.registerPatient(patient);

        assertThat(result.getMrn()).isNotBlank();
    }

    @Test
    @DisplayName("registerPatient: preserves existing MRN if already set")
    void registerPatient_whenMrnProvided_preservesMrn() {
        Patient patient = new Patient();
        patient.setMrn("MRN-001");
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Patient result = service.registerPatient(patient);

        assertThat(result.getMrn()).isEqualTo("MRN-001");
    }

    @Test
    @DisplayName("registerPatient: defaults status to ACTIVE when null")
    void registerPatient_whenStatusNull_defaultsToActive() {
        Patient patient = new Patient();
        patient.setMrn("MRN-001");
        patient.setStatus(null);
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Patient result = service.registerPatient(patient);

        assertThat(result.getStatus()).isEqualTo("ACTIVE");
    }

    // ─── resolvePatient ───────────────────────────────────────────────────────

    @Test
    @DisplayName("resolvePatient: returns existing patient when already linked by userId")
    void resolvePatient_whenFoundByUserId_returnsExisting() {
        Patient existing = buildPatient(1L, "John Doe");
        existing.setUserId(100L);
        when(patientRepository.findByUserId(100L)).thenReturn(List.of(existing));

        Patient result = service.resolvePatient(100L, "John Doe", "john@mail.com");

        assertThat(result).isEqualTo(existing);
        verify(patientRepository, never()).save(any());
    }

    @Test
    @DisplayName("resolvePatient: links unlinked patient by name when userId not found")
    void resolvePatient_whenUnlinkedByName_linksAndSaves() {
        Patient unlinked = buildPatient(2L, "John Doe");
        unlinked.setUserId(null);

        when(patientRepository.findByUserId(100L)).thenReturn(List.of());
        when(patientRepository.findByNameIgnoreCaseAndUserIdIsNull("John Doe"))
                .thenReturn(List.of(unlinked));
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Patient result = service.resolvePatient(100L, "John Doe", "john@mail.com");

        assertThat(result.getUserId()).isEqualTo(100L);
        verify(patientRepository).save(unlinked);
    }

    @Test
    @DisplayName("resolvePatient: creates new patient when no name match found")
    void resolvePatient_whenNoMatch_createsNewPatient() {
        when(patientRepository.findByUserId(100L)).thenReturn(List.of());
        when(patientRepository.findByNameIgnoreCaseAndUserIdIsNull("New Patient"))
                .thenReturn(List.of());
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Patient result = service.resolvePatient(100L, "New Patient", "new@mail.com");

        assertThat(result.getUserId()).isEqualTo(100L);
        assertThat(result.getName()).isEqualTo("New Patient");
        verify(patientRepository).save(any());
    }

    // ─── bookAppointment ──────────────────────────────────────────────────────

    @Test
    @DisplayName("bookAppointment: sets status to SCHEDULED")
    void bookAppointment_setsScheduledStatus() {
        Patient patient = buildPatient(1L, "John Doe");
        Appointment appt = buildAppointment(null, "Consultation");

        when(appointmentRepository.save(any())).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setAppointmentId(10L);
            return a;
        });

        Appointment result = service.bookAppointment(patient, appt);

        assertThat(result.getStatus()).isEqualTo("SCHEDULED");
    }

    @Test
    @DisplayName("bookAppointment: calls billing and notification services (fire-and-forget)")
    void bookAppointment_callsBillingAndNotification() {
        Patient patient = buildPatient(1L, "John Doe");
        Appointment appt = buildAppointment(null, "Consultation");

        when(appointmentRepository.save(any())).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setAppointmentId(10L);
            return a;
        });

        service.bookAppointment(patient, appt);

        verify(billingServiceClient).createAppointmentInvoice(eq(1L), eq(10L), eq("Consultation"));
        verify(notificationServiceClient).notifyAppointmentBooked(eq(1L), eq(10L), eq("Consultation"));
    }

    @Test
    @DisplayName("bookAppointment: stamps createdAt and updatedAt")
    void bookAppointment_stampsTimestamps() {
        Patient patient = buildPatient(1L, "John Doe");
        Appointment appt = buildAppointment(null, "Consultation");

        when(appointmentRepository.save(any())).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setAppointmentId(10L);
            return a;
        });

        Appointment result = service.bookAppointment(patient, appt);

        assertThat(result.getCreatedAt()).isNotNull();
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    // ─── getAppointmentById ───────────────────────────────────────────────────

    @Test
    @DisplayName("getAppointmentById: returns appointment when found")
    void getAppointmentById_whenFound_returnsAppointment() {
        Appointment appt = buildAppointment(1L, "Consultation");
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appt));

        Appointment result = service.getAppointmentById(1L);

        assertThat(result).isEqualTo(appt);
    }

    @Test
    @DisplayName("getAppointmentById: throws ObjectNotFoundException when not found")
    void getAppointmentById_whenNotFound_throwsObjectNotFoundException() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAppointmentById(99L))
                .isInstanceOf(ObjectNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── getPatientById ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getPatientById: returns patient when found")
    void getPatientById_whenFound_returnsPatient() {
        Patient patient = buildPatient(1L, "John Doe");
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));

        Patient result = service.getPatientById(1L);

        assertThat(result).isEqualTo(patient);
    }

    @Test
    @DisplayName("getPatientById: throws ObjectNotFoundException when not found")
    void getPatientById_whenNotFound_throwsObjectNotFoundException() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getPatientById(99L))
                .isInstanceOf(ObjectNotFoundException.class);
    }

    // ─── updatePatient ────────────────────────────────────────────────────────

    @Test
    @DisplayName("updatePatient: updates all fields when patient found")
    void updatePatient_whenFound_updatesFields() {
        Patient existing = buildPatient(1L, "John Doe");
        when(patientRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Patient updates = buildPatient(null, "John Updated");
        updates.setGender("Male");
        updates.setStatus("ACTIVE");

        Patient result = service.updatePatient(1L, updates);

        assertThat(result.getName()).isEqualTo("John Updated");
        assertThat(result.getGender()).isEqualTo("Male");
    }

    @Test
    @DisplayName("updatePatient: throws ObjectNotFoundException when not found")
    void updatePatient_whenNotFound_throws() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updatePatient(99L, new Patient()))
                .isInstanceOf(ObjectNotFoundException.class);
    }

    // ─── deletePatient ────────────────────────────────────────────────────────

    @Test
    @DisplayName("deletePatient: deletes when patient found")
    void deletePatient_whenFound_deletes() {
        Patient patient = buildPatient(1L, "John Doe");
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));

        service.deletePatient(1L);

        verify(patientRepository).delete(patient);
    }

    @Test
    @DisplayName("deletePatient: throws when patient not found")
    void deletePatient_whenNotFound_throws() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deletePatient(99L))
                .isInstanceOf(ObjectNotFoundException.class);
    }

    // ─── updateAppointment ────────────────────────────────────────────────────

    @Test
    @DisplayName("updateAppointment: updates fields when appointment found")
    void updateAppointment_whenFound_updatesFields() {
        Appointment existing = buildAppointment(1L, "Consultation");
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Appointment updates = buildAppointment(null, "Follow-up");
        updates.setDepartment("Cardiology");
        updates.setStatus("CONFIRMED");

        Appointment result = service.updateAppointment(1L, updates);

        assertThat(result.getServiceType()).isEqualTo("Follow-up");
        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
    }

    // ─── patchAppointmentStatus ───────────────────────────────────────────────

    @Test
    @DisplayName("patchAppointmentStatus: updates status and notifies patient")
    void patchAppointmentStatus_updatesStatusAndNotifies() {
        Patient patient = buildPatient(1L, "John Doe");
        Appointment appt = buildAppointment(1L, "Consultation");
        appt.setPatient(patient);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appt));
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Appointment result = service.patchAppointmentStatus(1L, "CONFIRMED");

        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
        verify(notificationServiceClient)
                .notifyAppointmentStatusChanged(1L, 1L, "CONFIRMED");
    }

    // ─── deleteAppointment ────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteAppointment: deletes when appointment found")
    void deleteAppointment_whenFound_deletes() {
        Appointment appt = buildAppointment(1L, "Consultation");
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appt));

        service.deleteAppointment(1L);

        verify(appointmentRepository).delete(appt);
    }

    @Test
    @DisplayName("deleteAppointment: throws when appointment not found")
    void deleteAppointment_whenNotFound_throws() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteAppointment(99L))
                .isInstanceOf(ObjectNotFoundException.class);
    }

    // ─── getFamilyMembers ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getFamilyMembers: returns patients registered by guardian userId")
    void getFamilyMembers_returnsFamilyList() {
        List<Patient> family = List.of(buildPatient(2L, "Jane Doe"), buildPatient(3L, "Junior Doe"));
        when(patientRepository.findByRegisteredByUserId(50L)).thenReturn(family);

        List<Patient> result = service.getFamilyMembers(50L);

        assertThat(result).hasSize(2);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Patient buildPatient(Long id, String name) {
        Patient p = new Patient();
        p.setPatientId(id);
        p.setName(name);
        p.setStatus("ACTIVE");
        p.setMrn("MRN-" + (id != null ? id : "NEW"));
        return p;
    }

    private Appointment buildAppointment(Long id, String serviceType) {
        Appointment a = new Appointment();
        a.setAppointmentId(id);
        a.setServiceType(serviceType);
        a.setStatus("SCHEDULED");
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        return a;
    }
}
