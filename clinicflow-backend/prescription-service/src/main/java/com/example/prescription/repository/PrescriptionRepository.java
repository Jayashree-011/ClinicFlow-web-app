package com.clinicflow.prescription.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import com.clinicflow.prescription.entity.Prescription;
import com.clinicflow.prescription.entity.PrescriptionStatus;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    List<Prescription> findByPatientId(Long patientId);

    List<Prescription> findByEncounterId(Long encounterId);

    List<Prescription> findByStatus(PrescriptionStatus status);

    /** Permanently removes a single prescription row from the DB */
    @Modifying
    @Transactional
    @Query("DELETE FROM Prescription p WHERE p.rxId = :id")
    void hardDeleteById(Long id);
}