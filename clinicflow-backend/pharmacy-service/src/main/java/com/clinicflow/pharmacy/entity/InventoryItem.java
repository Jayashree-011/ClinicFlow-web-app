package com.clinicflow.pharmacy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inventory_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryId;

    // ✅ microservice-safe → store medId directly
    private Long medId;

    private String medicationName;

    private String batchNumber;
    private Integer quantity;
    private String unit;
    private LocalDate expiryDate;
    private String location;
    private BigDecimal costPrice;
    private String status;
}