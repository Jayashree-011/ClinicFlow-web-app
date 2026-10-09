package com.clinicflow.pharmacy.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(name = "prescription-service",
             fallback = PrescriptionClientFallback.class)
public interface PrescriptionClient {

    @PutMapping("/api/prescriptions/{id}/dispense")
    void markDispensed(@PathVariable("id") Long id);
}
