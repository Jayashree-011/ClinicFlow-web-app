package com.clinicflow.lab.repository;

import com.clinicflow.lab.entity.LabResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabResultRepository extends JpaRepository<LabResult, Long> {

    List<LabResult> findByLabOrderId(Long labOrderId);
    List<LabResult> findByTestCode(String testCode);
}