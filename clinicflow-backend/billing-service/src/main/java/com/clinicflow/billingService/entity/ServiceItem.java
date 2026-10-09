package com.clinicflow.billingService.entity;
import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Entity
@Table(name = "service_items")
@Getter 
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long serviceItemId;

    @Column(nullable = false, unique = true, length = 50)
    private String code;
    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long invoiceId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillingCategory billingCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)   
    private ServiceStatus status;

    public enum ServiceStatus {
        ACTIVE,
        INACTIVE
    }
    public enum BillingCategory {
        CONSULTATION,
        LAB_TEST,
        IMAGING,
        PROCEDURE,
        OTHER
    }
}