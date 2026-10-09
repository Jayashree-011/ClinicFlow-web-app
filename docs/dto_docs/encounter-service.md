# encounter-service — DTOs

Package: `com.clinicflow.Encounter.dto`

All endpoints return responses wrapped in `ApiResponse<T>`.

---

## ApiResponse\<T\>

**Direction:** Response wrapper (all endpoints)

| Field | Type | Notes |
|-------|------|-------|
| `success` | `boolean` | |
| `message` | `String` | |
| `data` | `T` | The actual payload |
| `error` | `String` | Populated on failure |

---

## EncounterCreateRequest

**Direction:** Request body  
**Endpoint:** `POST /encounter`

| Field | Type | Notes |
|-------|------|-------|
| `patientId` | `Long` | |
| `clinicianId` | `Long` | |
| `visitType` | `String` | |
| `chiefComplaint` | `String` | |
| `vitals` | `JsonNode` | Flexible JSON (e.g. `{ "bp": "120/80", "temp": 37 }`) |
| `notes` | `JsonNode` | Flexible JSON |
| `startAt` | `LocalDateTime` | |

---

## EncounterUpdateRequest

**Direction:** Request body  
**Endpoint:** `PUT /encounter/:id`

| Field | Type | Notes |
|-------|------|-------|
| `chiefComplaint` | `String` | |
| `vitals` | `Object` | |
| `notes` | `Object` | |
| `diagnoses` | `Object` | |
| `orders` | `Object` | |
| `prescriptions` | `Object` | |

---

## EncounterDTO

**Direction:** Response body  
**Endpoint:** `GET /encounter/patient/:patientId`

| Field | Type | Notes |
|-------|------|-------|
| `encounterId` | `Long` | |
| `patientId` | `Long` | |
| `clinicianId` | `Long` | |
| `visitType` | `String` | |
| `chiefComplaint` | `String` | |
| `vitals` | `JsonNode` | |
| `notes` | `JsonNode` | |
| `diagnoses` | `JsonNode` | |
| `orders` | `JsonNode` | |
| `prescriptions` | `JsonNode` | |
| `startAt` | `LocalDateTime` | |
| `endAt` | `LocalDateTime` | |
| `status` | `EncounterStatus` | Enum |
| `signedBy` | `Long` | Clinician ID who signed |
| `signedAt` | `LocalDateTime` | |
| `createdAt` | `LocalDateTime` | |
| `updatedAt` | `LocalDateTime` | |

---

## ProblemListCreateRequest

**Direction:** Request body  
**Endpoint:** `POST /encounter/problems`

| Field | Type | Notes |
|-------|------|-------|
| `patientId` | `Long` | |
| `encounterId` | `Long` | |
| `code` | `String` | Internal code |
| `description` | `String` | |
| `onsetDate` | `LocalDate` | |
| `icdCode` | `String` | ICD-10 diagnosis code |

---

## ProblemListDTO

**Direction:** Response body

| Field | Type | Notes |
|-------|------|-------|
| `problemId` | `Long` | |
| `patientId` | `Long` | |
| `encounterId` | `Long` | |
| `code` | `String` | |
| `description` | `String` | |
| `onsetDate` | `LocalDate` | |
| `status` | `ProblemStatus` | Enum |
| `icdCode` | `String` | |
| `createdAt` | `LocalDateTime` | |
| `updatedAt` | `LocalDateTime` | |
