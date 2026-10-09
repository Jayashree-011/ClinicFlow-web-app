package com.clinicflow.userservice.dto;

import com.clinicflow.userservice.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateRequest {
    private String fullName;
    private String email;
    private String phone;
    private User.UserRole   role;
    /** Admins may explicitly activate or deactivate any account. */
    private User.UserStatus status;
    // Profile extras
    private String  clinicName;
    private String  address;
    private String  city;
    private Boolean notifEmailAlerts;
    private Boolean notifAppointments;
    private Boolean notifBilling;
}
