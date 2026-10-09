package com.clinicflow.notification.service;

import com.clinicflow.notification.dto.NotificationDTO;
import com.clinicflow.notification.entity.Notification;
import com.clinicflow.notification.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationService notificationService;

    // ─── getAllNotifications ──────────────────────────────────────────────────

    @Test
    @DisplayName("getAllNotifications: returns all mapped to DTOs")
    void getAllNotifications_returnsMappedList() {
        List<Notification> notifications = List.of(
                buildNotification(1L, 10L, null, "Appointment tomorrow", Notification.Channel.PUSH),
                buildNotification(2L, 20L, null, "Lab results ready",    Notification.Channel.EMAIL));
        when(notificationRepository.findAll()).thenReturn(notifications);

        List<NotificationDTO> result = notificationService.getAllNotifications();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getMessage()).isEqualTo("Appointment tomorrow");
    }

    // ─── getByUserId ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getByUserId: returns notifications for a specific user")
    void getByUserId_returnsUserNotifications() {
        List<Notification> notifs = List.of(
                buildNotification(1L, 10L, null, "Your appointment is confirmed", Notification.Channel.PUSH));
        when(notificationRepository.findByUserId(10L)).thenReturn(notifs);

        List<NotificationDTO> result = notificationService.getByUserId(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(10L);
    }

    // ─── getByPatientId ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getByPatientId: returns notifications for a specific patient")
    void getByPatientId_returnsPatientNotifications() {
        List<Notification> notifs = List.of(
                buildNotification(1L, null, 5L, "Your prescription is ready", Notification.Channel.SMS));
        when(notificationRepository.findByPatientId(5L)).thenReturn(notifs);

        List<NotificationDTO> result = notificationService.getByPatientId(5L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPatientId()).isEqualTo(5L);
    }

    // ─── getByStatus ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getByStatus: returns all notifications with matching status")
    void getByStatus_returnsMatchingNotifications() {
        List<Notification> unread = List.of(
                buildNotification(1L, 10L, null, "New message", Notification.Channel.PUSH));
        when(notificationRepository.findByStatus("UNREAD")).thenReturn(unread);

        List<NotificationDTO> result = notificationService.getByStatus("UNREAD");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("UNREAD");
    }

    // ─── getNotificationById ──────────────────────────────────────────────────

    @Test
    @DisplayName("getNotificationById: returns DTO when found")
    void getNotificationById_whenFound_returnsDTO() {
        Notification n = buildNotification(1L, 10L, null, "Test message", Notification.Channel.PUSH);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));

        NotificationDTO result = notificationService.getNotificationById(1L);

        assertThat(result.getNotificationId()).isEqualTo(1L);
        assertThat(result.getMessage()).isEqualTo("Test message");
    }

    @Test
    @DisplayName("getNotificationById: throws EntityNotFoundException when not found")
    void getNotificationById_whenNotFound_throwsEntityNotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.getNotificationById(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── createNotification ───────────────────────────────────────────────────

    @Test
    @DisplayName("createNotification: saves valid notification")
    void createNotification_valid_savesAndReturnsDTO() {
        NotificationDTO dto = buildDTO(null, 10L, null, "Hello", Notification.Channel.PUSH);
        Notification saved  = buildNotification(1L, 10L, null, "Hello", Notification.Channel.PUSH);
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        NotificationDTO result = notificationService.createNotification(dto);

        assertThat(result.getNotificationId()).isEqualTo(1L);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("createNotification: sets createdAt when not provided")
    void createNotification_setsCreatedAtWhenNull() {
        NotificationDTO dto = buildDTO(null, 10L, null, "Hello", Notification.Channel.PUSH);
        dto.setCreatedAt(null);

        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> {
                    Notification n = inv.getArgument(0);
                    assertThat(n.getCreatedAt()).isNotNull();
                    return n;
                });

        notificationService.createNotification(dto);
    }

    @Test
    @DisplayName("createNotification: preserves caller-supplied createdAt")
    void createNotification_preservesProvidedCreatedAt() {
        LocalDateTime fixedTime = LocalDateTime.of(2026, 1, 1, 10, 0);
        NotificationDTO dto = buildDTO(null, 10L, null, "Hello", Notification.Channel.PUSH);
        dto.setCreatedAt(fixedTime);

        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> {
                    Notification n = inv.getArgument(0);
                    assertThat(n.getCreatedAt()).isEqualTo(fixedTime);
                    return n;
                });

        notificationService.createNotification(dto);
    }

    @Test
    @DisplayName("createNotification: throws when message is null")
    void createNotification_whenMessageNull_throwsIllegalArgument() {
        NotificationDTO dto = buildDTO(null, 10L, null, null, Notification.Channel.PUSH);

        assertThatThrownBy(() -> notificationService.createNotification(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Message cannot be null or empty");
    }

    @Test
    @DisplayName("createNotification: throws when message is empty")
    void createNotification_whenMessageEmpty_throwsIllegalArgument() {
        NotificationDTO dto = buildDTO(null, 10L, null, "", Notification.Channel.PUSH);

        assertThatThrownBy(() -> notificationService.createNotification(dto))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("createNotification: throws when channel is null")
    void createNotification_whenChannelNull_throwsIllegalArgument() {
        NotificationDTO dto = buildDTO(null, 10L, null, "Hello", null);

        assertThatThrownBy(() -> notificationService.createNotification(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Channel cannot be null");
    }

    @Test
    @DisplayName("createNotification: throws when both userId and patientId are null")
    void createNotification_whenNoRecipient_throwsIllegalArgument() {
        NotificationDTO dto = buildDTO(null, null, null, "Hello", Notification.Channel.PUSH);

        assertThatThrownBy(() -> notificationService.createNotification(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Either UserId or PatientId must be set");
    }

    @Test
    @DisplayName("createNotification: patientId alone is sufficient as recipient")
    void createNotification_withPatientIdOnly_isValid() {
        NotificationDTO dto = buildDTO(null, null, 5L, "Hello", Notification.Channel.SMS);
        Notification saved = buildNotification(1L, null, 5L, "Hello", Notification.Channel.SMS);
        when(notificationRepository.save(any())).thenReturn(saved);

        NotificationDTO result = notificationService.createNotification(dto);

        assertThat(result).isNotNull();
    }

    // ─── updateNotification ───────────────────────────────────────────────────

    @Test
    @DisplayName("updateNotification: updates all fields")
    void updateNotification_updatesAllFields() {
        Notification existing = buildNotification(1L, 10L, null, "Old message", Notification.Channel.PUSH);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        NotificationDTO updates = buildDTO(1L, 10L, null, "Updated message", Notification.Channel.EMAIL);
        updates.setStatus("UNREAD");

        NotificationDTO result = notificationService.updateNotification(1L, updates);

        assertThat(result.getMessage()).isEqualTo("Updated message");
        assertThat(result.getChannel()).isEqualTo(Notification.Channel.EMAIL);
    }

    @Test
    @DisplayName("updateNotification: throws EntityNotFoundException when not found")
    void updateNotification_whenNotFound_throws() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.updateNotification(
                99L, buildDTO(99L, 10L, null, "X", Notification.Channel.PUSH)))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ─── markAsRead ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("markAsRead: sets status to READ and sets readAt")
    void markAsRead_setsReadStatusAndTimestamp() {
        Notification n = buildNotification(1L, 10L, null, "Test", Notification.Channel.PUSH);
        n.setStatus("UNREAD");
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        NotificationDTO result = notificationService.markAsRead(1L);

        assertThat(result.getStatus()).isEqualTo("READ");
        assertThat(result.getReadAt()).isNotNull();
    }

    @Test
    @DisplayName("markAsRead: throws EntityNotFoundException when not found")
    void markAsRead_whenNotFound_throws() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ─── deleteNotification ───────────────────────────────────────────────────

    @Test
    @DisplayName("deleteNotification: deletes when found")
    void deleteNotification_whenFound_deletes() {
        when(notificationRepository.existsById(1L)).thenReturn(true);
        doNothing().when(notificationRepository).deleteById(1L);

        notificationService.deleteNotification(1L);

        verify(notificationRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deleteNotification: throws EntityNotFoundException when not found")
    void deleteNotification_whenNotFound_throws() {
        when(notificationRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> notificationService.deleteNotification(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Notification buildNotification(Long id, Long userId, Long patientId,
                                           String message, Notification.Channel channel) {
        Notification n = new Notification();
        n.setNotificationId(id);
        n.setUserId(userId);
        n.setPatientId(patientId);
        n.setMessage(message);
        n.setChannel(channel);
        n.setStatus("UNREAD");
        n.setCreatedAt(LocalDateTime.now());
        return n;
    }

    private NotificationDTO buildDTO(Long id, Long userId, Long patientId,
                                     String message, Notification.Channel channel) {
        NotificationDTO dto = new NotificationDTO();
        dto.setNotificationId(id);
        dto.setUserId(userId);
        dto.setPatientId(patientId);
        dto.setMessage(message);
        dto.setChannel(channel);
        dto.setStatus("UNREAD");
        return dto;
    }
}
