package com.clinicflow.consultation.entity;

import java.util.List;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.clinicflow.consultation.dto.DoctorDTO;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long doctorId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "specialty")
    private String specialty;

    @Column(name = "qualification")
    private String qualification;   // e.g. "MD", "MBBS", "MD, PhD"

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "status")
    private String status;          // "Active" | "On Call" | "Off Duty"

    @Column(name = "user_id")
    private Long userId;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Appointment> appointments;

    public DoctorDTO toDTO() {
        DoctorDTO dto = new DoctorDTO();
        dto.setId(doctorId);
        dto.setName(name);
        dto.setSpecialty(specialty);
        dto.setQualification(qualification);
        dto.setEmail(email);
        dto.setPhone(phone);
        dto.setStatus(status);
        return dto;
    }
}
