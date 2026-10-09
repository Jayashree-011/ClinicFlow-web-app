package com.clinicflow.consultation.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.clinicflow.consultation.entity.Patient;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    java.util.Optional<Patient> findByMrn(String mrn);
    java.util.List<Patient> findByUserId(Long userId);
    java.util.List<Patient> findByNameIgnoreCaseAndUserIdIsNull(String name);
    java.util.List<Patient> findByRegisteredByUserId(Long registeredByUserId);
}
