package com.clinicflow.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body sent to user-service POST /api/auth/internal/create.
 * Field names must match user-service's RegisterRequest.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProvisionRequest {
    private String username;
    private String password;
    private String fullName;
    private String email;
    private String phone;
    /** "Patient" or "Clinician" — matches User.UserRole enum name in user-service */
    private String role;
}
