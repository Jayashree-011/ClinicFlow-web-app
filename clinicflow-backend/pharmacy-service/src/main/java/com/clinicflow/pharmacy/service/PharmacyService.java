package com.clinicflow.pharmacy.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

import com.clinicflow.pharmacy.client.NotificationServiceClient;
import com.clinicflow.pharmacy.client.PrescriptionClient;
import com.clinicflow.pharmacy.dto.*;
import com.clinicflow.pharmacy.entity.*;
import com.clinicflow.pharmacy.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PharmacyService {

    private static final int LOW_STOCK_THRESHOLD = 20;

    private final InventoryItemRepository inventoryRepo;
    private final DispenseRecordRepository dispenseRepo;

    @Autowired(required = false)
    private PrescriptionClient prescriptionClient;

    @Autowired(required = false)
    private NotificationServiceClient notificationServiceClient;

    public PharmacyService(InventoryItemRepository inventoryRepo,
                           DispenseRecordRepository dispenseRepo) {
        this.inventoryRepo = inventoryRepo;
        this.dispenseRepo = dispenseRepo;
    }

    // ── Status helper ─────────────────────────────────────────────────────────
    // EXPIRED is sticky. qty=0 → OUT_OF_STOCK, qty≤threshold → LOW_STOCK, else ACTIVE
    private String deriveStatus(Integer qty, String currentStatus) {
        if ("EXPIRED".equalsIgnoreCase(currentStatus)) return "EXPIRED";
        if (qty == null || qty <= 0)          return "OUT_OF_STOCK";
        if (qty <= LOW_STOCK_THRESHOLD)        return "LOW_STOCK";
        return "ACTIVE";
    }

    // ✅ CREATE / RESTOCK INVENTORY (upsert: same medId restocks existing item)
    public InventoryItemDTO addStock(InventoryItemDTO dto) {

        // Find an existing restockable item with the same medId
        List<InventoryItem> existing = inventoryRepo.findByMedId(dto.getMedId());
        InventoryItem item = existing.stream()
                .filter(i -> !"REMOVED".equals(i.getStatus()) && !"EXPIRED".equals(i.getStatus()))
                .findFirst()
                .orElse(null);

        if (item != null) {
            // Restock: add quantity to existing stock
            int newQty = item.getQuantity() + (dto.getQuantity() != null ? dto.getQuantity() : 0);
            item.setQuantity(newQty);
            item.setStatus(deriveStatus(newQty, item.getStatus()));
            if (dto.getBatchNumber() != null && !dto.getBatchNumber().isBlank())
                item.setBatchNumber(dto.getBatchNumber());
            if (dto.getExpiryDate() != null)
                item.setExpiryDate(dto.getExpiryDate());
            if (dto.getCostPrice() != null)
                item.setCostPrice(dto.getCostPrice());
            if (dto.getLocation() != null && !dto.getLocation().isBlank())
                item.setLocation(dto.getLocation());
            if (dto.getUnit() != null && !dto.getUnit().isBlank())
                item.setUnit(dto.getUnit());
        } else {
            // New entry
            item = new InventoryItem();
            item.setMedId(dto.getMedId());
            item.setMedicationName(dto.getMedicationName());
            item.setBatchNumber(dto.getBatchNumber());
            int qty = dto.getQuantity() != null ? dto.getQuantity() : 0;
            item.setQuantity(qty);
            item.setUnit(dto.getUnit());
            item.setExpiryDate(dto.getExpiryDate());
            item.setLocation(dto.getLocation());
            item.setCostPrice(dto.getCostPrice());
            item.setStatus(deriveStatus(qty, dto.getStatus()));
        }

        return mapInventory(inventoryRepo.save(item));
    }

    // ✅ GET ALL
    public List<InventoryItemDTO> getAllInventory() {
        return inventoryRepo.findAll().stream()
                .map(this::mapInventory)
                .collect(Collectors.toList());
    }

    // ✅ GET BY ID
    public InventoryItemDTO getInventoryById(Long id) {
        return mapInventory(inventoryRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Inventory not found with id: " + id)));
    }

    // ✅ GET BY MEDICATION
    public List<InventoryItemDTO> getByMedication(Long medId) {
        return inventoryRepo.findByMedId(medId)
                .stream()
                .map(this::mapInventory)
                .collect(Collectors.toList());
    }

    // ✅ UPDATE (auto-derives status from quantity; EXPIRED preserved when passed)
    public InventoryItemDTO update(Long id, InventoryItemDTO dto) {

        InventoryItem item = inventoryRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Inventory not found with id: " + id));

        item.setBatchNumber(dto.getBatchNumber());
        item.setQuantity(dto.getQuantity());
        item.setUnit(dto.getUnit());
        item.setExpiryDate(dto.getExpiryDate());
        item.setLocation(dto.getLocation());
        item.setCostPrice(dto.getCostPrice());
        item.setStatus(deriveStatus(dto.getQuantity(), dto.getStatus()));

        return mapInventory(inventoryRepo.save(item));
    }

    // ✅ MANUAL STATUS OVERRIDE (e.g. mark EXPIRED from UI)
    public InventoryItemDTO updateStatus(Long id, String status) {
        InventoryItem item = inventoryRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Inventory not found with id: " + id));
        item.setStatus(status);
        return mapInventory(inventoryRepo.save(item));
    }

    // ✅ DELETE (SOFT) — sets status to REMOVED
    public InventoryItemDTO delete(Long id) {
        InventoryItem item = inventoryRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Inventory not found with id: " + id));
        item.setStatus("REMOVED");
        return mapInventory(inventoryRepo.save(item));
    }

    // ✅ HARD DELETE — permanently removes one row from the DB
    public void hardDelete(Long id) {
        if (!inventoryRepo.existsById(id)) {
            throw new NoSuchElementException("Inventory not found with id: " + id);
        }
        inventoryRepo.hardDeleteById(id);
        log.info("Hard-deleted inventory item {}", id);
    }

    // ✅ PURGE REMOVED — permanently deletes every row with status=REMOVED
    public int purgeRemoved() {
        int count = inventoryRepo.hardDeleteByStatus("REMOVED");
        log.info("Purged {} REMOVED inventory items", count);
        return count;
    }

    // ✅ DISPENSE — deducts stock, guards against over-dispensing, snapshots cost
    public DispenseResponseDTO dispense(DispenseRequestDTO dto) {

        InventoryItem item = inventoryRepo.findById(dto.getInventoryId())
                .orElseThrow(() -> new NoSuchElementException(
                        "Inventory not found with id: " + dto.getInventoryId()));

        // Guard: cannot dispense from empty stock
        if (item.getQuantity() == null || item.getQuantity() <= 0) {
            throw new IllegalStateException(
                    "'" + item.getMedicationName() + "' is out of stock.");
        }
        int dispensedQty = dto.getQuantity() != null ? dto.getQuantity() : 0;
        if (dispensedQty > item.getQuantity()) {
            throw new IllegalStateException(
                    "Requested " + dispensedQty + " but only " + item.getQuantity()
                    + " " + item.getUnit() + " of '" + item.getMedicationName() + "' available.");
        }

        // Deduct stock
        int newQty = item.getQuantity() - dispensedQty;
        item.setQuantity(newQty);
        item.setStatus(deriveStatus(newQty, item.getStatus()));
        inventoryRepo.save(item);

        // Snapshot cost at time of dispense
        BigDecimal unitCost  = item.getCostPrice();
        BigDecimal totalCost = (unitCost != null && dispensedQty > 0)
                ? unitCost.multiply(BigDecimal.valueOf(dispensedQty))
                : null;

        DispenseRecord record = new DispenseRecord();
        record.setRxId(dto.getRxId());
        record.setInventoryId(dto.getInventoryId());
        record.setPatientId(dto.getPatientId());
        record.setDispensedBy(dto.getDispensedBy());
        record.setMedicationName(item.getMedicationName());
        record.setQuantity(dispensedQty);
        record.setUnit(item.getUnit());
        record.setRemainingStock(newQty);
        record.setUnitCost(unitCost);
        record.setTotalCost(totalCost);
        record.setDispensedAt(LocalDateTime.now());
        record.setStatus("DISPENSED");

        DispenseResponseDTO response = mapDispense(dispenseRepo.save(record));

        // Notify prescription-service to flip Rx status → DISPENSED
        if (dto.getRxId() != null && prescriptionClient != null) {
            try {
                prescriptionClient.markDispensed(dto.getRxId());
                log.info("Marked prescription {} as DISPENSED", dto.getRxId());
            } catch (Exception e) {
                log.warn("Could not update prescription {} status: {}", dto.getRxId(), e.getMessage());
            }
        }

        // Fire-and-forget: notify the patient their medication has been dispensed.
        if (notificationServiceClient != null && dto.getPatientId() != null) {
            notificationServiceClient.notifyMedicationDispensed(
                    dto.getPatientId(),
                    response.getDispenseId(),
                    item.getMedicationName());
        }

        // Fire-and-forget: alert pharmacy staff if stock has gone low after this dispense.
        if (notificationServiceClient != null
                && ("LOW_STOCK".equals(item.getStatus()) || "OUT_OF_STOCK".equals(item.getStatus()))) {
            notificationServiceClient.notifyLowStock(item.getMedicationName(), newQty);
        }

        return response;
    }

    // ✅ HISTORY
    public List<DispenseResponseDTO> history(Long patientId) {
        return dispenseRepo.findByPatientId(patientId)
                .stream()
                .map(this::mapDispense)
                .collect(Collectors.toList());
    }

    // ✅ MAPPERS
    private InventoryItemDTO mapInventory(InventoryItem item) {
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setInventoryId(item.getInventoryId());
        dto.setMedId(item.getMedId());
        dto.setMedicationName(item.getMedicationName());
        dto.setBatchNumber(item.getBatchNumber());
        dto.setQuantity(item.getQuantity());
        dto.setUnit(item.getUnit());
        dto.setExpiryDate(item.getExpiryDate());
        dto.setLocation(item.getLocation());
        dto.setCostPrice(item.getCostPrice());
        dto.setStatus(item.getStatus());
        return dto;
    }

    private DispenseResponseDTO mapDispense(DispenseRecord r) {
        DispenseResponseDTO dto = new DispenseResponseDTO();
        dto.setDispenseId(r.getDispenseId());
        dto.setRxId(r.getRxId());
        dto.setInventoryId(r.getInventoryId());
        dto.setPatientId(r.getPatientId());
        dto.setMedicationName(r.getMedicationName());
        dto.setQuantity(r.getQuantity());
        dto.setUnit(r.getUnit());
        dto.setRemainingStock(r.getRemainingStock());
        dto.setUnitCost(r.getUnitCost());
        dto.setTotalCost(r.getTotalCost());
        dto.setDispensedAt(r.getDispensedAt());
        dto.setStatus(r.getStatus());
        return dto;
    }
}
