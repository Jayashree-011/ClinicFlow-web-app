# pharmacy-service — DTOs

Package: `com.clinicflow.pharmacy.dto`

---

## InventoryItemDTO

**Direction:** Request / Response  
**Endpoints:** `GET /pharmacy/inventory`, `POST /pharmacy/inventory`, `PUT /pharmacy/inventory/:id`

| Field | Type | Notes |
|-------|------|-------|
| `inventoryId` | `Long` | Response only |
| `medId` | `Long` | Medication master ID |
| `medicationName` | `String` | |
| `batchNumber` | `String` | |
| `quantity` | `Integer` | Current stock count |
| `unit` | `String` | e.g. `"tablets"`, `"ml"` |
| `expiryDate` | `LocalDate` | Format: `yyyy-MM-dd` |
| `location` | `String` | Storage location in pharmacy |
| `costPrice` | `BigDecimal` | |
| `status` | `String` | e.g. `"AVAILABLE"`, `"EXPIRED"` |

---

## DispenseRequestDTO

**Direction:** Request body  
**Endpoint:** `POST /pharmacy/dispense`

| Field | Type | Notes |
|-------|------|-------|
| `rxId` | `Long` | Prescription ID from prescription-service |
| `inventoryId` | `Long` | Stock item being dispensed |
| `patientId` | `Long` | |
| `dispensedBy` | `Long` | Pharmacist user ID |
| `quantity` | `Integer` | Units to dispense |
| `notes` | `String` | |

---

## DispenseResponseDTO

**Direction:** Response body  
**Endpoints:** `POST /pharmacy/dispense`, `GET /pharmacy/dispense/history/:patientId`

| Field | Type | Notes |
|-------|------|-------|
| `dispenseId` | `Long` | |
| `rxId` | `Long` | |
| `inventoryId` | `Long` | |
| `patientId` | `Long` | |
| `medicationName` | `String` | |
| `quantity` | `Integer` | |
| `dispensedAt` | `LocalDateTime` | Format: `yyyy-MM-dd HH:mm:ss` |
| `status` | `String` | |
