package com.clinicflow.Encounter.client;

import com.clinicflow.Encounter.dto.PatientDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "consultation-service",
             fallback = ConsultationClientFallback.class)
public interface ConsultationClient {

    @GetMapping("/api/consultation/patient/{patientId}")
    PatientDTO getPatientById(@PathVariable("patientId") Long patientId);

    @GetMapping("/api/consultation/patient/patients")
    List<PatientDTO> getAllPatients();
}