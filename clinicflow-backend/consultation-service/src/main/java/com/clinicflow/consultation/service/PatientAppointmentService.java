package com.clinicflow.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

import com.clinicflow.consultation.client.BillingServiceClient;
import com.clinicflow.consultation.client.NotificationServiceClient;
import com.clinicflow.consultation.entity.Appointment;
import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.entity.Patient;
import com.clinicflow.consultation.exception.ObjectNotFoundException;
import com.clinicflow.consultation.repository.AppointmentRepository;
import com.clinicflow.consultation.repository.DoctorRepository;
import com.clinicflow.consultation.repository.PatientRepository;

@Service
public class PatientAppointmentService {

    private final PatientRepository       patientRepository;
    private final AppointmentRepository   appointmentRepository;
    private final DoctorRepository        doctorRepository;
    private final BillingServiceClient    billingServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    public PatientAppointmentService(PatientRepository patientRepository,
                                     AppointmentRepository appointmentRepository,
                                     DoctorRepository doctorRepository,
                                     BillingServiceClient billingServiceClient,
                                     NotificationServiceClient notificationServiceClient) {
        this.patientRepository          = patientRepository;
        this.appointmentRepository      = appointmentRepository;
        this.doctorRepository           = doctorRepository;
        this.billingServiceClient       = billingServiceClient;
        this.notificationServiceClient  = notificationServiceClient;
    }

    public Patient registerPatient(Patient patient) {
        if (patient.getMrn() == null || patient.getMrn().isBlank()) {
            patient.setMrn(UUID.randomUUID().toString());
        }
        if (patient.getStatus() == null) patient.setStatus("ACTIVE");
        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedAt(LocalDateTime.now());
        return patientRepository.save(patient);
    }

    /**
     * Finds or creates a Patient linked to the given userId.
     * 1. Found by userId → return as-is (fast path).
     * 2. Not found → search for an unlinked patient with matching name,
     *    stamp userId on it, and return (handles seeded defaults whose userId was null).
     * 3. No name match → create a new Patient record from the supplied details.
     */
    public Patient resolvePatient(Long userId, String name, String email) {
        // 1. Already linked
        List<Patient> byUserIdList = patientRepository.findByUserId(userId);
        if (!byUserIdList.isEmpty()) return byUserIdList.get(0);

        // 2. Unlinked patient with same name — link it
        if (name != null && !name.isBlank()) {
            List<Patient> unlinked = patientRepository.findByNameIgnoreCaseAndUserIdIsNull(name);
            if (!unlinked.isEmpty()) {
                Patient p = unlinked.get(0);
                p.setUserId(userId);
                p.setUpdatedAt(LocalDateTime.now());
                return patientRepository.save(p);
            }
        }

        // 3. Create a new record (self-registered patient whose creation failed earlier)
        Patient p = new Patient();
        p.setUserId(userId);
        p.setName(name != null ? name : "Patient");
        p.setStatus("ACTIVE");
        p.setMrn("MRN-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p.setCreatedAt(LocalDateTime.now());
        p.setUpdatedAt(LocalDateTime.now());
        if (email != null && !email.isBlank()) {
            try {
                com.fasterxml.jackson.databind.node.ObjectNode contact =
                        new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
                contact.put("email", email);
                contact.put("phone", "");
                p.setContactInfoJson(contact.toString());
            } catch (Exception ignored) {}
        }
        return patientRepository.save(p);
    }

    public Appointment bookAppointment(Patient patient, Appointment appointment) {
        appointment.setPatient(patient);
        appointment.setStatus("SCHEDULED");
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        // Fire-and-forget: create a PENDING invoice in billing-service.
        // Failures are swallowed inside billingServiceClient — never blocks booking.
        billingServiceClient.createAppointmentInvoice(
                patient.getPatientId(),
                saved.getAppointmentId(),
                saved.getServiceType());

        // Fire-and-forget: notify the patient their appointment has been booked.
        notificationServiceClient.notifyAppointmentBooked(
                patient.getPatientId(),
                saved.getAppointmentId(),
                saved.getServiceType());

        return saved;
    }

    public List<Appointment> getAppointmentsForPatient(Patient patient) {
        return appointmentRepository.findByPatient(patient);
    }

    // ---------- GET: Appointment by ID ----------
    public Appointment getAppointmentById(Long appointmentId) throws ObjectNotFoundException {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ObjectNotFoundException("Appointment not found: " + appointmentId));
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Patient getPatientById(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ObjectNotFoundException("Patient not found: " + patientId));
    }

    public Optional<Patient> getPatientByMrn(String mrn) {
        return patientRepository.findByMrn(mrn);
    }

    public List<Patient> getPatientByUserId(Long userId) {
        return patientRepository.findByUserId(userId);
    }

    // ---------- GET: All Patients ----------
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    // ---------- PUT: Update Patient ----------
    public Patient updatePatient(Long patientId, Patient updatedPatient) throws ObjectNotFoundException {
        Patient existing = patientRepository.findById(patientId)
                .orElseThrow(() -> new ObjectNotFoundException("Patient not found: " + patientId));

        existing.setName(updatedPatient.getName());
        existing.setDob(updatedPatient.getDob());
        existing.setGender(updatedPatient.getGender());
        existing.setContactInfoJson(updatedPatient.getContactInfoJson());
        existing.setAddressJson(updatedPatient.getAddressJson());
        existing.setPrimaryContact(updatedPatient.getPrimaryContact());
        existing.setStatus(updatedPatient.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        return patientRepository.save(existing);
    }

    public void deletePatient(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ObjectNotFoundException("Patient not found: " + patientId));
        patientRepository.delete(patient);
    }

    // ---------- PUT: Update Appointment ----------
    public Appointment updateAppointment(Long appointmentId, Appointment updated) throws ObjectNotFoundException {
        Appointment existing = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ObjectNotFoundException("Appointment not found: " + appointmentId));

        existing.setDepartment(updated.getDepartment());
        existing.setServiceType(updated.getServiceType());
        existing.setStartAt(updated.getStartAt());
        existing.setEndAt(updated.getEndAt());
        existing.setStatus(updated.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(existing);
    }

    // ---------- PATCH: Appointment Status ----------
    public Appointment patchAppointmentStatus(Long appointmentId, String status) throws ObjectNotFoundException {
        Appointment existing = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ObjectNotFoundException("Appointment not found: " + appointmentId));
        existing.setStatus(status);
        existing.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(existing);

        // Fire-and-forget: notify the patient of the status change.
        Long patientId = (saved.getPatient() != null) ? saved.getPatient().getPatientId() : null;
        if (patientId != null) {
            notificationServiceClient.notifyAppointmentStatusChanged(patientId, appointmentId, status);
        }

        return saved;
    }

    // ---------- DELETE: Appointment ----------
    public void deleteAppointment(Long appointmentId) throws ObjectNotFoundException {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ObjectNotFoundException("Appointment not found: " + appointmentId));
        appointmentRepository.delete(appointment);
    }

    public List<Appointment> getAppointmentsByDoctor(Doctor doctor) {
        return appointmentRepository.findByDoctor(doctor);
    }

    // ---------- GET: Family Members by guardian userId ----------
    public List<Patient> getFamilyMembers(Long guardianUserId) {
        return patientRepository.findByRegisteredByUserId(guardianUserId);
    }
}
