package com.clinicflow.billingService.client;

import com.clinicflow.billingService.dto.EncounterDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@FeignClient(name = "encounter-service",
             fallback = EncounterServiceClientFallback.class)
public interface EncounterServiceClient {

    @GetMapping("/api/encounter/{encounterId}")
    Object getEncounterById(@PathVariable("encounterId") Long encounterId);

    @GetMapping("/api/encounter/patient/{patientId}")
    List<EncounterDTO> getEncountersByPatientId(@PathVariable("patientId") Long patientId);
}
