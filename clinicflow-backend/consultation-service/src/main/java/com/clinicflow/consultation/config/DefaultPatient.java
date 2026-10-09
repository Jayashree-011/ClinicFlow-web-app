package com.clinicflow.consultation.config;

import com.clinicflow.consultation.entity.Patient;
import com.clinicflow.consultation.service.PatientAppointmentService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Configuration
public class DefaultPatient {

    private final PatientAppointmentService patientService;

    public DefaultPatient(PatientAppointmentService patientService) {
        this.patientService = patientService;
    }

    private void createPatient(String mrn, String name, LocalDate dob, String gender,
                                String contactInfoJson, String addressJson,
                                String primaryContact, String condition,
                                LocalDate lastVisitDate, Long userId) {

        Optional<Patient> maybeExisting = patientService.getPatientByMrn(mrn);
        if (maybeExisting.isPresent()) {
            Patient existing = maybeExisting.get();
            if (existing.getUserId() == null && userId != null) {
                existing.setUserId(userId);
                existing.setUpdatedAt(LocalDateTime.now());
                patientService.updatePatient(existing.getPatientId(), existing);
                System.out.println("🔗 Linked userId=" + userId + " to existing patient: " + name);
            } else {
                System.out.println("⏭️ Patient already in DB: " + name);
            }
            return;
        }

        Patient patient = new Patient();
        patient.setMrn(mrn);
        patient.setName(name);
        patient.setDob(dob);
        patient.setGender(gender);
        patient.setContactInfoJson(contactInfoJson);
        patient.setAddressJson(addressJson);
        patient.setPrimaryContact(primaryContact);
        patient.setStatus("ACTIVE");
        patient.setUserId(userId);
        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedAt(LocalDateTime.now());
        patient.setCondition(condition);
        patient.setLastVisitDate(lastVisitDate);

        patientService.registerPatient(patient);
        System.out.println("✅ Default patient created: " + name);
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(2)
    public void createDefaultPatients() {
        createPatient(
            "MRN-0001", "John Doe",       LocalDate.of(1990, 5, 15), "Male",
            "{\"email\":\"john.doe@mail.com\", \"phone\":\"555-0101\"}",
            "{\"street\":\"123 Main St\", \"city\":\"Springfield\", \"zip\":\"62701\"}",
            "555-0101", "Hypertension", LocalDate.of(2023, 1, 15), 7L
        );
        createPatient(
            "MRN-0002", "Jane Smith",     LocalDate.of(1985, 8, 22), "Female",
            "{\"email\":\"jane.smith@mail.com\", \"phone\":\"555-0102\"}",
            "{\"street\":\"456 Elm St\", \"city\":\"Shelbyville\", \"zip\":\"62702\"}",
            "555-0102", "Diabetes", LocalDate.of(2023, 2, 20), 8L
        );
        createPatient(
            "MRN-0003", "Robert Johnson", LocalDate.of(1978, 3, 10), "Male",
            "{\"email\":\"robert.johnson@mail.com\", \"phone\":\"555-0103\"}",
            "{\"street\":\"789 Oak Ave\", \"city\":\"Capital City\", \"zip\":\"62703\"}",
            "555-0103", "Asthma", LocalDate.of(2023, 3, 5), 9L
        );
    }
}
