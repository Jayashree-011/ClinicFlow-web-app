package com.clinicflow.pharmacy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import com.clinicflow.pharmacy.entity.InventoryItem;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByMedId(Long medId);

    List<InventoryItem> findByStatus(String status);

    /** Hard-delete a single row by primary key — bypasses soft-delete */
    @Modifying
    @Transactional
    @Query("DELETE FROM InventoryItem i WHERE i.inventoryId = :id")
    void hardDeleteById(Long id);

    /** Hard-delete every row whose status equals the given value */
    @Modifying
    @Transactional
    @Query("DELETE FROM InventoryItem i WHERE i.status = :status")
    int hardDeleteByStatus(String status);
}