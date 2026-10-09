package com.clinicflow.billingService.client;
import com.clinicflow.billingService.dto.AppointmentDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;  
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;
// contextId disambiguates from PatientServiceClient which also targets consultation-service
@FeignClient(name = "consultation-service",
             contextId = "consultation-appointment",
             fallback = AppointmentServiceClientFallback.class)
public interface AppointmentServiceClient {
    // Full path required — Eureka resolves to the service's own host:port, not the gateway
    @GetMapping("/api/consultation/appointment/patient/{patientId}")
    List<AppointmentDTO> getAppointmentsByPatientId(@PathVariable("patientId") Long patientId);
}