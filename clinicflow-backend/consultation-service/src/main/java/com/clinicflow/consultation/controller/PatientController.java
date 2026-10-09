package com.clinicflow.consultation.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.clinicflow.consultation.dto.AppointmentDTO;
import com.clinicflow.consultation.dto.PatientDTO;
import com.clinicflow.consultation.entity.Appointment;
import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.entity.Patient;
import com.clinicflow.consultation.exception.ObjectNotFoundException;
import com.clinicflow.consultation.service.DoctorService;
import com.clinicflow.consultation.service.PatientAppointmentService;

@RestController
@RequestMapping("/api/consultation/patient")
public class PatientController {

    private final PatientAppointmentService service;
    private final DoctorService doctorService;

    public PatientController(PatientAppointmentService service, DoctorService doctorService) {
        this.service = service;
        this.doctorService = doctorService;
    }

    @PostMapping("/register")
    public PatientDTO registerPatient(@RequestBody PatientDTO dto) {
        return new PatientDTO(service.registerPatient(dto.toPatient()));
    }

    @PostMapping("/{patientId}/appointments")
    public AppointmentDTO bookAppointment(@PathVariable Long patientId,
                                          @RequestBody AppointmentDTO appointmentDto) {
        Patient patient = service.getPatientById(patientId);
        Doctor doctor   = doctorService.getDoctorById(appointmentDto.getDoctorId());
        Appointment appointmentEntity = appointmentDto.toAppointment(doctor);
        return new AppointmentDTO(service.bookAppointment(patient, appointmentEntity));
    }

    @GetMapping("/{patientId}")
    public PatientDTO getPatient(@PathVariable Long patientId) {
        return new PatientDTO(service.getPatientById(patientId));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<List<PatientDTO>> getPatientByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getPatientByUserId(userId).stream().map(PatientDTO::new).toList());
    }

    /**
     * Finds or creates a Patient for the given userId.
     * Handles three cases: already linked, unlinked seeded patient (linked by name),
     * or brand-new self-registered patient (created from supplied details).
     */
    @PostMapping("/resolve")
    public PatientDTO resolvePatient(@RequestBody PatientDTO dto) {
        if (dto.getUserId() == null) throw new IllegalArgumentException("userId is required");
        return new PatientDTO(service.resolvePatient(dto.getUserId(), dto.getName(), dto.getEmail()));
    }

    @GetMapping("/patients")
    public List<PatientDTO> getAllPatients() {
        return service.getAllPatients().stream().map(PatientDTO::new).toList();
    }

    @GetMapping("/{patientId}/appointments")
    public List<AppointmentDTO> getAppointments(@PathVariable Long patientId) {
        Patient patient = service.getPatientById(patientId);
        List<Appointment> list = service.getAppointmentsForPatient(patient);
        if (list.isEmpty()) {
            throw new ObjectNotFoundException("No appointments found for patient: " + patientId);
        }
        return list.stream().map(AppointmentDTO::new).toList();
    }

    @PutMapping("/{patientId}")
    public PatientDTO updatePatient(@PathVariable Long patientId,
                                    @RequestBody PatientDTO patientDto) {
        return new PatientDTO(service.updatePatient(patientId, patientDto.toPatient()));
    }

    @DeleteMapping("/{patientId}")
    public String deletePatient(@PathVariable Long patientId) {
        service.deletePatient(patientId);
        return "Patient deleted successfully with id: " + patientId;
    }

    @GetMapping("/family/{guardianUserId}")
    public List<PatientDTO> getFamilyMembers(@PathVariable Long guardianUserId) {
        return service.getFamilyMembers(guardianUserId)
                .stream().map(PatientDTO::new).toList();
    }
}