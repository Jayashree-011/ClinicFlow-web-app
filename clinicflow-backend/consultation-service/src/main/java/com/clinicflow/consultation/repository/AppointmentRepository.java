
package com.clinicflow.consultation.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.clinicflow.consultation.entity.Appointment;
import com.clinicflow.consultation.entity.Patient;
import com.clinicflow.consultation.entity.Doctor;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatient(Patient patient);
    List<Appointment> findByDoctor(Doctor doctor);
}
