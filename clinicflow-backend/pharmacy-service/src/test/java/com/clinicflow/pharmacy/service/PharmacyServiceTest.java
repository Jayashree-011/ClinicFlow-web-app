package com.clinicflow.pharmacy.service;

import com.clinicflow.pharmacy.dto.DispenseRequestDTO;
import com.clinicflow.pharmacy.dto.DispenseResponseDTO;
import com.clinicflow.pharmacy.dto.InventoryItemDTO;
import com.clinicflow.pharmacy.entity.DispenseRecord;
import com.clinicflow.pharmacy.entity.InventoryItem;
import com.clinicflow.pharmacy.repository.DispenseRecordRepository;
import com.clinicflow.pharmacy.repository.InventoryItemRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PharmacyService Unit Tests")
class PharmacyServiceTest {

    @Mock private InventoryItemRepository  inventoryRepo;
    @Mock private DispenseRecordRepository dispenseRepo;
    @InjectMocks private PharmacyService pharmacyService;

    // ─── addStock ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("addStock: creates new inventory item when medId not found")
    void addStock_whenNewMedId_createsNewItem() {
        InventoryItemDTO dto = buildInventoryDTO(null, 1L, "Aspirin", "ASP-001", 100, "Tablets", "ACTIVE");
        when(inventoryRepo.findByMedId(1L)).thenReturn(List.of());
        when(inventoryRepo.save(any(InventoryItem.class))).thenAnswer(inv -> {
            InventoryItem item = inv.getArgument(0);
            item.setInventoryId(10L);
            return item;
        });

        InventoryItemDTO result = pharmacyService.addStock(dto);

        assertThat(result.getMedicationName()).isEqualTo("Aspirin");
        assertThat(result.getQuantity()).isEqualTo(100);
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        verify(inventoryRepo).save(any(InventoryItem.class));
    }

