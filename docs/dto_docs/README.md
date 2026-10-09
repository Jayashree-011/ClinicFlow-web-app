# ClinicFlow — DTO Documentation

DTO and payload reference for all backend microservices.

| Service | DTOs |
|---------|------|
| [user-service](user-service.md) | `LoginRequest`, `RegisterRequest`, `UpdateRequest`, `LoginResponse` |
| [consultation-service](consultation-service.md) | `PatientDTO`, `AppointmentDTO`, `DoctorDTO` |
| [encounter-service](encounter-service.md) | `EncounterCreateRequest`, `EncounterUpdateRequest`, `EncounterDTO`, `ProblemListCreateRequest`, `ProblemListDTO`, `ApiResponse<T>` |
| [lab-service](lab-service.md) | `LabOrderDTO`, `LabResultDTO` |
| [pharmacy-service](pharmacy-service.md) | `InventoryItemDTO`, `DispenseRequestDTO`, `DispenseResponseDTO` |
| [prescription-service](prescription-service.md) | `PrescriptionRequestDTO`, `PrescriptionResponseDTO` |
| [billing-service](billing-service.md) | `InvoiceDTO`, `PaymentDTO`, `ServiceItemDTO`, `AppointmentDTO`, `EncounterDTO`, `PatientDTO` |
| [notification-service](notification-service.md) | `NotificationDTO`, `TaskDTO` |

---

## Inter-Service Feign Clients

These DTOs are also used as read models passed between services via OpenFeign. All Feign clients have circuit breaker fallbacks — see [`../architecture.md`](../architecture.md) for the fallback behaviour per service.

| Caller | Called Service | DTO Used |
|--------|---------------|----------|
| `billing-service` | `consultation-service` | `PatientDTO`, `AppointmentDTO` |
| `billing-service` | `encounter-service` | `EncounterDTO` |
| `consultation-service` | `billing-service` | raw `Map` |
| `consultation-service` | `user-service` | raw `Map` |
| `encounter-service` | `consultation-service` | `PatientDTO` (projected) |
| `encounter-service` | `prescription-service` | `PrescriptionResponseDTO` (projected) |
| `pharmacy-service` | `prescription-service` | `PrescriptionResponseDTO` (projected) |
| `prescription-service` | `billing-service` | raw `Map` |
| `lab-service` | `billing-service` | raw `Map` |

---

## UserRole Enum Values

Valid values for the `role` field in `RegisterRequest` and `LoginResponse`:

`Patient` · `Receptionist` · `Clinician` · `Pharmacy` · `Finance` · `Manager` · `Administrator` · `Auditor`

## UserStatus Enum Values

`ACTIVE` · `INACTIVE`

> Accounts auto-provisioned by `consultation-service` start as `INACTIVE` and flip to `ACTIVE` on first successful login.
