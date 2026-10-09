package com.clinicflow.notification.dto;

import java.time.LocalDateTime;

public class TaskDTO {

    private Long taskId;
    private Long assignedTo;
    private Long relatedEntityId;
    private String description;
    private LocalDateTime dueDate;
    private String priority;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String status;

    // Constructors, Getters and Setters
    public TaskDTO() {}

    public TaskDTO(Long taskId, Long assignedTo, Long relatedEntityId, String description, LocalDateTime dueDate, String priority, LocalDateTime createdAt, LocalDateTime completedAt, String status) {
        this.taskId = taskId;
        this.assignedTo = assignedTo;
        this.relatedEntityId = relatedEntityId;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
        this.status = status;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}