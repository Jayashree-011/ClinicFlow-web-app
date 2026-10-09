package com.clinicflow.consultation.config;

import com.clinicflow.consultation.entity.Doctor;
import com.clinicflow.consultation.service.DoctorService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
public class DefaultDoctor {

    private final DoctorService doctorService;

    public DefaultDoctor(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    private void createDoctor(String name, String specialty,
                               String qualification, String email,
                               String phone, String status, Long userId) {
        Doctor existing = doctorService.getAllDoctors()
                .stream()
                .filter(d -> d.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            System.out.println("⏭️ Doctor already in DB: " + name);
            return;
        }

        Doctor doctor = new Doctor();
        doctor.setName(name);
        doctor.setSpecialty(specialty);
        doctor.setQualification(qualification);
        doctor.setEmail(email);
        doctor.setPhone(phone);
        doctor.setUserId(userId);
        doctor.setStatus(status);

        // false = skip user provisioning; user-service seeds these accounts directly
        doctorService.registerDoctor(doctor, null, false);
        System.out.println("✅ Default doctor created: " + name);
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(1)
    public void createDefaultDoctors() {
        createDoctor("Dr. Alice Carter", "Cardiology",       "MD, PhD",   "a.carter@clinicflow.com", "+1 (555) 201-0001", "Active", 4L);
        createDoctor("Dr. Brian Nguyen", "Neurology",        "MD",        "b.nguyen@clinicflow.com", "+1 (555) 201-0002", "On Call", 5L);
        createDoctor("Dr. Clara Mendes", "General Practice", "MBBS, MD",  "c.mendes@clinicflow.com", "+1 (555) 201-0003", "Active", 6L);
    }
}
