package com.clinicflow.consultation.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.clinicflow.consultation.entity.Doctor;
import java.util.List;
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    // Custom query methods can be defined here if needed
    List<Doctor> findBySpecialty(String specialty);
    List<Doctor> findByNameContainingIgnoreCase(String name);
    List<Doctor> findBySpecialtyAndNameContainingIgnoreCase(String specialty, String name);
}