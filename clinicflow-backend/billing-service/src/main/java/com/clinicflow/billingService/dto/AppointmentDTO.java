package com.clinicflow.billingService.dto;
//import com.clinicflow.billingService.entity.Appointment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
//import java.time.LocalDateTime;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentDTO {
    private Long appointmentId;
    private Long clinicianId;
    private String department;
    private String serviceType;
    private String startAt;
    private String endAt;
    private String status;
    
}
