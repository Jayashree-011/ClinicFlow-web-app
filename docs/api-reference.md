# ClinicFlow — API Reference

All calls go through the API Gateway at `http://localhost:8700` (proxied from `/api` by Vite in dev).

The frontend Axios instance (`src/app/services/api.ts`) attaches `Authorization: Bearer <token>` from the `token` cookie to every request. On HTTP 401 the cookie is cleared and the user is redirected to `/login`.

---

## Gateway path prefix convention

| Path prefix | Routes to |
|-------------|-----------|
| `/api/auth` | `user-service` |
| `/api/consultation` | `consultation-service` |
| `/api/encounter` | `encounter-service` |
| `/api/lab` | `lab-service` |
| `/api/pharmacy` | `pharmacy-service` |
| `/api/prescriptions` | `prescription-service` |
| `/api/billing` | `billing-service` |
| `/api/notification` | `notification-service` |

---

## Auth / Users (`/api/auth` → `user-service`)

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | None | Login — returns JWT + user info |
| `POST` | `/api/auth/register` | None (Patient) / Admin JWT (other roles) | Register a new user |
| `GET` | `/api/auth/suggestUsername/{baseName}` | None | Returns first available username derived from `baseName` |

**Login response:**
```json
{
  "token": "<jwt>",
  "type": "Bearer",
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "role": "Clinician",
  "fullName": "Dr. John Doe",
  "phone": "+1 555 0001"
}
```

### Current user

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/auth/user/me` | JWT | Fetch current user's profile |
| `PUT` | `/api/auth/update` | JWT | Update own profile (`fullName`, `email`, `phone`); requires `oldPassword` |

### User management (Administrator only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/auth/user` | Admin JWT | List all users |
| `PUT` | `/api/auth/user/{id}` | Admin JWT | Patch `fullName`, `email`, `phone`, `role` — status is never written here |

### Internal (service-to-service only)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/internal/create` | Idempotent user provisioning — no-op if username exists |

---

## Patients / Consultation (`/api/consultation` → `consultation-service`)

### Patients

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/consultation/patient/patients` | List all patients |
| `POST` | `/api/consultation/patient/register` | Register a new patient (auto-provisions user account) |
| `PUT` | `/api/consultation/patient/{id}` | Update patient details |

Patient response object:
```json
{
  "id": 1,
  "mrn": "MRN-0001",
  "name": "Jane Doe",
  "dob": "1990-05-15",
  "gender": "Female",
  "phone": "+1 555 0001",
  "email": "jane@example.com",
  "address": "123 Main St",
  "condition": "Hypertension",
  "lastVisit": "2025-05-20"
}
```

### Appointments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/consultation/appointment/appointments` | List all appointments |
| `POST` | `/api/consultation/appointment` | Book a new appointment |
| `PUT` | `/api/consultation/appointment/{id}` | Update appointment |
| `DELETE` | `/api/consultation/appointment/{id}` | Cancel appointment |

### Doctors

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/consultation/doctor/list` | List all doctors |
| `POST` | `/api/consultation/doctor/register` | Register a new doctor (auto-provisions user account) |
| `DELETE` | `/api/consultation/doctor/{id}` | Remove a doctor |

---

## Encounters (`/api/encounter` → `encounter-service`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/encounter` | Create a new encounter |
| `GET` | `/api/encounter/patient/{patientId}` | Get all encounters for a patient |
| `GET` | `/api/encounter/{id}` | Get encounter by ID |
| `PUT` | `/api/encounter/{id}` | Update encounter (notes, vitals, diagnoses) |
| `POST` | `/api/encounter/problems` | Add a problem list entry |
| `GET` | `/api/encounter/problems/{patientId}` | Get problem list for a patient |

All responses are wrapped in `ApiResponse<T>`:
```json
{ "success": true, "message": "OK", "data": { ... }, "error": null }
```

---

