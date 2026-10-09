# Encounter Module API Documentation

## Base URL
```
http://localhost:8081/encounter-service
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer {token}
```

---

## Encounter Management APIs

### 1. Create Encounter
**Endpoint:** `POST /api/encounters`

**Request:**
```json
{
  "patientId": 1,
  "clinicianId": 5,
  "visitType": "Consultation",
  "chiefComplaint": "Headache and fever for 3 days",
  "vitals": {
    "bloodPressure": "120/80",
    "temperature": "37.5",
    "pulse": "72",
    "respiratoryRate": "16"
  },
  "notes": {
    "subjective": "Patient reports intermittent headache",
    "objective": "Vital signs stable",
    "assessment": "Common viral infection",
    "plan": "Rest and hydration"
  },
  "startAt": "2026-05-10T10:00:00"
}
```

**Response:** `201 Created`
```json
{
  "encounterId": 1,
  "patientId": 1,
  "clinicianId": 5,
  "visitType": "Consultation",
  "chiefComplaint": "Headache and fever for 3 days",
  "vitals": {...},
  "notes": {...},
  "status": "IN_PROGRESS",
  "startAt": "2026-05-10T10:00:00",
  "createdAt": "2026-05-10T10:00:00",
  "updatedAt": "2026-05-10T10:00:00"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

---

### 2. Get Encounter
**Endpoint:** `GET /api/encounters/{encounterId}`

**Path Parameters:**
- `encounterId` (Long): ID of the encounter to retrieve

**Response:** `200 OK`
```json
{
  "encounterId": 1,
  "patientId": 1,
  "clinicianId": 5,
  ...
}
```

**Error Responses:**
- `404 Not Found`: Encounter not found
- `401 Unauthorized`: Invalid token

---

### 3. Get Patient Encounters
**Endpoint:** `GET /api/encounters/patient/{patientId}`

**Path Parameters:**
- `patientId` (Long): ID of the patient

**Response:** `200 OK`
```json
[
  {
    "encounterId": 1,
    "patientId": 1,
    ...
  },
  {
    "encounterId": 2,
    "patientId": 1,
    ...
  }
]
```

---

### 4. Get Encounters by Date Range
**Endpoint:** `GET /api/encounters/patient/{patientId}/range`

**Path Parameters:**
- `patientId` (Long): ID of the patient

**Query Parameters:**
- `start` (LocalDateTime, required): Start date-time (ISO format)
- `end` (LocalDateTime, required): End date-time (ISO format)

**Example:**
```
GET /api/encounters/patient/1/range?start=2026-05-01T00:00:00&end=2026-05-31T23:59:59
```

**Response:** `200 OK`
```json
[
  {
    "encounterId": 1,
    "patientId": 1,
    "startAt": "2026-05-10T10:00:00",
    ...
  }
]
```

---

### 5. Get Clinician Encounters by Status
**Endpoint:** `GET /api/encounters/clinician/{clinicianId}/status/{status}`

**Path Parameters:**
- `clinicianId` (Long): ID of the clinician
- `status` (String): Encounter status (IN_PROGRESS, COMPLETED, SIGNED, CANCELLED)

**Example:**
```
GET /api/encounters/clinician/5/status/IN_PROGRESS
```

**Response:** `200 OK`
```json
[
  {
    "encounterId": 1,
    "clinicianId": 5,
    "status": "IN_PROGRESS",
    ...
  }
]
```

---

### 6. Update Encounter
**Endpoint:** `PUT /api/encounters/{encounterId}`

**Path Parameters:**
- `encounterId` (Long): ID of the encounter to update

**Request:**
```json
{
  "chiefComplaint": "Updated chief complaint",
  "notes": {
    "subjective": "Updated subjective findings"
  },
  "diagnoses": {
    "icd10": ["I10"],
    "description": "Essential hypertension"
  }
}
```

**Response:** `200 OK`
```json
{
  "encounterId": 1,
  ...
  "updatedAt": "2026-05-10T10:30:00"
}
```

**Error Responses:**
- `404 Not Found`: Encounter not found
- `400 Bad Request`: Cannot update signed encounter

---

### 7. Complete Encounter
**Endpoint:** `POST /api/encounters/{encounterId}/complete`

**Path Parameters:**
- `encounterId` (Long): ID of the encounter to complete

**Response:** `200 OK`
```json
{
  "encounterId": 1,
  "status": "COMPLETED",
  "endAt": "2026-05-10T11:00:00",
  "updatedAt": "2026-05-10T11:00:00"
}
```

**Error Responses:**
- `404 Not Found`: Encounter not found
- `400 Bad Request`: Encounter not in IN_PROGRESS status

---

### 8. Sign Encounter
**Endpoint:** `POST /api/encounters/{encounterId}/sign`

**Path Parameters:**
- `encounterId` (Long): ID of the encounter to sign

**Query Parameters:**
- `clinicianId` (Long, required): ID of clinician signing

**Example:**
```
POST /api/encounters/1/sign?clinicianId=5
```

**Response:** `200 OK`
```json
{
  "encounterId": 1,
  "status": "SIGNED",
  "signedBy": 5,
  "signedAt": "2026-05-10T11:30:00"
}
```

**Error Responses:**
- `404 Not Found`: Encounter not found
- `400 Bad Request`: Encounter not in COMPLETED status

---

### 9. Cancel Encounter
**Endpoint:** `POST /api/encounters/{encounterId}/cancel`

**Path Parameters:**
- `encounterId` (Long): ID of the encounter to cancel

**Response:** `200 OK`
```json
{
  "encounterId": 1,
  "status": "CANCELLED"
}
```

**Error Responses:**
- `404 Not Found`: Encounter not found
- `400 Bad Request`: Cannot cancel signed encounter

---

### 10. Add Diagnosis to Encounter
**Endpoint:** `POST /api/encounters/{encounterId}/diagnosis`

**Path Parameters:**
- `encounterId` (Long): ID of the encounter

**Request:**
```json
{
  "icd10": ["I10", "E11"],
  "description": "Essential hypertension and Type 2 diabetes"
}
```

**Response:** `200 OK`
```json
{
  "encounterId": 1,
  "diagnoses": {
    "icd10": ["I10", "E11"],
    "description": "Essential hypertension and Type 2 diabetes"
  }
}
```

---

### 11. Add Vitals to Encounter
**Endpoint:** `POST /api/encounters/{encounterId}/vitals`

**Path Parameters:**
- `encounterId` (Long): ID of the encounter

**Request:**
```json
{
  "bloodPressure": "130/85",
  "temperature": "36.8",
  "pulse": "75",
  "respiratoryRate": "18",
  "oxygenSaturation": "99%"
}
```

**Response:** `200 OK`
```json
{
  "encounterId": 1,
  "vitals": {
    "bloodPressure": "130/85",
    "temperature": "36.8",
    "pulse": "75",
    "respiratoryRate": "18",
    "oxygenSaturation": "99%"
  }
}
```

---

### 12. Check Active Encounters
**Endpoint:** `GET /api/encounters/patient/{patientId}/active`

**Path Parameters:**
- `patientId` (Long): ID of the patient

**Response:** `200 OK`
```json
true
```

Returns boolean indicating if patient has any active (IN_PROGRESS or COMPLETED) encounters.

---

## Problem List APIs

### 1. Add Problem
**Endpoint:** `POST /api/problem-list`

**Request:**
```json
{
  "patientId": 1,
  "encounterId": 1,
  "code": "I10",
  "description": "Essential hypertension",
  "onsetDate": "2024-01-15",
  "icdCode": "I10"
}
```

**Response:** `201 Created`
```json
{
  "problemId": 1,
  "patientId": 1,
  "encounterId": 1,
  "code": "I10",
  "description": "Essential hypertension",
  "status": "ACTIVE",
  "icdCode": "I10",
  "onsetDate": "2024-01-15",
  "createdAt": "2026-05-10T10:00:00"
}
```

---

### 2. Get Problem
**Endpoint:** `GET /api/problem-list/{problemId}`

**Path Parameters:**
- `problemId` (Long): ID of the problem

**Response:** `200 OK`
```json
{
  "problemId": 1,
  ...
}
```

---

### 3. Get Patient Problems
**Endpoint:** `GET /api/problem-list/patient/{patientId}`

**Path Parameters:**
- `patientId` (Long): ID of the patient

**Response:** `200 OK`
```json
[
  {
    "problemId": 1,
    "patientId": 1,
    "code": "I10",
    "status": "ACTIVE",
    ...
  },
  {
    "problemId": 2,
    "patientId": 1,
    "code": "E11",
    "status": "ACTIVE",
    ...
  }
]
```

---

### 4. Get Active Problems
**Endpoint:** `GET /api/problem-list/patient/{patientId}/active`

**Path Parameters:**
- `patientId` (Long): ID of the patient

**Response:** `200 OK`

Returns only problems with ACTIVE status.

---

### 5. Get Encounter Problems
**Endpoint:** `GET /api/problem-list/encounter/{encounterId}`

**Path Parameters:**
- `encounterId` (Long): ID of the encounter

**Response:** `200 OK`
```json
[
  {
    "problemId": 1,
    "encounterId": 1,
    ...
  }
]
```

---

### 6. Get Problems by Status
**Endpoint:** `GET /api/problem-list/patient/{patientId}/status/{status}`

**Path Parameters:**
- `patientId` (Long): ID of the patient
- `status` (String): Problem status (ACTIVE, INACTIVE, RESOLVED)

**Example:**
```
GET /api/problem-list/patient/1/status/RESOLVED
```

**Response:** `200 OK`

---

### 7. Update Problem
**Endpoint:** `PUT /api/problem-list/{problemId}`

**Path Parameters:**
- `problemId` (Long): ID of the problem

**Request:**
```json
{
  "description": "Essential hypertension - controlled",
  "status": "ACTIVE"
}
```

**Response:** `200 OK`
```json
{
  "problemId": 1,
  "description": "Essential hypertension - controlled",
  "status": "ACTIVE",
  "updatedAt": "2026-05-10T11:00:00"
}
```

---

### 8. Resolve Problem
**Endpoint:** `POST /api/problem-list/{problemId}/resolve`

**Path Parameters:**
- `problemId` (Long): ID of the problem

**Response:** `200 OK`
```json
{
  "problemId": 1,
  "status": "RESOLVED"
}
```

---

## Health Check Endpoint

**Endpoint:** `GET /encounter-service/health`

**Response:** `200 OK`
```json
{
  "status": "UP"
}
```

---

## Status Codes Summary

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or invalid state |
| 401 | Unauthorized - Missing/invalid authentication |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Common Error Responses

### Encounter Not Found
```json
{
  "timestamp": "2026-05-10T10:30:00",
  "status": 404,
  "error": "Encounter Not Found",
  "message": "Encounter not found: 999"
}
```

### Invalid State
```json
{
  "timestamp": "2026-05-10T10:30:00",
  "status": 400,
  "error": "Invalid Encounter State",
  "message": "Cannot update a signed encounter"
}
```

### Internal Error
```json
{
  "timestamp": "2026-05-10T10:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting
- Default: 100 requests per minute per IP
- Contact support for higher limits

## Versioning
Current API Version: v1
