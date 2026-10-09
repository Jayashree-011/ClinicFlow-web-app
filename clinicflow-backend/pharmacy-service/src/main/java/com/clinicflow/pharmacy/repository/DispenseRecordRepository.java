package com.clinicflow.pharmacy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.clinicflow.pharmacy.entity.DispenseRecord;

import java.util.List;

public interface DispenseRecordRepository extends JpaRepository<DispenseRecord, Long> {

    List<DispenseRecord> findByPatientId(Long patientId);
}