## Lab (`/api/lab` → `lab-service`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/lab/orders` | Create a lab order |
| `GET` | `/api/lab/orders/patient/{patientId}` | List lab orders for a patient |
| `GET` | `/api/lab/orders/{id}` | Get lab order by ID |
| `PUT` | `/api/lab/orders/{id}` | Update lab order status |
| `POST` | `/api/lab/results` | Record lab results |
| `GET` | `/api/lab/results/order/{orderId}` | Get results for a lab order |

---

## Pharmacy (`/api/pharmacy` → `pharmacy-service`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/pharmacy/inventory` | List all inventory items |
| `POST` | `/api/pharmacy/inventory` | Add an inventory item |
| `PUT` | `/api/pharmacy/inventory/{id}` | Update an inventory item |
| `DELETE` | `/api/pharmacy/inventory/{id}` | Remove an inventory item |
| `POST` | `/api/pharmacy/dispense` | Dispense medication (links to prescription `rxId`) |
| `GET` | `/api/pharmacy/dispense/history/{patientId}` | Get dispense history for a patient |

---

## Prescriptions (`/api/prescriptions` → `prescription-service`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/prescriptions` | Create a prescription (status: `DRAFT`) |
| `GET` | `/api/prescriptions/{id}` | Get prescription by ID |
| `GET` | `/api/prescriptions/patient/{patientId}` | List prescriptions for a patient |
| `GET` | `/api/prescriptions/encounter/{encounterId}` | List prescriptions for an encounter |
| `PUT` | `/api/prescriptions/{id}/issue` | Issue (activate) a prescription — triggers billing |
| `DELETE` | `/api/prescriptions/{id}` | Cancel a prescription |

**Prescription status lifecycle:** `DRAFT` → `ISSUED` → (dispensed by pharmacy)

---

## Billing (`/api/billing` → `billing-service`)

### Invoices

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/billing/invoices` | List all invoices |
| `GET` | `/api/billing/invoices/{id}` | Get invoice by ID |
| `GET` | `/api/billing/invoices/patient/{patientId}` | List invoices for a patient |
| `POST` | `/api/billing/invoices` | Create an invoice (auto-generates `description`) |
| `PUT` | `/api/billing/invoices/{id}` | Update an invoice (regenerates `description`) |
| `DELETE` | `/api/billing/invoices/{id}` | Delete an invoice |

**Invoice response includes:**
```json
{
  "invoiceId": 1,
  "patientId": 3,
  "encounterId": 2,
  "appointmentId": null,
  "prescriptionId": null,
  "labOrderId": null,
  "description": "Consultation fee for Patient #3 — Appointment #1. Total: $150.00",
  "subtotal": 150.00,
  "taxes": 0.00,
  "discounts": 0.00,
  "totalAmount": 150.00,
  "status": "PENDING",
  "issuedAt": "2025-05-20T09:30:00",
  "lineItemsJson": null
}
```

The `description` field is auto-generated server-side based on the source reference fields (`appointmentId`, `prescriptionId`, `labOrderId`, `encounterId`).

### Payments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/billing/payments` | List all payments |
| `GET` | `/api/billing/payments/invoice/{invoiceId}` | List payments for an invoice (returns `[]` if none) |
| `POST` | `/api/billing/payments` | Record a payment against an invoice |

### Service Items

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/billing/service-items` | List all billable service items |
| `POST` | `/api/billing/service-items` | Create a service item |
| `PUT` | `/api/billing/service-items/{id}` | Update a service item |
| `DELETE` | `/api/billing/service-items/{id}` | Delete a service item |

---

## Actuator / Health

Each service exposes health endpoints:

| Service | Health path |
|---------|------------|
| `user-service` | `/api/auth/actuator/health` |
| `consultation-service` | `/api/consultation/actuator/health` |
| `encounter-service` | `/api/encounter/actuator/health` |
| `lab-service` | `/api/lab/actuator/health` |
| `pharmacy-service` | `/api/pharmacy/actuator/health` |
| `prescription-service` | `/api/prescriptions/actuator/health` |
| `billing-service` | `/api/billing/actuator/health` |
| `notification-service` | `/api/notification/actuator/health` |

Additional endpoints exposed: `info`, `circuitbreakers`, `circuitbreakerevents`
