package com.clinicflow.prescription.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medication_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicationMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long medId;

    private String code;
    private String name;
    private String formulation;
    private String strength;
    private String status;
}