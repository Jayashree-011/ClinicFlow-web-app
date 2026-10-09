package com.clinicflow.lab.client;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Circuit-breaker fallback for NotificationServiceFeignClient.
 *
 * Notifications are fire-and-forget: a downed notification-service must
 * never block lab result recording.
 */
@Component
public class NotificationServiceFeignClientFallback implements NotificationServiceFeignClient {

    @Override
    public Map<String, Object> send(Map<String, Object> payload) {
        System.out.println("⚡ [CB OPEN] notification-service unavailable — notification skipped: "
                + payload.getOrDefault("message", ""));
        return Map.of();
    }
}
