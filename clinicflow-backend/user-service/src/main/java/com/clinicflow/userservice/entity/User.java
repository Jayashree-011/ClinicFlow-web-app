package com.clinicflow.userservice.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data                       // Generates getters, setters, toString, etc.
@NoArgsConstructor          // Required by JPA
@AllArgsConstructor         // Useful for testing/builders
@Builder                    // Allows User.builder().name("John").build()
@EntityListeners(AuditingEntityListener.class) // Enables auto-timestamps
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // Consider using an Enum here (e.g., ADMIN, USER)

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status; // e.g., ACTIVE, INACTIVE

    // ── Profile extras ──────────────────────────────────────────────────────
    // These fields mirror the UserProfile shape used in the frontend Settings
    // and User Management pages.  All are nullable so existing rows are
    // unaffected when the schema is auto-updated.

    /** Name of the clinic/institution displayed on invoices. */
    private String clinicName;

    /** Street address displayed on invoices. */
    private String address;

    /** City displayed on invoices. */
    private String city;

    /** Receive critical system alert notifications. */
    private Boolean notifEmailAlerts;

    /** Receive appointment confirmation notifications. */
    private Boolean notifAppointments;

    /** Receive invoice / billing status notifications. */
    private Boolean notifBilling;

    // ── Timestamps ──────────────────────────────────────────────────────────

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /** Stamped on every successful login. Null until the user logs in for the first time. */
    private LocalDateTime lastLoginAt;

    @Column(unique = true)
    private String sessionToken; // For session management if needed

    public enum UserRole {
        Patient,//2
        Receptionist,//3
        Clinician,//5
        Pharmacy,//3
        Finance,//4, 1
        Manager,//4
        Administrator,//4
        Auditor//1
    }
    public enum UserStatus {
        ACTIVE,
        INACTIVE
    }
}