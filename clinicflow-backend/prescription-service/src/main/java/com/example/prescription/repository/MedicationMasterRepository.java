package com.clinicflow.prescription.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.clinicflow.prescription.entity.MedicationMaster;

public interface MedicationMasterRepository
        extends JpaRepository<MedicationMaster, Long> {
}