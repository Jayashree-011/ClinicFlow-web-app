package com.clinicflow.userservice.dto;

import com.clinicflow.userservice.entity.User;
import com.clinicflow.userservice.entity.User.UserRole;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Data;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    private String username;
    private String password;
    private String fullName;
    private String email;
    private String phone;
    private UserRole role;
    public User toUser() {
        User user = new User();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setPassword(password);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        user.setStatus(User.UserStatus.ACTIVE); // Default to ACTIVE on registration
        user.setCreatedAt(java.time.LocalDateTime.now());
        user.setUpdatedAt(java.time.LocalDateTime.now());

        return user;
    }
}