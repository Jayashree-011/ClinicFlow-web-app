# consultation-service — DTOs

Package: `com.clinicflow.consultation.dto`

---

## PatientDTO

**Direction:** Request / Response  
**Endpoints:** `GET /api/consultation/patient/patients`, `POST /api/consultation/patient/register`, `PUT /api/consultation/patient/{id}`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | |
| `mrn` | `String` | Medical Record Number |
| `name` | `String` | |
| `dob` | `Date` | Date of birth |
| `gender` | `String` | |
| `email` | `String` | |
| `phoneNumber` | `String` | Note: frontend maps this to `phone` |
| `address` | `String` | |
| `condition` | `String` | Primary medical condition |
| `lastVisit` | `String` | ISO date; defaults to today if absent |

---

## AppointmentDTO

**Direction:** Request / Response  
**Endpoints:** `GET /api/consultation/appointment/appointments`, `POST /api/consultation/appointment`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `Long` | Response only |
| `patientId` | `Long` | |
| `patientName` | `String` | Response only |
| `doctorId` | `Long` | |
| `doctorName` | `String` | Response only |
| `department` | `String` | |
| `serviceType` | `String` | |
| `startAt` | `LocalDateTime` | |
| `endAt` | `LocalDateTime` | |
| `status` | `String` | e.g. `"Pending"`, `"Confirmed"`, `"In Progress"`, `"Cancelled"` |

---

## DoctorDTO

**Direction:** Request / Response  
**Endpoints:** `GET /api/consultation/doctor/list`, `POST /api/consultation/doctor/register`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `Long` | Response only |
| `name` | `String` | |
| `specialty` | `String` | |
| `email` | `String` | |
| `phone` | `String` | |
| `status` | `String` | e.g. `"Active"`, `"Inactive"` |
