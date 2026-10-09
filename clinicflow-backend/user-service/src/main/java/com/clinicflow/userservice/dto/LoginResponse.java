package com.clinicflow.userservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LoginResponse {
    private String token;
    private String type;
    private Long   id;
    private String username;
    private String email;
    private String role;
    private String fullName;
    private String phone;
    private String status;

    // Profile extras — populated by /user/me, null on a plain login response
    private String  clinicName;
    private String  address;
    private String  city;
    private Boolean notifEmailAlerts;
    private Boolean notifAppointments;
    private Boolean notifBilling;

    /** Null until the user has logged in at least once (provisioned but never logged-in accounts). */
    private LocalDateTime lastLoginAt;

    /** Used for login — profile extras are left null. */
    public LoginResponse(String token, String type, Long id, String username,
                         String fullName, String email, String phone, String role) {
        this.token    = token;
        this.type     = type;
        this.id       = id;
        this.username = username;
        this.fullName = fullName;
        this.email    = email;
        this.role     = role;
        this.phone    = phone;
    }
}
