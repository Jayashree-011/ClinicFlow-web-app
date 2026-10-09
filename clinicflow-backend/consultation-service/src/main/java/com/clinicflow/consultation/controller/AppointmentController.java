package com.clinicflow.consultation.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.clinicflow.consultation.dto.AppointmentDTO;
import com.clinicflow.consultation.entity.Appointment;
import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.entity.Patient;
import com.clinicflow.consultation.exception.ObjectNotFoundException;
import com.clinicflow.consultation.service.DoctorService;
import com.clinicflow.consultation.service.PatientAppointmentService;

@RestController
@RequestMapping("/api/consultation/appointment")
public class AppointmentController {

    private final PatientAppointmentService pa_Service;
    private final DoctorService doctorService;

    public AppointmentController(PatientAppointmentService pa_Service, DoctorService doctorService) {
        this.pa_Service = pa_Service;
        this.doctorService = doctorService;
    }

    // ---------- GET ----------

    @GetMapping("/appointments")
    public List<AppointmentDTO> getAllAppointments() {
        return pa_Service.getAllAppointments().stream().map(AppointmentDTO::new).toList();
    }

    @GetMapping("/appointments/{appointmentId}")
    public AppointmentDTO getAppointmentById(@PathVariable Long appointmentId) {
        return new AppointmentDTO(pa_Service.getAppointmentById(appointmentId));
    }

    @GetMapping("/patient/{patientId}")
    public List<AppointmentDTO> getAppointmentsByPatient(@PathVariable Long patientId) {
        Patient patient = pa_Service.getPatientById(patientId);
        return pa_Service.getAppointmentsForPatient(patient).stream().map(AppointmentDTO::new).toList();
    }

    @GetMapping("/appointments/doctor/{doctorId}")
    public List<AppointmentDTO> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        Doctor doctor = doctorService.getDoctorById(doctorId);
        return pa_Service.getAppointmentsByDoctor(doctor).stream().map(AppointmentDTO::new).toList();
    }

    // ---------- PATCH ----------

    /** Update only the status field — used by the frontend status buttons. */
    @PatchMapping("/appointments/{appointmentId}/status")
    public AppointmentDTO patchStatus(@PathVariable Long appointmentId,
                                      @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("status field is required");
        }
        return new AppointmentDTO(pa_Service.patchAppointmentStatus(appointmentId, status));
    }

    // ---------- PUT ----------

    @PutMapping("/appointments/{appointmentId}")
    public AppointmentDTO updateAppointment(@PathVariable Long appointmentId,
                                            @RequestBody AppointmentDTO appointment) {
        Doctor doctor = doctorService.getDoctorById(appointment.getDoctorId());
        Appointment entity = appointment.toAppointment(doctor);
        return new AppointmentDTO(pa_Service.updateAppointment(appointmentId, entity));
    }

    // ---------- DELETE ----------

    @DeleteMapping("/appointments/{appointmentId}")
    public String deleteAppointment(@PathVariable Long appointmentId) {
        pa_Service.deleteAppointment(appointmentId);
        return "Appointment deleted successfully with id: " + appointmentId;
    }
}
