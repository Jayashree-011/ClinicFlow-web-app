package com.clinicflow.notification.repository;

import com.clinicflow.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);
    List<Notification> findByPatientId(Long patientId);
    List<Notification> findByStatus(String status);
    List<Notification> findByChannel(Notification.Channel channel);
}