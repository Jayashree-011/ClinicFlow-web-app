package com.clinicflow.consultation.dto;

import com.clinicflow.consultation.entity.Appointment;
import com.clinicflow.consultation.entity.Doctor;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class AppointmentDTO {

    private Long id;             // appointmentId — required by frontend for updates/deletes
    private Long patientId;      // for booking reference
    private String patientName;  // for display
    private Long doctorId;       // for booking
    private String doctorName;   // for display
    private String department;
    private String serviceType;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startAt;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endAt;
    private String status;

    /** Build DTO from entity (patient + doctor must already be EAGER-loaded). */
    public AppointmentDTO(Appointment a) {
        this.id          = a.getAppointmentId();
        this.patientId   = a.getPatient() != null ? a.getPatient().getPatientId() : null;
        this.patientName = a.getPatient() != null ? a.getPatient().getName()       : null;
        this.doctorId    = a.getDoctor()  != null ? a.getDoctor().getDoctorId()    : null;
        this.doctorName  = a.getDoctor()  != null ? a.getDoctor().getName()        : null;
        this.department  = a.getDepartment();
        this.serviceType = a.getServiceType();
        this.startAt     = a.getStartAt();
        this.endAt       = a.getEndAt();
        this.status      = a.getStatus();
    }

    /** Convert to a new Appointment entity — caller provides the resolved Doctor. */
    public Appointment toAppointment(Doctor doctor) {
        Appointment a = new Appointment();
        a.setDepartment(department);
        a.setServiceType(serviceType);
        a.setStartAt(startAt);
        a.setEndAt(endAt);
        a.setStatus(status != null ? status : "PENDING");
        a.setDoctor(doctor);
        return a;
    }
}
