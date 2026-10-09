package com.clinicflow.userservice.service;

import com.clinicflow.userservice.entity.User;
import com.clinicflow.userservice.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User save(User user) {
        // Only enforce username uniqueness for brand-new users (no primary key yet).
        // Existing users being updated already own their username.
        if (user.getUserId() == null && existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        return userRepository.save(user);
    }

    public void delete(User user) {
        userRepository.delete(user);
    }

    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    public boolean passwordsMatch(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public String suggestUsername(String base) {
        String username = base;
        int suffix = 1;
        while (existsByUsername(username)) {
            username = base + suffix;
            suffix++;
        }
        return username;
    }

    /**
     * Called by other microservices (e.g. consultation-service) to provision a
     * user account automatically. Always sets status = INACTIVE so an admin must
     * activate the account before the user can log in.
     *
     * Idempotent: returns null silently when the username already exists.
     */
    public User createInactiveUser(String username, String fullName, String email,
                                   String phone, User.UserRole role, String rawPassword) {
        if (existsByUsername(username)) {
            return null; // already provisioned — no-op
        }
        // Deduplicate email: append suffix when it conflicts
        String resolvedEmail = email;
        if (findByEmail(resolvedEmail).isPresent()) {
            resolvedEmail = username.toLowerCase().replaceAll("[^a-z0-9]", "") + "@auto.clinicflow.local";
        }
        User user = new User();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(resolvedEmail);
        user.setPhone(phone != null ? phone : "");
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setStatus(User.UserStatus.INACTIVE);
        user.setCreatedAt(java.time.LocalDateTime.now());
        user.setUpdatedAt(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }
}