    @Test
    @DisplayName("addStock: restocks existing item by adding quantities")
    void addStock_whenExistingItem_addsQuantity() {
        InventoryItem existing = buildInventoryItem(10L, 1L, "Aspirin", 50, "ACTIVE");
        when(inventoryRepo.findByMedId(1L)).thenReturn(List.of(existing));
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemDTO dto = buildInventoryDTO(null, 1L, "Aspirin", "ASP-002", 30, "Tablets", "ACTIVE");
        InventoryItemDTO result = pharmacyService.addStock(dto);

        assertThat(result.getQuantity()).isEqualTo(80); // 50 + 30
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("addStock: derives LOW_STOCK status when quantity is at threshold")
    void addStock_whenQuantityAtThreshold_setsLowStock() {
        InventoryItemDTO dto = buildInventoryDTO(null, 2L, "Panadol", "PAN-001", 20, "Tablets", "ACTIVE");
        when(inventoryRepo.findByMedId(2L)).thenReturn(List.of());
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemDTO result = pharmacyService.addStock(dto);

        assertThat(result.getStatus()).isEqualTo("LOW_STOCK");
    }

    @Test
    @DisplayName("addStock: derives OUT_OF_STOCK when quantity is zero")
    void addStock_whenQuantityZero_setsOutOfStock() {
        InventoryItemDTO dto = buildInventoryDTO(null, 3L, "Tablets X", "TX-001", 0, "Tablets", "ACTIVE");
        when(inventoryRepo.findByMedId(3L)).thenReturn(List.of());
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemDTO result = pharmacyService.addStock(dto);

        assertThat(result.getStatus()).isEqualTo("OUT_OF_STOCK");
    }

    @Test
    @DisplayName("addStock: preserves EXPIRED status (sticky)")
    void addStock_whenExpiredItem_skipsExpiredForRestock() {
        // EXPIRED items are filtered out in the upsert check, so a new entry is created
        InventoryItem expired = buildInventoryItem(10L, 1L, "Aspirin", 5, "EXPIRED");
        InventoryItemDTO dto  = buildInventoryDTO(null, 1L, "Aspirin", "ASP-002", 50, "Tablets", "ACTIVE");

        when(inventoryRepo.findByMedId(1L)).thenReturn(List.of(expired));
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemDTO result = pharmacyService.addStock(dto);

        // Expired item is excluded → new item created
        assertThat(result.getQuantity()).isEqualTo(50);
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
    }

    // ─── getAllInventory ──────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllInventory: returns all items mapped to DTOs")
    void getAllInventory_returnsMappedList() {
        List<InventoryItem> items = List.of(
                buildInventoryItem(1L, 1L, "Aspirin", 100, "ACTIVE"),
                buildInventoryItem(2L, 2L, "Panadol", 15, "LOW_STOCK"));
        when(inventoryRepo.findAll()).thenReturn(items);

        List<InventoryItemDTO> result = pharmacyService.getAllInventory();

        assertThat(result).hasSize(2);
    }

    // ─── getInventoryById ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getInventoryById: returns DTO when item found")
    void getInventoryById_whenFound_returnsDTO() {
        InventoryItem item = buildInventoryItem(1L, 1L, "Aspirin", 100, "ACTIVE");
        when(inventoryRepo.findById(1L)).thenReturn(Optional.of(item));

        InventoryItemDTO result = pharmacyService.getInventoryById(1L);

        assertThat(result.getInventoryId()).isEqualTo(1L);
        assertThat(result.getMedicationName()).isEqualTo("Aspirin");
    }

    @Test
    @DisplayName("getInventoryById: throws NoSuchElementException when not found")
    void getInventoryById_whenNotFound_throwsNoSuchElement() {
        when(inventoryRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pharmacyService.getInventoryById(99L))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("99");
    }

    // ─── update ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update: updates inventory item fields")
    void update_whenFound_updatesFields() {
        InventoryItem existing = buildInventoryItem(1L, 1L, "Aspirin", 100, "ACTIVE");
        when(inventoryRepo.findById(1L)).thenReturn(Optional.of(existing));
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemDTO dto = buildInventoryDTO(1L, 1L, "Aspirin", "ASP-002", 250, "Tablets", "ACTIVE");
        dto.setCostPrice(new BigDecimal("0.15"));

        InventoryItemDTO result = pharmacyService.update(1L, dto);

        assertThat(result.getQuantity()).isEqualTo(250);
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("update: throws NoSuchElementException when item not found")
    void update_whenNotFound_throws() {
        when(inventoryRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pharmacyService.update(99L, new InventoryItemDTO()))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ─── delete (soft) ────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete: sets status to REMOVED (soft delete)")
    void delete_setsRemovedStatus() {
        InventoryItem item = buildInventoryItem(1L, 1L, "Aspirin", 100, "ACTIVE");
        when(inventoryRepo.findById(1L)).thenReturn(Optional.of(item));
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemDTO result = pharmacyService.delete(1L);

        assertThat(result.getStatus()).isEqualTo("REMOVED");
    }

    @Test
    @DisplayName("delete: throws NoSuchElementException when item not found")
    void delete_whenNotFound_throws() {
        when(inventoryRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pharmacyService.delete(99L))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ─── hardDelete ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("hardDelete: permanently removes item when found")
    void hardDelete_whenFound_deletesFromDb() {
        when(inventoryRepo.existsById(1L)).thenReturn(true);
        doNothing().when(inventoryRepo).hardDeleteById(1L);

        pharmacyService.hardDelete(1L);

        verify(inventoryRepo).hardDeleteById(1L);
    }

    @Test
    @DisplayName("hardDelete: throws NoSuchElementException when item not found")
    void hardDelete_whenNotFound_throws() {
        when(inventoryRepo.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> pharmacyService.hardDelete(99L))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("99");
    }

    // ─── purgeRemoved ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("purgeRemoved: permanently deletes all REMOVED items and returns count")
    void purgeRemoved_deletesAndReturnsCount() {
        when(inventoryRepo.hardDeleteByStatus("REMOVED")).thenReturn(3);

        int count = pharmacyService.purgeRemoved();

        assertThat(count).isEqualTo(3);
        verify(inventoryRepo).hardDeleteByStatus("REMOVED");
    }

    // ─── dispense ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("dispense: deducts stock and creates dispense record")
    void dispense_happyPath_deductsStockAndSavesRecord() {
        InventoryItem item = buildInventoryItem(1L, 1L, "Aspirin", 100, "ACTIVE");
        item.setCostPrice(new BigDecimal("0.10"));
        item.setUnit("Tablets");

        DispenseRecord savedRecord = new DispenseRecord();
        savedRecord.setDispenseId(5L);
        savedRecord.setMedicationName("Aspirin");
        savedRecord.setQuantity(10);
        savedRecord.setRemainingStock(90);
        savedRecord.setUnit("Tablets");
        savedRecord.setStatus("DISPENSED");

        when(inventoryRepo.findById(1L)).thenReturn(Optional.of(item));
        when(inventoryRepo.save(any())).thenReturn(item);
        when(dispenseRepo.save(any(DispenseRecord.class))).thenReturn(savedRecord);

        DispenseRequestDTO dto = buildDispenseRequest(1L, 10, 20L, null);
        DispenseResponseDTO result = pharmacyService.dispense(dto);

        assertThat(result.getDispenseId()).isEqualTo(5L);
        assertThat(result.getStatus()).isEqualTo("DISPENSED");
        // Stock should have been deducted
        verify(inventoryRepo).save(argThat(i -> i.getQuantity() == 90));
    }

    @Test
    @DisplayName("dispense: throws IllegalStateException when stock is zero")
    void dispense_whenOutOfStock_throwsIllegalState() {
        InventoryItem item = buildInventoryItem(1L, 1L, "Aspirin", 0, "OUT_OF_STOCK");
        when(inventoryRepo.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> pharmacyService.dispense(buildDispenseRequest(1L, 10, 20L, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("out of stock");
    }

    @Test
    @DisplayName("dispense: throws IllegalStateException when requested quantity exceeds stock")
    void dispense_whenOverDispense_throwsIllegalState() {
        InventoryItem item = buildInventoryItem(1L, 1L, "Aspirin", 5, "LOW_STOCK");
        when(inventoryRepo.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> pharmacyService.dispense(buildDispenseRequest(1L, 10, 20L, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Requested 10 but only 5");
    }

    @Test
    @DisplayName("dispense: throws NoSuchElementException when inventory item not found")
    void dispense_whenInventoryNotFound_throwsNoSuchElement() {
        when(inventoryRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pharmacyService.dispense(buildDispenseRequest(99L, 5, 20L, null)))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("dispense: sets LOW_STOCK status when remaining stock hits threshold")
    void dispense_whenRemainingStockLow_setsLowStock() {
        InventoryItem item = buildInventoryItem(1L, 1L, "Aspirin", 25, "ACTIVE");
        item.setCostPrice(new BigDecimal("0.10"));
        item.setUnit("Tablets");

        DispenseRecord saved = new DispenseRecord();
        saved.setDispenseId(1L);
        saved.setStatus("DISPENSED");
        saved.setMedicationName("Aspirin");
        saved.setUnit("Tablets");

        when(inventoryRepo.findById(1L)).thenReturn(Optional.of(item));
        when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(dispenseRepo.save(any())).thenReturn(saved);

        // Dispense 10, leaving 15 (at LOW_STOCK threshold)
        pharmacyService.dispense(buildDispenseRequest(1L, 10, 20L, null));

        verify(inventoryRepo).save(argThat(i -> "LOW_STOCK".equals(i.getStatus())));
    }

    // ─── history ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("history: returns dispense history for patient")
    void history_returnsDispenseRecordsForPatient() {
        DispenseRecord record = new DispenseRecord();
        record.setDispenseId(1L);
        record.setPatientId(20L);
        record.setMedicationName("Aspirin");
        record.setQuantity(10);
        record.setStatus("DISPENSED");

        when(dispenseRepo.findByPatientId(20L)).thenReturn(List.of(record));

        List<DispenseResponseDTO> result = pharmacyService.history(20L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPatientId()).isEqualTo(20L);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private InventoryItem buildInventoryItem(Long id, Long medId, String name,
                                             int qty, String status) {
        InventoryItem item = new InventoryItem();
        item.setInventoryId(id);
        item.setMedId(medId);
        item.setMedicationName(name);
        item.setQuantity(qty);
        item.setUnit("Tablets");
        item.setStatus(status);
        item.setBatchNumber("BATCH-001");
        item.setExpiryDate(LocalDate.now().plusYears(1));
        item.setCostPrice(new BigDecimal("0.10"));
        return item;
    }

    private InventoryItemDTO buildInventoryDTO(Long inventoryId, Long medId, String name,
                                               String batch, int qty, String unit, String status) {
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setInventoryId(inventoryId);
        dto.setMedId(medId);
        dto.setMedicationName(name);
        dto.setBatchNumber(batch);
        dto.setQuantity(qty);
        dto.setUnit(unit);
        dto.setStatus(status);
        dto.setCostPrice(new BigDecimal("0.10"));
        return dto;
    }

    private DispenseRequestDTO buildDispenseRequest(Long inventoryId, int qty,
                                                     Long patientId, Long rxId) {
        DispenseRequestDTO dto = new DispenseRequestDTO();
        dto.setInventoryId(inventoryId);
        dto.setQuantity(qty);
        dto.setPatientId(patientId);
        dto.setRxId(rxId);
        dto.setDispensedBy(99L);
        return dto;
    }
}
