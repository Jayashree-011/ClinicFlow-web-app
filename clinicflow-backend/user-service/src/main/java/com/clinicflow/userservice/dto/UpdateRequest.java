package com.clinicflow.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRequest extends RegisterRequest {
    private String oldPassword;
    // Profile extras — same fields as AdminUpdateRequest so Settings.tsx
    // can persist clinic info and notification preferences.
    private String  clinicName;
    private String  address;
    private String  city;
    private Boolean notifEmailAlerts;
    private Boolean notifAppointments;
    private Boolean notifBilling;
}
