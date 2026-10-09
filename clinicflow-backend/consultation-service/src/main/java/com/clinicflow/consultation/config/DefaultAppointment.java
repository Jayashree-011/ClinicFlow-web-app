package com.clinicflow.consultation.config;
 
import com.clinicflow.consultation.entity.Appointment;
import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.entity.Patient;
import com.clinicflow.consultation.exception.ObjectNotFoundException;
import com.clinicflow.consultation.service.DoctorService;
import com.clinicflow.consultation.service.PatientAppointmentService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds three default appointments, one per default patient/doctor pair.
 * Runs after DefaultDoctor (@Order 1) and DefaultPatient (@Order 2) via
 * ApplicationReadyEvent so all three seeders share the same event-firing phase
 * and @Order guarantees doctors → patients → appointments.
 */
@Component
public class DefaultAppointment {
 
    private final PatientAppointmentService patientAppointmentService;
    private final DoctorService doctorService;
 
    public DefaultAppointment(PatientAppointmentService patientAppointmentService,
                               DoctorService doctorService) {
        this.patientAppointmentService = patientAppointmentService;
        this.doctorService = doctorService;
    }

    /**
     * Creates an appointment by looking up the patient via MRN and the doctor
     * via name, so the seed data is independent of auto-generated primary keys.
     */
    private void createAppointment(String patientMrn, String doctorName, String department,
                                    String serviceType, LocalDateTime startAt, LocalDateTime endAt) {
        try {
            // Look up patient by natural key (MRN)
            Patient patient = patientAppointmentService.getPatientByMrn(patientMrn)
                    .orElseThrow(() -> new ObjectNotFoundException(
                            "Default patient not found with MRN: " + patientMrn));

            // Look up doctor by name (case-insensitive partial match)
            List<Doctor> doctors = doctorService.getDoctorsByName(doctorName);
            if (doctors.isEmpty()) {
                System.out.println("⚠️ Could not create appointment — doctor not found: " + doctorName);
                return;
            }
            Doctor doctor = doctors.get(0);

            // Skip if this patient already has an appointment with this doctor
            boolean alreadyExists = patientAppointmentService
                    .getAppointmentsForPatient(patient)
                    .stream()
                    .anyMatch(a -> a.getDoctor() != null
                            && doctor.getDoctorId().equals(a.getDoctor().getDoctorId()));

            if (alreadyExists) {
                System.out.println("⏭️ Skipping — appointment already exists for patient: "
                        + patientMrn + " with doctor: " + doctorName);
                return;
            }
 
            Appointment appointment = new Appointment();
            appointment.setDoctor(doctor);
            appointment.setDepartment(department);
            appointment.setServiceType(serviceType);
            appointment.setStartAt(startAt);
            appointment.setEndAt(endAt);
 
            patientAppointmentService.bookAppointment(patient, appointment);
            System.out.println("✅ Default appointment created for patient: " + patientMrn
                    + " with doctor: " + doctorName);

        } catch (ObjectNotFoundException e) {
            System.out.println("⚠️ Could not create appointment: " + e.getMessage());
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(3)
    public void createDefaultAppointments() {
        createAppointment(
            "MRN-0001", "Dr. Alice Carter", "Cardiology", "Consultation",
            LocalDateTime.now().plusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0),
            LocalDateTime.now().plusDays(1).withHour(9).withMinute(30).withSecond(0).withNano(0));

        createAppointment(
            "MRN-0002", "Dr. Brian Nguyen", "Neurology", "Follow-up",
            LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0),
            LocalDateTime.now().plusDays(2).withHour(10).withMinute(30).withSecond(0).withNano(0));

        createAppointment(
            "MRN-0003", "Dr. Clara Mendes", "General Practice", "Check-up",
            LocalDateTime.now().plusDays(3).withHour(11).withMinute(0).withSecond(0).withNano(0),
            LocalDateTime.now().plusDays(3).withHour(11).withMinute(30).withSecond(0).withNano(0));
    }
}
