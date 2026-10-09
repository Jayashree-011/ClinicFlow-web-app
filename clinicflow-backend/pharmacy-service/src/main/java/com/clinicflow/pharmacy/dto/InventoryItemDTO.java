package com.clinicflow.pharmacy.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InventoryItemDTO {

    private Long inventoryId;
    private Long medId;
    private String medicationName;

    private String batchNumber;
    private Integer quantity;
    private String unit;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;

    private String location;
    private BigDecimal costPrice;
    private String status;
}
