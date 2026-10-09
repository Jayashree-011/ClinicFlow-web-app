package com.clinicflow.consultation.client;

import com.clinicflow.consultation.dto.UserProvisionRequest;
import com.clinicflow.consultation.entity.Doctor;
import org.springframework.stereotype.Component;

/**
 * Fire-and-forget wrapper around {@link UserServiceFeignClient}.
 * Used only for doctor provisioning — patients create their user account first
 * (via Register) and then call POST /consultation/patient/register with userId.
 */
@Component
public class UserServiceClient {

    private static final String DEFAULT_PASSWORD = "ClinicFlow@2025";

    private final UserServiceFeignClient feignClient;

    public UserServiceClient(UserServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    // ── Doctor ─────────────────────────────────────────────────────────────

    public void createDoctorUser(Doctor doctor) {
        try {
            String email = doctor.getEmail();
            if (email == null || email.isBlank()) {
                email = deriveBase(doctor.getName()) + "@clinicflow.local";
            }

            // Use suggestUsername so the derived name is always unique and clean
            // (e.g. "dr. john smith" → "john.smith" → "john.smith2" if taken)
            String base = deriveBase(doctor.getName());
            String username = suggestSafe(base.isBlank() ? "doctor" : base);

            UserProvisionRequest req = new UserProvisionRequest(
                    username,
                    DEFAULT_PASSWORD,
                    doctor.getName(),
                    email,
                    doctor.getPhone() != null ? doctor.getPhone() : "",
                    "Clinician");

            feignClient.createInactiveUser(req);
            System.out.println("✅ Clinician user provisioned (INACTIVE): " + username);
        } catch (Exception e) {
            System.out.println("⚠️  Could not provision clinician user: " + e.getMessage());
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Strips "Dr." prefix, lowercases, replaces spaces with dots, strips
     * non-alphanumeric characters — mirrors the frontend's deriveBase logic.
     */
    private String deriveBase(String name) {
        if (name == null) return "";
        return name
                .replaceAll("(?i)^Dr\\.?\\s*", "")
                .trim()
                .toLowerCase()
                .replaceAll("\\s+", ".")
                .replaceAll("[^a-z0-9._-]", "");
    }

    /**
     * Calls suggestUsername on user-service; falls back to {@code base} itself
     * if the RPC fails (fire-and-forget tolerance).
     */
    private String suggestSafe(String base) {
        try {
            return feignClient.suggestUsername(base);
        } catch (Exception e) {
            System.out.println("⚠️  suggestUsername RPC failed, using base directly: " + e.getMessage());
            return base;
        }
    }

}
