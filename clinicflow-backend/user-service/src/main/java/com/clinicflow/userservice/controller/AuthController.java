package com.clinicflow.userservice.controller;

import com.clinicflow.userservice.dto.LoginRequest;
import com.clinicflow.userservice.dto.LoginResponse;
import com.clinicflow.userservice.dto.RegisterRequest;
import com.clinicflow.userservice.dto.UpdateRequest;
import com.clinicflow.userservice.entity.User;
import com.clinicflow.userservice.service.UserService;
import com.clinicflow.userservice.security.JwtUtils;
import com.clinicflow.userservice.security.UserDetailsImpl;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final UserService userService;
    private final JwtUtils jwtUtils;

    public AuthController(UserService userService,
                                    JwtUtils jwtUtils) {
        this.userService = userService;
        this.jwtUtils = jwtUtils;
    }

    // ✅ PUBLIC — suggest an available username derived from baseName
    @GetMapping("/suggestUsername/{baseName}")
    public ResponseEntity<String> suggestUsername(@PathVariable String baseName) {
        String sanitized = baseName.trim().toLowerCase().replaceAll("[^a-z0-9._-]", "");
        if (sanitized.isBlank()) {
            return ResponseEntity.badRequest().body("baseName must contain at least one alphanumeric character");
        }
        return ResponseEntity.ok(userService.suggestUsername(sanitized));
    }

    // ✅ REGISTER
    // Patient role → public (no JWT required).
    // Any other role → caller must be an authenticated Administrator
    //   (gateway injects X-User-Role header when a valid JWT is present).
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @AuthenticationPrincipal UserDetailsImpl authenticatedUser,
            @RequestBody RegisterRequest request) {

        boolean isPatient = request.getRole() == User.UserRole.Patient;

        if (!isPatient) {
            if (authenticatedUser == null || !"Administrator".equals(authenticatedUser.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only administrators can register non-Patient accounts");
            }
        }

        if (userService.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Username is already taken");
        }

        if (userService.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email is already in use");
        }

        User user = request.toUser();
        user.setPassword(userService.encodePassword(request.getPassword()));
        userService.save(user);

        return ResponseEntity.ok("User registered successfully");
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateUser(
        @AuthenticationPrincipal UserDetailsImpl authenticatedUser, 
        @RequestBody UpdateRequest request) {
        Optional<User> userOpt = userService.findByUsername(request.getUsername());

        if(!("Administrator".equals(authenticatedUser.getRole()) ||
             authenticatedUser.getId().equals(userOpt.map(User::getUserId).orElse(-1L))
        )) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You can only update your own account");
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
        }

        User user = userOpt.get();
        if (!userService.passwordsMatch(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Old password is incorrect");
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(userService.encodePassword(request.getPassword()));
        }

        if (request.getRole() != null && request.getRole() != user.getRole()) {
            user.setRole(request.getRole());
        }

        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        // Profile extras — null means "leave unchanged"
        if (request.getClinicName()        != null) user.setClinicName(request.getClinicName());
        if (request.getAddress()           != null) user.setAddress(request.getAddress());
        if (request.getCity()              != null) user.setCity(request.getCity());
        if (request.getNotifEmailAlerts()  != null) user.setNotifEmailAlerts(request.getNotifEmailAlerts());
        if (request.getNotifAppointments() != null) user.setNotifAppointments(request.getNotifAppointments());
        if (request.getNotifBilling()      != null) user.setNotifBilling(request.getNotifBilling());
        userService.save(user);

        return ResponseEntity.ok("User updated successfully");
    }

    // ✅ LOGIN + JWT
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userService.findByUsername(loginRequest.getUsername());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        User user = userOpt.get();
        if (!userService.passwordsMatch(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        // Auto-activate provisioned accounts on first successful login.
        // Doctors and patients are seeded as INACTIVE so an admin can review them,
        // but the moment they log in with valid credentials they are considered active.
        if (user.getStatus() == User.UserStatus.INACTIVE) {
            user.setStatus(User.UserStatus.ACTIVE);
        }

        // Stamp last login time on every successful authentication.
        user.setLastLoginAt(java.time.LocalDateTime.now());
        userService.save(user);

        String token = jwtUtils.generateToken(user.getUserId().toString(), user.getUsername(), user.getRole().name());
        LoginResponse response = new LoginResponse(
                token,
                "Bearer",
                user.getUserId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name());
        response.setLastLoginAt(user.getLastLoginAt());

        return ResponseEntity.ok(response);
    }

    /** Returns the userId for a given username — used by seeders to stamp userId on patient/doctor records. */
    @GetMapping("/internal/userId/{username}")
    public ResponseEntity<?> getUserIdByUsername(@PathVariable String username) {
        return userService.findByUsername(username)
                .map(u -> ResponseEntity.ok(java.util.Map.of("userId", u.getUserId())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Called by consultation-service via Feign to provision a user account
     * with INACTIVE status. Idempotent — returns 200 if the username already exists.
     */
    @PostMapping("/internal/create")
    public ResponseEntity<?> createInternalUser(@RequestBody RegisterRequest request) {
        User created = userService.createInactiveUser(
                request.getUsername(),
                request.getFullName(),
                request.getEmail(),
                request.getPhone(),
                request.getRole(),
                request.getPassword() != null ? request.getPassword() : "ClinicFlow@2025"
        );
        if (created == null) {
            // Already exists — look up and return their ID so consultation-service can write it back
            User existing = userService.findByUsername(request.getUsername()).orElse(null);
            if (existing != null) {
                return ResponseEntity.ok(java.util.Map.of(
                        "userId",   existing.getUserId(),
                        "username", existing.getUsername(),
                        "status",   existing.getStatus().name()
                ));
            }
            return ResponseEntity.ok(java.util.Map.of("userId", -1L, "username", request.getUsername(), "status", "UNKNOWN"));
        }
        return ResponseEntity.ok(java.util.Map.of(
                "userId",   created.getUserId(),
                "username", created.getUsername(),
                "status",   created.getStatus().name()
        ));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal UserDetailsImpl authenticatedUser, @RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userService.findByUsername(loginRequest.getUsername());
        if(!authenticatedUser.getId().equals(userOpt.map(User::getUserId).orElse(-1L))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You can only delete your own account");
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        User user = userOpt.get();
        if (!userService.passwordsMatch(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        userService.delete(user);
        return ResponseEntity.ok("User deleted successfully");
    }
}