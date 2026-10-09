package com.clinicflow.notification.repository;

import com.clinicflow.notification.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedTo(Long assignedTo);
    List<Task> findByStatus(String status);
    List<Task> findByDueDateBefore(LocalDateTime dueDate);
}