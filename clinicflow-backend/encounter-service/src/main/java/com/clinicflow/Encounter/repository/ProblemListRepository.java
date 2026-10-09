package com.clinicflow.Encounter.repository;

import com.clinicflow.Encounter.entity.ProblemList;
import com.clinicflow.Encounter.entity.ProblemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemListRepository extends JpaRepository<ProblemList, Long> {
    
    List<ProblemList> findByPatientId(Long patientId);
    
    List<ProblemList> findByEncounterId(Long encounterId);
    
    List<ProblemList> findByPatientIdAndStatus(Long patientId, ProblemStatus status);
    
    List<ProblemList> findByPatientIdAndStatusAndEncounterId(
            Long patientId, 
            ProblemStatus status, 
            Long encounterId
    );
    
    @Query("SELECT p FROM ProblemList p WHERE p.patientId = :patientId AND p.status = 'ACTIVE'")
    List<ProblemList> findActiveProblems(@Param("patientId") Long patientId);
    
    Optional<ProblemList> findByProblemIdAndPatientId(Long problemId, Long patientId);
    
    boolean existsByPatientIdAndCode(Long patientId, String code);
}
