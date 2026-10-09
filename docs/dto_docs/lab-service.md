# lab-service — DTOs

Package: `com.clinicflow.lab.dto`

---

## LabOrderDTO

**Direction:** Request / Response

| Field | Type | Notes |
|-------|------|-------|
| `labOrderId` | `Long` | Response only |
| `encounterId` | `Long` | |
| `patientId` | `Long` | |
| `orderedBy` | `Long` | Clinician user ID |
| `testsJson` | `String` | JSON-encoded list of ordered test codes |
| `sampleId` | `String` | Lab sample identifier |
| `collectedAt` | `LocalDateTime` | |
| `status` | `String` | |
| `resultUri` | `String` | URI to the result document |

---

## LabResultDTO

**Direction:** Request / Response

| Field | Type | Notes |
|-------|------|-------|
| `resultId` | `Long` | Response only |
| `labOrderId` | `Long` | |
| `testCode` | `String` | Identifies the specific test |
| `resultValue` | `String` | |
| `units` | `String` | e.g. `"mg/dL"` |
| `referenceRangeJson` | `String` | JSON-encoded normal range |
| `flag` | `LabResult.Flag` | Enum: e.g. `HIGH`, `LOW`, `NORMAL` |
| `reportedAt` | `LocalDateTime` | |
| `reportedBy` | `Long` | Clinician/lab technician user ID |
