package com.clinicflow.pharmacy.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DispenseResponseDTO {

    private Long dispenseId;
    private Long rxId;
    private Long inventoryId;
    private Long patientId;

    private String medicationName;
    private String unit;
    private Integer quantity;
    private Integer remainingStock;
    private BigDecimal unitCost;
    private BigDecimal totalCost;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dispensedAt;

    private String status;
}
