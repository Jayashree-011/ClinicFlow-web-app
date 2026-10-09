package com.clinicflow.userservice.controller;

import com.clinicflow.userservice.dto.AdminUpdateRequest;
import com.clinicflow.userservice.entity.User;
import com.clinicflow.userservice.dto.LoginResponse;
import com.clinicflow.userservice.security.UserDetailsImpl;
import com.clinicflow.userservice.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth/user")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized: Gateway properties failed to transition to internal core");
        }

        Optional<User> user = userService.findById(userDetails.getId());

        if (user.isPresent()) {
            var u = user.get();
            LoginResponse loginResponse = new LoginResponse(
                    null,          // token — gateway holds the auth context
                    "Internal",
                    u.getUserId(),
                    u.getUsername(),
                    u.getFullName(),
                    u.getEmail(),
                    u.getPhone(),
                    u.getRole().name()
            );
            // Populate profile extras so Settings.tsx can display them
            loginResponse.setStatus(u.getStatus() != null ? u.getStatus().name() : null);
            loginResponse.setClinicName(u.getClinicName());
            loginResponse.setAddress(u.getAddress());
            loginResponse.setCity(u.getCity());
            loginResponse.setNotifEmailAlerts(u.getNotifEmailAlerts());
            loginResponse.setNotifAppointments(u.getNotifAppointments());
            loginResponse.setNotifBilling(u.getNotifBilling());
            loginResponse.setLastLoginAt(u.getLastLoginAt());
            return ResponseEntity.ok(loginResponse);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(@AuthenticationPrincipal UserDetailsImpl authenticatedUser) {
        if (authenticatedUser == null || !"Administrator".equals(authenticatedUser.getRole())) {
            return ResponseEntity.status(403).body(null);
        }
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@AuthenticationPrincipal UserDetailsImpl authenticatedUser, @PathVariable Long id) {
        if (authenticatedUser == null) {
            return ResponseEntity.status(401).body(null);
        }
        boolean isAdmin       = "Administrator".equals(authenticatedUser.getRole());
        boolean isReceptionist = "Receptionist".equals(authenticatedUser.getRole());
        boolean isSelf        = authenticatedUser.getId().equals(id);
        if (!isAdmin && !isReceptionist && !isSelf) {
            return ResponseEntity.status(403).body(null);
        }
        Optional<User> user = userService.findById(id);
        return user.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Admin-only: update any user's profile fields without requiring the old password.
     * Patches only the non-null fields supplied in the request body.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> adminUpdateUser(
            @PathVariable Long id,
            @RequestBody AdminUpdateRequest request) {

        Optional<User> userOpt = userService.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (request.getFullName()          != null) user.setFullName(request.getFullName());
        if (request.getEmail()             != null) user.setEmail(request.getEmail());
        if (request.getPhone()             != null) user.setPhone(request.getPhone());
        if (request.getRole()              != null) user.setRole(request.getRole());
        if (request.getStatus()            != null) user.setStatus(request.getStatus());
        if (request.getClinicName()        != null) user.setClinicName(request.getClinicName());
        if (request.getAddress()           != null) user.setAddress(request.getAddress());
        if (request.getCity()              != null) user.setCity(request.getCity());
        if (request.getNotifEmailAlerts()  != null) user.setNotifEmailAlerts(request.getNotifEmailAlerts());
        if (request.getNotifAppointments() != null) user.setNotifAppointments(request.getNotifAppointments());
        if (request.getNotifBilling()      != null) user.setNotifBilling(request.getNotifBilling());
        userService.save(user);

        return ResponseEntity.ok(user);
    }
}