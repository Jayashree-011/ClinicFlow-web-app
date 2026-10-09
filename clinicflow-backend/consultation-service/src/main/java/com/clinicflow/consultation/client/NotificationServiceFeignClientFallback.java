package com.clinicflow.consultation.client;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Circuit-breaker fallback for NotificationServiceFeignClient.
 *
 * Notifications are fire-and-forget: a downed notification-service must
 * never block appointment booking or status updates.
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
