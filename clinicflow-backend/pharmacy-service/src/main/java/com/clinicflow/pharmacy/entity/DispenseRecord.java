package com.clinicflow.pharmacy.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dispense_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DispenseRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dispenseId;

    private Long rxId;
    private Long inventoryId;
    private Long patientId;
    private Long dispensedBy;

    private String medicationName;
    private String unit;
    private Integer quantity;
    private Integer remainingStock;   // stock left in inventory after this dispense
    private BigDecimal unitCost;      // cost per unit at time of dispense (snapshot)
    private BigDecimal totalCost;     // unitCost × quantity
    private LocalDateTime dispensedAt;

    private String status;
    private String notes;
}