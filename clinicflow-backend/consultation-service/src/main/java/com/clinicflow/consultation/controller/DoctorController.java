package com.clinicflow.consultation.controller;
 
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.clinicflow.consultation.dto.DoctorDTO;
import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.service.DoctorService;
 
@RequestMapping("/api/consultation/doctor")
@RestController
public class DoctorController {
    private final DoctorService doctorService;
 
    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }
 
    @GetMapping("/list")
    public List<DoctorDTO> getAllDoctors() {
        return doctorService.getAllDoctors().stream()
                .map(Doctor::toDTO)
                .collect(Collectors.toList());
    }
 
    @GetMapping("/{doctorId}")
    public DoctorDTO getDoctorById(@PathVariable Long doctorId) {
        return doctorService.getDoctorById(doctorId).toDTO();
    }
 
    @PutMapping("/{doctorId}/update")
    public DoctorDTO updateDoctor(@PathVariable Long doctorId, @RequestBody DoctorDTO doctor) {
        return doctorService.updateDoctor(doctorId, doctor.toEntity()).toDTO();
    }
 
    @PostMapping("/{userId}/register")
    public DoctorDTO registerDoctor(
            @PathVariable Long userId,
            @RequestBody DoctorDTO doctor,
            @RequestParam(defaultValue = "true") boolean provisionUser) {
        return doctorService.registerDoctor(doctor.toEntity(), userId, provisionUser).toDTO();
    }
 
    @DeleteMapping("/{doctorId}")
    public void deleteDoctor(@PathVariable Long doctorId) {
        doctorService.deleteDoctor(doctorId);
    }
}
 