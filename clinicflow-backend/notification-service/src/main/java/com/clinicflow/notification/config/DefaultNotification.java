package com.clinicflow.notification.config;

import com.clinicflow.notification.dto.NotificationDTO;
import com.clinicflow.notification.dto.TaskDTO;
import com.clinicflow.notification.entity.Notification;
import com.clinicflow.notification.service.NotificationService;
import com.clinicflow.notification.service.TaskService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Seeds default notifications and tasks that correspond to the default
 * users, doctors, patients and appointments created by the other service
 * seeders (DefaultUser / DefaultDoctor / DefaultPatient / DefaultAppointment).
 *
 * User-ID reference (mirrors DefaultUser in user-service):
 *   1  – admin          (Administrator)
 *   2  – receptionist   (Receptionist)
 *   3  – clinician      (Clinician)
 *   4  – alice.carter   (Dr. Alice Carter  – Cardiology)
 *   5  – brian.nguyen   (Dr. Brian Nguyen  – Neurology)
 *   6  – clara.mendes   (Dr. Clara Mendes  – General Practice)
 *   7  – john.doe       (Patient, patientId=1, MRN-0001)
 *   8  – jane.smith     (Patient, patientId=2, MRN-0002)
 *   9  – robert.johnson (Patient, patientId=3, MRN-0003)
 *
 * Runs at @Order(4) so doctors (1), patients (2) and appointments (3)
 * are all committed before notifications reference their entity IDs.
 */
@Component
public class DefaultNotification {

    private final NotificationService notificationService;
    private final TaskService         taskService;

