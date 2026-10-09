package com.clinicflow.billingService.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import com.clinicflow.billingService.client.PatientServiceClient;

@Data
@NoArgsConstructor
public class PatientDTO {
    private String mrn;
    private String name;
    private String email;
    private String phoneNumber;

    /*public Patient toPatient() {
        Patient patient = new Patient();
        patient.setMrn(mrn);
        patient.setName(name);
        patient.setPrimaryContact(email != null ? email : phoneNumber);
        return patient;
    } */
}