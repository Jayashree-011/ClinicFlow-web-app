package com.clinicflow.Encounter.repository;

import com.clinicflow.Encounter.entity.Encounter;
import com.clinicflow.Encounter.entity.EncounterStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EncounterRepository extends JpaRepository<Encounter, Long> {
    
    List<Encounter> findByPatientId(Long patientId);
    
    List<Encounter> findByDoctorId(Long doctorId);

    List<Encounter> findByPatientIdAndStatus(Long patientId, EncounterStatus status);

    List<Encounter> findByDoctorIdAndStatus(Long doctorId, EncounterStatus status);
    
    List<Encounter> findByStatus(EncounterStatus status);
    
    @Query("SELECT e FROM Encounter e WHERE e.patientId = :patientId AND e.startAt BETWEEN :start AND :end")
    List<Encounter> findEncountersByPatientAndDateRange(
            @Param("patientId") Long patientId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
    
    @Query("SELECT e FROM Encounter e WHERE e.doctorId = :doctorId AND e.startAt BETWEEN :start AND :end")
    List<Encounter> findEncountersByDoctorAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
    
    Optional<Encounter> findByEncounterIdAndPatientId(Long encounterId, Long patientId);
    
    @Query("SELECT COUNT(e) > 0 FROM Encounter e WHERE e.patientId = :patientId AND e.status IN ('IN_PROGRESS', 'COMPLETED')")
    boolean hasActiveEncounters(@Param("patientId") Long patientId);
}