    public DefaultNotification(NotificationService notificationService,
                                TaskService taskService) {
        this.notificationService = notificationService;
        this.taskService         = taskService;
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private void notify(Long userId, Long patientId, Long entityId,
                        String category, String message,
                        Notification.Channel channel, String severity,
                        String status) {
        NotificationDTO dto = new NotificationDTO();
        dto.setUserId(userId);
        dto.setPatientId(patientId);
        dto.setEntityId(entityId);
        dto.setCategory(category);
        dto.setMessage(message);
        dto.setChannel(channel);
        dto.setSeverity(severity);
        dto.setCreatedAt(LocalDateTime.now());
        dto.setStatus(status);
        notificationService.createNotification(dto);
    }

    private void task(Long assignedTo, Long relatedEntityId,
                      String description, String priority,
                      LocalDateTime dueDate) {
        TaskDTO dto = new TaskDTO();
        dto.setAssignedTo(assignedTo);
        dto.setRelatedEntityId(relatedEntityId);
        dto.setDescription(description);
        dto.setPriority(priority);
        dto.setDueDate(dueDate);
        dto.setCreatedAt(LocalDateTime.now());
        dto.setStatus("PENDING");
        taskService.createTask(dto);
    }

    // ── seeder ──────────────────────────────────────────────────────────────

    @EventListener(ApplicationReadyEvent.class)
    @Order(4)
    public void seedDefaults() {

        if (!notificationService.getAllNotifications().isEmpty()) {
            System.out.println("⏭️ Default notifications already seeded — skipping.");
            return;
        }

        seedNotifications();
        seedTasks();
    }

    // ── notifications ────────────────────────────────────────────────────────

    private void seedNotifications() {

        LocalDateTime now = LocalDateTime.now();

        // ── System welcome notifications (admin & staff) ─────────────────────
        notify(1L, null, null,
               "SYSTEM",
               "ClinicFlow is ready. All micro-services are running. Welcome, Administrator.",
               Notification.Channel.PUSH, "INFO", "READ");

        notify(2L, null, null,
               "SYSTEM",
               "Welcome to ClinicFlow. You have 3 upcoming appointments to confirm this week.",
               Notification.Channel.PUSH, "INFO", "UNREAD");

        notify(3L, null, null,
               "SYSTEM",
               "Welcome to ClinicFlow. Your patient schedule has been configured. Check your task list.",
               Notification.Channel.PUSH, "INFO", "READ");

        // ── Appointment reminders for doctors ────────────────────────────────
        // entityId = appointmentId (1, 2, 3 — created by DefaultAppointment)
        notify(4L, null, 1L,
               "APPOINTMENT",
               "Reminder: You have a Cardiology consultation with John Doe (MRN-0001) tomorrow at 9:00 AM.",
               Notification.Channel.PUSH, "INFO", "UNREAD");

        notify(5L, null, 2L,
               "APPOINTMENT",
               "Reminder: You have a Neurology follow-up with Jane Smith (MRN-0002) in 2 days at 10:00 AM.",
               Notification.Channel.PUSH, "INFO", "UNREAD");

        notify(6L, null, 3L,
               "APPOINTMENT",
               "Reminder: You have a General Practice check-up with Robert Johnson (MRN-0003) in 3 days at 11:00 AM.",
               Notification.Channel.PUSH, "INFO", "UNREAD");

        // ── Appointment reminders for patients ───────────────────────────────
        notify(7L, 1L, 1L,
               "APPOINTMENT",
               "Your Cardiology consultation with Dr. Alice Carter is scheduled for tomorrow at 9:00 AM. Please arrive 15 minutes early.",
               Notification.Channel.PUSH, "INFO", "UNREAD");

        notify(8L, 2L, 2L,
               "APPOINTMENT",
               "Your Neurology follow-up with Dr. Brian Nguyen is scheduled in 2 days at 10:00 AM.",
               Notification.Channel.PUSH, "INFO", "UNREAD");

        notify(9L, 3L, 3L,
               "APPOINTMENT",
               "Your General Practice check-up with Dr. Clara Mendes is scheduled in 3 days at 11:00 AM.",
               Notification.Channel.PUSH, "INFO", "UNREAD");

        // ── Lab notifications ─────────────────────────────────────────────────
        notify(7L, 1L, null,
               "LAB",
               "Your lab results from your last visit are now available. Please log in to the patient portal to review them.",
               Notification.Channel.EMAIL, "INFO", "UNREAD");

        notify(3L, null, null,
               "LAB",
               "Lab results for patient John Doe (MRN-0001) are ready for clinical review.",
               Notification.Channel.PUSH, "INFO", "UNREAD");

        // ── Billing notifications ─────────────────────────────────────────────
        notify(7L, 1L, null,
               "BILLING",
               "Invoice for your recent Cardiology consultation is ready. Please log in to view and complete payment.",
               Notification.Channel.EMAIL, "WARNING", "UNREAD");

        notify(8L, 2L, null,
               "BILLING",
               "Invoice for your recent Neurology follow-up is ready. Please log in to view and complete payment.",
               Notification.Channel.EMAIL, "WARNING", "UNREAD");

        // ── Receptionist operational alert ───────────────────────────────────
        notify(2L, null, null,
               "SYSTEM",
               "3 new patients registered this week. Please ensure their intake forms and insurance details are complete.",
               Notification.Channel.PUSH, "WARNING", "UNREAD");

        System.out.println("✅ Default notifications seeded (13 records).");
    }

    // ── tasks ─────────────────────────────────────────────────────────────────

    private void seedTasks() {

        LocalDateTime now = LocalDateTime.now();

        // Receptionist — confirm tomorrow's appointments
        task(2L, 1L,
             "Confirm patient check-in for tomorrow's appointments: John Doe (MRN-0001) at 9:00 AM",
             "HIGH",
             now.plusDays(1).withHour(8).withMinute(0).withSecond(0).withNano(0));

        // Clinician — sign outstanding encounter notes
        task(3L, null,
             "Review and sign any outstanding encounter notes before end of week",
             "HIGH",
             now.plusDays(2).withHour(17).withMinute(0).withSecond(0).withNano(0));

        // Dr. Alice Carter — prescription review for John Doe
        task(4L, 1L,
             "Complete prescription review for John Doe (MRN-0001) following tomorrow's Cardiology consultation",
             "MEDIUM",
             now.plusDays(1).withHour(12).withMinute(0).withSecond(0).withNano(0));

        // Dr. Brian Nguyen — follow up on lab order
        task(5L, 2L,
             "Review pending lab order results for Jane Smith (MRN-0002) before Neurology follow-up",
             "MEDIUM",
             now.plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0));

        // Dr. Clara Mendes — patient history review
        task(6L, 3L,
             "Review Robert Johnson (MRN-0003) patient history and condition notes prior to General Practice check-up",
             "MEDIUM",
             now.plusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0));

        // Receptionist — insurance claims follow-up
        task(2L, null,
             "Follow up on pending insurance claims submitted this month and update claim statuses in billing",
             "MEDIUM",
             now.plusDays(5).withHour(16).withMinute(0).withSecond(0).withNano(0));

        // Admin — monthly user access audit
        task(1L, null,
             "Conduct monthly user access review: verify role assignments and deactivate any stale accounts",
             "LOW",
             now.plusDays(7).withHour(10).withMinute(0).withSecond(0).withNano(0));

        System.out.println("✅ Default tasks seeded (7 records).");
    }
}
