package com.clinicflow.consultation.service;

import com.clinicflow.consultation.client.UserServiceClient;
import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import com.clinicflow.consultation.exception.ObjectNotFoundException;
import java.util.List;

@Service
public class DoctorService {
    private final DoctorRepository  doctorRepository;
    private final UserServiceClient userServiceClient;

    public DoctorService(DoctorRepository doctorRepository,
                         UserServiceClient userServiceClient) {
        this.doctorRepository  = doctorRepository;
        this.userServiceClient = userServiceClient;
    }
 
    public Doctor getDoctorById(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ObjectNotFoundException("Doctor not found with id: " + doctorId));
    }
 
    public Doctor registerDoctor(Doctor doctor, Long userId) {
        return registerDoctor(doctor, userId, true);
    }

    public Doctor registerDoctor(Doctor doctor, Long userId, boolean provisionUser) {
        Doctor existing = doctorRepository.findByNameContainingIgnoreCase(doctor.getName()).stream()
                .filter(d -> d.getSpecialty().equalsIgnoreCase(doctor.getSpecialty()))
                .findFirst()
                .orElse(null);
        if (existing != null) {
            System.out.println("⚠️ Doctor already exists: " + doctor.getName());
            return existing;
        }
        doctor.setUserId(userId);
        Doctor saved = doctorRepository.save(doctor);
        if (provisionUser) userServiceClient.createDoctorUser(saved);
        return saved;
    }
 
    public Doctor updateDoctor(Long doctorId, Doctor updatedDoctor) {
        Doctor existingDoctor = getDoctorById(doctorId);
        existingDoctor.setName(updatedDoctor.getName());
        existingDoctor.setSpecialty(updatedDoctor.getSpecialty());
        return doctorRepository.save(existingDoctor);
    }
 
    public void deleteDoctor(Long doctorId) {
        Doctor existingDoctor = getDoctorById(doctorId);
        doctorRepository.delete(existingDoctor);
    }
 
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }
 
    public List<Doctor> getDoctorsBySpecialty(String specialty) {
        return doctorRepository.findBySpecialty(specialty);
    }
 
    public List<Doctor> getDoctorsByName(String name) {
        return doctorRepository.findByNameContainingIgnoreCase(name);
    }
 
    public List<Doctor> getDoctorsBySpecialtyAndName(String specialty, String name) {
        return doctorRepository.findBySpecialtyAndNameContainingIgnoreCase(specialty, name);
    }
}