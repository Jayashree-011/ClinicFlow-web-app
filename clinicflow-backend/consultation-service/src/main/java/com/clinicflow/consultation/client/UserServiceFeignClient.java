package com.clinicflow.consultation.client;

import com.clinicflow.consultation.dto.UserProvisionRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Feign client for user-service.
 * Resolved via Eureka — no hard-coded URL needed.
 */
@FeignClient(name = "user-service",
             fallback = UserServiceFeignClientFallback.class)
public interface UserServiceFeignClient {

    /** Always returns {"userId": ..., "username": ..., "status": ...} — even when the account already existed. */
    @PostMapping("/api/auth/internal/create")
    Map<String, Object> createInactiveUser(@RequestBody UserProvisionRequest request);

    /** Returns the first available username derived from baseName (e.g. "john.smith" or "john.smith2"). */
    @GetMapping("/api/auth/suggestUsername/{baseName}")
    String suggestUsername(@PathVariable("baseName") String baseName);
}
