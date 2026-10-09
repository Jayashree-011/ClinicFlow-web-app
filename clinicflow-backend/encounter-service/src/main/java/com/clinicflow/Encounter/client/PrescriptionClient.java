package com.clinicflow.Encounter.client;

import com.clinicflow.Encounter.dto.PrescriptionSyncRequest;
import com.clinicflow.Encounter.dto.PrescriptionSyncResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "prescription-service",
             fallback = PrescriptionClientFallback.class)
public interface PrescriptionClient {

    @PostMapping("/api/prescriptions")
    PrescriptionSyncResponse createPrescription(@RequestBody PrescriptionSyncRequest request);

    @PutMapping("/api/prescriptions/{id}/issue")
    PrescriptionSyncResponse issuePrescription(@PathVariable("id") Long id);
}
