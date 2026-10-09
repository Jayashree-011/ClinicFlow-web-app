package com.clinicflow.userservice.config;

import org.springframework.context.annotation.Configuration;
import com.clinicflow.userservice.entity.User;
import com.clinicflow.userservice.service.UserService;
import jakarta.annotation.PostConstruct;

@Configuration
public class DefaultUser {

    private final UserService userService;

    public DefaultUser(UserService userService) {
        this.userService = userService;
    }

    private void createActive(String username, String password, String fullName,
                               String email, User.UserRole role) {
        if (userService.findByUsername(username).isPresent()) return;
        User user = new User();
        user.setUsername(username);
        user.setPassword(userService.encodePassword(password));
        user.setFullName(fullName);
        user.setRole(role);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setEmail(email);
        user.setPhone("");
        user.setCreatedAt(java.time.LocalDateTime.now());
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userService.save(user);
        System.out.println("✅ Default user created: " + username);
    }

    private void createInactive(String username, String fullName, String email,
                                 String phone, User.UserRole role) {
        if (userService.findByUsername(username).isPresent()) return;
        userService.createInactiveUser(username, fullName, email, phone, role, "ClinicFlow@2025");
        System.out.println("✅ Default inactive user created: " + username);
    }

    @PostConstruct
    public void seedDefaults() {
        // Staff accounts (ACTIVE — can log in immediately)
        createActive("admin",        "admin123",        "Admin User",        "admin@mail.com",        User.UserRole.Administrator);
        createActive("receptionist", "receptionist123", "Receptionist User", "receptionist@mail.com", User.UserRole.Receptionist);
        createActive("clinician",    "clinician123",    "Clinician User",    "clinician@mail.com",    User.UserRole.Clinician);

        // Default doctors — match names in consultation-service DefaultDoctor seeder
        // INACTIVE: activate on first login, password: ClinicFlow@2025
        createInactive("alice.carter",   "Dr. Alice Carter",  "a.carter@clinicflow.com", "+1 (555) 201-0001", User.UserRole.Clinician);
        createInactive("brian.nguyen",   "Dr. Brian Nguyen",  "b.nguyen@clinicflow.com", "+1 (555) 201-0002", User.UserRole.Clinician);
        createInactive("clara.mendes",   "Dr. Clara Mendes",  "c.mendes@clinicflow.com", "+1 (555) 201-0003", User.UserRole.Clinician);

        // Default patients — match names in consultation-service DefaultPatient seeder
        // INACTIVE: activate on first login, password: ClinicFlow@2025
        createInactive("john.doe",       "John Doe",       "john.doe@mail.com",       "555-0101", User.UserRole.Patient);
        createInactive("jane.smith",     "Jane Smith",     "jane.smith@mail.com",     "555-0102", User.UserRole.Patient);
        createInactive("robert.johnson", "Robert Johnson", "robert.johnson@mail.com", "555-0103", User.UserRole.Patient);
    }
}
