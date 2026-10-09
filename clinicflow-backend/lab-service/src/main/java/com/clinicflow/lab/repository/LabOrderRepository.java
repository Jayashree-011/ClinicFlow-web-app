package com.clinicflow.lab.repository;

import com.clinicflow.lab.entity.LabOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {

    List<LabOrder> findByPatientId(Long patientId);
    List<LabOrder> findByStatus(String status);
    List<LabOrder> findByEncounterId(Long encounterId);
}