package com.clinicflow.notification.service;

import com.clinicflow.notification.dto.NotificationDTO;
import com.clinicflow.notification.dto.TaskDTO;
import com.clinicflow.notification.entity.Notification;
import com.clinicflow.notification.entity.Task;
import com.clinicflow.notification.repository.TaskRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private NotificationService notificationService;

    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TaskDTO getTaskById(Long id) {
        return taskRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));
    }

    public TaskDTO createTask(TaskDTO taskDTO) {
        Task task = toEntity(taskDTO);
        validateTask(task);
        return toDto(taskRepository.save(task));
    }

    public TaskDTO updateTask(Long id, TaskDTO taskDTO) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));

        task.setAssignedTo(taskDTO.getAssignedTo());
        task.setRelatedEntityId(taskDTO.getRelatedEntityId());
        task.setDescription(taskDTO.getDescription());
        task.setDueDate(taskDTO.getDueDate());
        task.setPriority(taskDTO.getPriority());
        task.setCreatedAt(taskDTO.getCreatedAt());
        task.setCompletedAt(taskDTO.getCompletedAt());
        task.setStatus(taskDTO.getStatus());

        validateTask(task);
        checkEscalation(task);
        return toDto(taskRepository.save(task));
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }

    @Scheduled(cron = "0 0 * * * *")
    public void scanPendingTasksForEscalation() {
        List<Task> pendingTasks = taskRepository.findByStatus("PENDING");
        pendingTasks.stream()
                .filter(task -> task.getDueDate() != null && task.getDueDate().isBefore(LocalDateTime.now()))
                .forEach(task -> {
                    if (!"HIGH".equals(task.getPriority())) {
                        task.setPriority("HIGH");
                    }
                    createEscalationNotification(task);
                    taskRepository.save(task);
                });
    }

    private void validateTask(Task task) {
        if (task.getAssignedTo() == null) {
            throw new IllegalArgumentException("AssignedTo cannot be null");
        }
        if (task.getDescription() == null || task.getDescription().isEmpty()) {
            throw new IllegalArgumentException("Description cannot be null or empty");
        }
        if (task.getDueDate() != null && task.getDueDate().isBefore(LocalDateTime.now())) {
            // Allow overdue tasks, but perhaps warn or escalate later.
        }
    }

    private void checkEscalation(Task task) {
        if ("PENDING".equals(task.getStatus()) && task.getDueDate() != null && task.getDueDate().isBefore(LocalDateTime.now())) {
            if (!"HIGH".equals(task.getPriority())) {
                task.setPriority("HIGH");
            }
            createEscalationNotification(task);
        }
    }

    private void createEscalationNotification(Task task) {
        NotificationDTO notificationDTO = new NotificationDTO();
        notificationDTO.setUserId(task.getAssignedTo());
        notificationDTO.setMessage("High Priority: Task " + task.getDescription() + " is overdue.");
        notificationDTO.setSeverity("HIGH");
        notificationDTO.setChannel(Notification.Channel.PUSH);
        notificationDTO.setEntityId(task.getRelatedEntityId());
        notificationDTO.setCreatedAt(LocalDateTime.now());
        notificationDTO.setStatus("UNREAD");
        notificationService.createNotification(notificationDTO);
    }

    private TaskDTO toDto(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setTaskId(task.getTaskId());
        dto.setAssignedTo(task.getAssignedTo());
        dto.setRelatedEntityId(task.getRelatedEntityId());
        dto.setDescription(task.getDescription());
        dto.setDueDate(task.getDueDate());
        dto.setPriority(task.getPriority());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setCompletedAt(task.getCompletedAt());
        dto.setStatus(task.getStatus());
        return dto;
    }

    private Task toEntity(TaskDTO dto) {
        Task task = new Task();
        task.setTaskId(dto.getTaskId());
        task.setAssignedTo(dto.getAssignedTo());
        task.setRelatedEntityId(dto.getRelatedEntityId());
        task.setDescription(dto.getDescription());
        task.setDueDate(dto.getDueDate());
        task.setPriority(dto.getPriority());
        task.setCreatedAt(dto.getCreatedAt());
        task.setCompletedAt(dto.getCompletedAt());
        task.setStatus(dto.getStatus());
        return task;
    }
}
