package com.clinicflow.notification.service;

import com.clinicflow.notification.dto.NotificationDTO;
import com.clinicflow.notification.entity.Notification;
import com.clinicflow.notification.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<NotificationDTO> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<NotificationDTO> getByUserId(Long userId) {
        return notificationRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<NotificationDTO> getByPatientId(Long patientId) {
        return notificationRepository.findByPatientId(patientId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<NotificationDTO> getByStatus(String status) {
        return notificationRepository.findByStatus(status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public NotificationDTO getNotificationById(Long id) {
        return notificationRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found with id: " + id));
    }

    public NotificationDTO createNotification(NotificationDTO notificationDTO) {
        Notification notification = fromDto(notificationDTO);
        validateNotification(notification);
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(LocalDateTime.now());
        }
        return toDto(notificationRepository.save(notification));
    }

    public NotificationDTO updateNotification(Long id, NotificationDTO notificationDTO) {
        Notification existing = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found with id: " + id));

        existing.setUserId(notificationDTO.getUserId());
        existing.setPatientId(notificationDTO.getPatientId());
        existing.setEntityId(notificationDTO.getEntityId());
        existing.setMessage(notificationDTO.getMessage());
        existing.setCategory(notificationDTO.getCategory());
        existing.setChannel(notificationDTO.getChannel());
        existing.setSeverity(notificationDTO.getSeverity());
        existing.setCreatedAt(notificationDTO.getCreatedAt());
        existing.setReadAt(notificationDTO.getReadAt());
        existing.setStatus(notificationDTO.getStatus());

        validateNotification(existing);
        return toDto(notificationRepository.save(existing));
    }

    public NotificationDTO markAsRead(Long id) {
        Notification existing = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found with id: " + id));
        existing.setStatus("READ");
        existing.setReadAt(LocalDateTime.now());
        return toDto(notificationRepository.save(existing));
    }

    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new EntityNotFoundException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }

    private NotificationDTO toDto(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setNotificationId(notification.getNotificationId());
        dto.setUserId(notification.getUserId());
        dto.setPatientId(notification.getPatientId());
        dto.setEntityId(notification.getEntityId());
        dto.setMessage(notification.getMessage());
        dto.setCategory(notification.getCategory());
        dto.setChannel(notification.getChannel());
        dto.setSeverity(notification.getSeverity());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());
        dto.setStatus(notification.getStatus());
        return dto;
    }

    private Notification fromDto(NotificationDTO dto) {
        Notification notification = new Notification();
        notification.setNotificationId(dto.getNotificationId());
        notification.setUserId(dto.getUserId());
        notification.setPatientId(dto.getPatientId());
        notification.setEntityId(dto.getEntityId());
        notification.setMessage(dto.getMessage());
        notification.setCategory(dto.getCategory());
        notification.setChannel(dto.getChannel());
        notification.setSeverity(dto.getSeverity());
        notification.setCreatedAt(dto.getCreatedAt());
        notification.setReadAt(dto.getReadAt());
        notification.setStatus(dto.getStatus());
        return notification;
    }

    private void validateNotification(Notification notification) {
        if (notification.getMessage() == null || notification.getMessage().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be null or empty");
        }
        if (notification.getChannel() == null) {
            throw new IllegalArgumentException("Channel cannot be null");
        }
        if (notification.getUserId() == null && notification.getPatientId() == null) {
            throw new IllegalArgumentException("Either UserId or PatientId must be set");
        }
    }
}
