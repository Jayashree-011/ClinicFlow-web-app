package com.clinicflow.notification.dto;

import com.clinicflow.notification.entity.Notification;

import java.time.LocalDateTime;

public class NotificationDTO {

    private Long notificationId;
    private Long userId;
    private Long patientId;
    private Long entityId;
    private String message;
    private String category;
    private Notification.Channel channel;
    private String severity;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private String status;

    // Constructors, Getters and Setters
    public NotificationDTO() {}

    public NotificationDTO(Long notificationId, Long userId, Long patientId, Long entityId, String message, String category, Notification.Channel channel, String severity, LocalDateTime createdAt, LocalDateTime readAt, String status) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.patientId = patientId;
        this.entityId = entityId;
        this.message = message;
        this.category = category;
        this.channel = channel;
        this.severity = severity;
        this.createdAt = createdAt;
        this.readAt = readAt;
        this.status = status;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Notification.Channel getChannel() {
        return channel;
    }

    public void setChannel(Notification.Channel channel) {
        this.channel = channel;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}