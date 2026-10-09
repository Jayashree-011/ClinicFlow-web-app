package com.clinicflow.consultation.client;

import com.clinicflow.consultation.dto.UserProvisionRequest;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Circuit-breaker fallback for UserServiceFeignClient (user-service).
 *
 * User provisioning is fire-and-forget — a downed user-service must never
 * prevent a doctor or patient from being registered in consultation-service.
 *
 * createInactiveUser  → returns empty map (idempotent no-op on retry).
 * suggestUsername     → returns the raw baseName so the caller still gets a
 *                       usable (possibly non-unique) username to work with.
 */
@Component
public class UserServiceFeignClientFallback implements UserServiceFeignClient {

    @Override
    public Map<String, Object> createInactiveUser(UserProvisionRequest request) {
        System.out.println("⚡ [CB OPEN] user-service unavailable — user provisioning skipped");
        return Map.of();
    }

    @Override
    public String suggestUsername(String baseName) {
        System.out.println("⚡ [CB OPEN] user-service unavailable — returning baseName as fallback username: " + baseName);
        return baseName;
    }
}
