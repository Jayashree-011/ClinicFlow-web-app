package com.clinicflow.consultation.dto;

import com.clinicflow.consultation.entity.Doctor;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DoctorDTO {

    private Long   id;            // doctorId
    private String name;
    private String specialty;
    private String qualification; // e.g. "MD", "MBBS", "MD, PhD"
    private String email;
    private String phone;
    private String status;        // "Active" | "On Call" | "Off Duty"

    /** Convert DTO → new Doctor entity (caller sets userId separately). */
    public Doctor toEntity() {
        Doctor doctor = new Doctor();
        doctor.setName(this.name);
        doctor.setSpecialty(this.specialty);
        doctor.setQualification(this.qualification);
        doctor.setEmail(this.email);
        doctor.setPhone(this.phone);
        doctor.setStatus(this.status != null ? this.status : "Active");
        return doctor;
    }
}
