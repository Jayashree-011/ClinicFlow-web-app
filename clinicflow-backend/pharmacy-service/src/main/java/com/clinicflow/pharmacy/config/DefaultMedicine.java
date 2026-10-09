package com.clinicflow.pharmacy.config;

import com.clinicflow.pharmacy.entity.InventoryItem;
import com.clinicflow.pharmacy.repository.InventoryItemRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DefaultMedicine {

    private static final int LOW_STOCK_THRESHOLD = 20;

    private final InventoryItemRepository inventoryRepo;

    public DefaultMedicine(InventoryItemRepository inventoryRepo) {
        this.inventoryRepo = inventoryRepo;
    }

    private void seed(Long medId, String name, String batch,
                      int qty, String unit, LocalDate expiry,
                      String location, BigDecimal costPrice) {

        if (!inventoryRepo.findByMedId(medId).isEmpty()) {
            System.out.println("⏭️ Medicine already in DB: " + name);
            return;
        }

        InventoryItem item = new InventoryItem();
        item.setMedId(medId);
        item.setMedicationName(name);
        item.setBatchNumber(batch);
        item.setQuantity(qty);
        item.setUnit(unit);
        item.setExpiryDate(expiry);
        item.setLocation(location);
        item.setCostPrice(costPrice);
        item.setStatus(deriveStatus(qty));

        inventoryRepo.save(item);
        System.out.println("✅ Default medicine seeded: " + name);
    }

    private String deriveStatus(int qty) {
        if (qty <= 0)                  return "OUT_OF_STOCK";
        if (qty <= LOW_STOCK_THRESHOLD) return "LOW_STOCK";
        return "ACTIVE";
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedDefaultMedicines() {
        // ── Antibiotics ─────────────────────────────────────────────────────────
        seed(1L,  "Amoxicillin 500mg",       "AMX-2025-001", 500, "Tablets",  LocalDate.of(2027, 6,  1),  "Shelf A-1", new BigDecimal("0.15"));
        seed(2L,  "Metronidazole 400mg",     "MET-2025-001", 300, "Tablets",  LocalDate.of(2027, 3,  1),  "Shelf A-2", new BigDecimal("0.10"));
        seed(3L,  "Azithromycin 250mg",      "AZI-2025-001", 200, "Tablets",  LocalDate.of(2027, 9,  1),  "Shelf A-3", new BigDecimal("0.50"));

        // ── Analgesics & Anti-inflammatory ──────────────────────────────────────
        seed(4L,  "Paracetamol 500mg",       "PCM-2025-001", 800, "Tablets",  LocalDate.of(2028, 1,  1),  "Shelf B-1", new BigDecimal("0.05"));
        seed(5L,  "Ibuprofen 400mg",         "IBU-2025-001", 600, "Tablets",  LocalDate.of(2027, 11, 1),  "Shelf B-2", new BigDecimal("0.08"));
        seed(6L,  "Diclofenac 50mg",         "DCL-2025-001", 250, "Tablets",  LocalDate.of(2027, 8,  1),  "Shelf B-3", new BigDecimal("0.12"));

        // ── Cardiovascular ──────────────────────────────────────────────────────
        seed(7L,  "Amlodipine 5mg",          "AML-2025-001", 400, "Tablets",  LocalDate.of(2027, 12, 1),  "Shelf C-1", new BigDecimal("0.20"));
        seed(8L,  "Atorvastatin 10mg",       "ATV-2025-001", 350, "Tablets",  LocalDate.of(2027, 10, 1),  "Shelf C-2", new BigDecimal("0.25"));
        seed(9L,  "Metoprolol 50mg",         "MTP-2025-001", 300, "Tablets",  LocalDate.of(2027, 7,  1),  "Shelf C-3", new BigDecimal("0.18"));

        // ── Antidiabetic ────────────────────────────────────────────────────────
        seed(10L, "Metformin 500mg",         "MTF-2025-001", 500, "Tablets",  LocalDate.of(2027, 5,  1),  "Shelf D-1", new BigDecimal("0.10"));
        seed(11L, "Glibenclamide 5mg",       "GLB-2025-001", 200, "Tablets",  LocalDate.of(2027, 4,  1),  "Shelf D-2", new BigDecimal("0.15"));

        // ── Gastrointestinal ────────────────────────────────────────────────────
        seed(12L, "Omeprazole 20mg",         "OMP-2025-001", 400, "Capsules", LocalDate.of(2027, 6,  1),  "Shelf E-1", new BigDecimal("0.22"));
        seed(13L, "Domperidone 10mg",        "DMP-2025-001", 300, "Tablets",  LocalDate.of(2027, 9,  1),  "Shelf E-2", new BigDecimal("0.12"));

        // ── Respiratory ─────────────────────────────────────────────────────────
        seed(14L, "Salbutamol Inhaler 100mcg", "SAL-2025-001", 100, "Inhalers", LocalDate.of(2026, 12, 1), "Shelf F-1", new BigDecimal("3.50"));
        seed(15L, "Cetirizine 10mg",          "CTZ-2025-001", 350, "Tablets",  LocalDate.of(2028, 2,  1),  "Shelf F-2", new BigDecimal("0.08"));

        // ── Vitamins & Supplements ───────────────────────────────────────────────
        seed(16L, "Vitamin C 500mg",          "VTC-2025-001", 500, "Tablets",  LocalDate.of(2028, 6,  1),  "Shelf G-1", new BigDecimal("0.05"));
        seed(17L, "Vitamin D3 1000IU",        "VTD-2025-001", 400, "Capsules", LocalDate.of(2028, 6,  1),  "Shelf G-2", new BigDecimal("0.10"));
        seed(18L, "Ferrous Sulfate 200mg",    "FES-2025-001", 300, "Tablets",  LocalDate.of(2027, 8,  1),  "Shelf G-3", new BigDecimal("0.07"));
    }
}
