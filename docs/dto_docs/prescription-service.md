# prescription-service — DTOs

Package: `com.example.prescription.dto`

---

## PrescriptionRequestDTO

**Direction:** Request body  
**Endpoint:** `POST /prescriptions`

| Field | Type | Notes |
|-------|------|-------|
| `encounterId` | `Long` | |
| `patientId` | `Long` | |
| `clinicianId` | `Long` | |
| `medId` | `Long` | Medication master ID |
| `medicationName` | `String` | |
| `dosage` | `String` | e.g. `"500mg"` |
| `frequency` | `String` | e.g. `"twice daily"` |
| `durationDays` | `Integer` | |
| `quantity` | `Integer` | Total units to dispense |
| `repeats` | `Integer` | Number of refills allowed |
| `route` | `String` | e.g. `"oral"`, `"IV"` |
| `notes` | `String` | |

---

## PrescriptionResponseDTO

**Direction:** Response body  
**Endpoints:** `GET /prescriptions/:id`, `GET /prescriptions/patient/:patientId`, `PUT /prescriptions/:id/issue`

| Field | Type | Notes |
|-------|------|-------|
| `rxId` | `Long` | Prescription ID — used as `rxId` in pharmacy dispense requests |
| `encounterId` | `Long` | |
| `patientId` | `Long` | |
| `clinicianId` | `Long` | |
| `medId` | `Long` | |
| `medicationName` | `String` | |
| `dosage` | `String` | |
| `frequency` | `String` | |
| `quantity` | `Integer` | |
| `status` | `String` | e.g. `"DRAFT"`, `"ISSUED"`, `"CANCELLED"` |
| `issuedAt` | `LocalDateTime` | Format: `yyyy-MM-dd HH:mm:ss`; null until issued |
