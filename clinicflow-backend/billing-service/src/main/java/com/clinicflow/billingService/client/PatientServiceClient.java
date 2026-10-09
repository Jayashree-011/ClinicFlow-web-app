package com.clinicflow.billingService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.clinicflow.billingService.dto.PatientDTO;

@FeignClient(name = "consultation-service",
             contextId = "consultation-patient",
             fallback = PatientServiceClientFallback.class)
public interface PatientServiceClient {

    @GetMapping("/api/consultation/patient/{id}")
    PatientDTO getPatient(@PathVariable("id") Long id);

}
