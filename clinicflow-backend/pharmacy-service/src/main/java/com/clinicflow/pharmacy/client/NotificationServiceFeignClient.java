package com.clinicflow.pharmacy.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Feign client for notification-service.
 * Resolved via Eureka — bypasses the gateway.
 * notification-service has no Spring Security so no JWT is required.
 */
@FeignClient(name = "notification-service",
             contextId = "pharmacy-notification",
             fallback = NotificationServiceFeignClientFallback.class)
public interface NotificationServiceFeignClient {

    @PostMapping("/api/notifications")
    Map<String, Object> send(@RequestBody Map<String, Object> payload);
}
