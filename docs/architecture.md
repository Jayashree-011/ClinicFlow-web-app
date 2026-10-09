# ClinicFlow — Architecture

## System Overview

ClinicFlow is split into a React/Vite frontend and a Spring Boot microservices backend. All frontend API traffic flows through a single API Gateway; individual services register with Eureka and are discovered dynamically by name — no hard-coded service URLs anywhere.

```
Browser (localhost:5173)
        │  /api/*  (Vite proxy in dev)
        ▼
 API Gateway :8700  ──── JWT validation ─────────────────────────┐
        │                                                         │
        │  routes by /api/<prefix>          injects headers:      │
        │                                   X-User-Id             │
        ▼                                   X-User-Username       │
 ┌──────────────────────────────────────────X-User-Role ──────────┘
 │  user-service           (auth, user management)
 │  consultation-service   (patients, appointments, doctors)
 │  encounter-service      (clinical visit records)
 │  lab-service            (lab orders & results)
 │  pharmacy-service       (drug inventory, dispensing)
 │  prescription-service   (prescriptions lifecycle)
 │  billing-service        (invoices, payments)
 │  notification-service   (email / SMS)
 └──────────────────────────────────────────────────────────────┘
        ▲
 Eureka :8710  ◄──── all services register on startup
        ▲
 Config Server :8701  ◄──── all services pull YAML config at startup
```

### Required startup order

Each layer depends on the one above it being ready:

1. `config-server` — all services import config from here at startup
2. `discovery-server` — all services register here; gateway resolves names via Eureka
3. `api-gateway` — validates JWT and routes to services by Eureka name
4. Domain services (any order): `user-service`, `consultation-service`, `encounter-service`, `lab-service`, `pharmacy-service`, `prescription-service`, `billing-service`, `notification-service`

---

## Backend Services

| Service | Port | Description |
|---------|------|-------------|
| `config-server` | 8701 | Centralised YAML config for all services |
| `discovery-server` | 8710 | Eureka service registry |
| `api-gateway` | 8700 | Entry point — JWT validation + path-based routing |
| `user-service` | dynamic | Authentication, user accounts, role management |
| `consultation-service` | 8082 | Patient registration, appointments, doctor registry |
| `encounter-service` | 8083 | Clinical visit records, problem lists |
| `lab-service` | 8085 | Lab test orders and results |
| `pharmacy-service` | 8087 | Drug inventory management, dispensing |
| `prescription-service` | 8088 | Prescription issuance and lifecycle |
| `billing-service` | 8089 | Invoice generation, payment recording |
| `notification-service` | dynamic | Async email/SMS delivery |

Domain services use `server.port=0` (random) in dev — they register with Eureka under their service name and the gateway resolves them by name, never by port.

### Key backend details

- **Java 21**, **Spring Boot 4.0.6** (all domain services), **Spring Boot 3.3.0** (api-gateway only), **Spring Cloud 2025.1.1**
- **Auth:** JWT signed with a shared secret, 24 h expiry. The gateway validates the token and injects `X-User-Id`, `X-User-Username`, `X-User-Role` headers. Downstream services trust these headers via `GatewayHeaderFilter` — they never re-verify the token.
- **Database:** H2 in-memory by default (`h2` profile); MySQL 8 for production (`mysql` profile). JPA `ddl-auto=update` — schema evolves automatically, no migration tool required for dev.
- **Config loading:** Each service does `spring.config.import=optional:configserver:http://localhost:8701` at startup. The `optional:` prefix means services can still start if the config server is unreachable.

---

## Service-to-Service Communication

Internal calls (e.g. consultation-service → user-service, billing-service → consultation-service) use **OpenFeign** with Eureka discovery — no hard-coded URLs. All Feign clients have `spring.cloud.openfeign.circuitbreaker.enabled=true`.

### Circuit Breaker (Resilience4j)

All six inter-communicating domain services have full Resilience4j circuit breaker configuration and fallback classes:

| Service | Protected Feign Calls | Fallback on Circuit Open |
|---------|-----------------------|--------------------------|
| `billing-service` | PatientService, EncounterService, AppointmentService | Returns `null` / empty list — controller issues safe 404 |
| `consultation-service` | BillingService, UserService | Returns `Map.of()` — provisioning failure is silent |
| `encounter-service` | ConsultationClient, PrescriptionClient | Returns `null` / empty list |
| `pharmacy-service` | PrescriptionClient | No-op void — dispense mark silently skipped |
| `prescription-service` | BillingService | Returns `Map.of()` |
| `lab-service` | BillingService | Returns `Map.of()` |

**Circuit breaker configuration (all services):**

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        slidingWindowSize: 10
        failureRateThreshold: 50          # trips after 5/10 failures
        waitDurationInOpenState: 10s      # self-heals after 10 s
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        recordExceptions:
          - java.io.IOException
          - feign.FeignException
  timelimiter:
    configs:
      default:
        timeoutDuration: 3s
```

**Guarantee:** A downed downstream service never crashes clinical operations. The Feign call fails fast, the fallback returns a safe empty value, and the calling service continues.

---

## API Gateway — Endpoint Categories

`JwtAuthenticationGatewayFilterFactory` classifies every incoming request:

| Category | Behaviour | Examples |
|----------|-----------|---------|
| **Public** | Always bypassed — no JWT required | `POST /api/auth/login` |
| **Public prefix** | Prefix match, always bypassed | `GET /api/auth/suggestUsername/**` |
| **Semi-public** | No token → anonymous pass-through; valid token → validate + inject headers | `POST /api/auth/register` |
| **Protected** | JWT required; missing/invalid → 401 | everything else |

---

## User Provisioning Flow

When a doctor or patient is registered through `consultation-service`, a corresponding user account is auto-created in `user-service`:

1. `DoctorService.registerDoctor()` / `PatientAppointmentService.registerPatient()` saves the entity, then calls `UserServiceClient` (**fire-and-forget** — failures are caught/logged, never propagated).
2. `UserServiceClient` calls `suggestUsername` via Feign to derive a unique username, then POSTs to `POST /api/auth/internal/create`.
3. The account is created with `status = INACTIVE` and default password `ClinicFlow@2025`.
4. The account activates automatically on first successful login.

The `/internal/create` endpoint is **idempotent** — it returns a no-op if the username already exists.

---

## Frontend

- **Stack:** React 18, Vite 6, TypeScript, React Router v7, Material-UI v7, Radix UI, Tailwind CSS v4, Axios, Recharts, Lucide React
- **Entry:** `src/main.tsx` → `src/app/App.tsx`
- **Path alias:** `@/` → `./src/`
- **API layer:** All calls use relative `/api/*` paths so the Vite proxy forwards them to the gateway at `localhost:8700`. No CORS handling needed in dev. The Axios instance reads the JWT from the `token` cookie and adds `Authorization: Bearer <token>` to every request; on HTTP 401 it clears cookies and redirects to `/login`.

### Route → component mapping

| Route | Component | Access |
|-------|-----------|--------|
| `/` | `Welcome` | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public (Patient self-registration only) |
| `/administrator/dashboard` | `Admin` | Protected — `Administrator` |
| `/receptionist/dashboard` | `Reception` | Protected — `Receptionist` |
| `/clinician/dashboard` | `Clinician` | Protected — `Clinician` |
| `/patient/dashboard` | `PatientDashboard` | Protected — `Patient` |
| `/pharmacy/dashboard` | `PharmacyDashboard` | Protected — `Pharmacy` |
| `/finance/dashboard` | `FinanceDashboard` | Protected — `Finance` |
| `/manager/dashboard` | `ManagerDashboard` | Protected — `Manager` |
| `/auditor/dashboard` | `AuditorDashboard` | Protected — `Auditor` |
| `*` | `404` | — |

All dashboard routes are guarded by `ProtectedRoute` — if no `token` cookie is present the user is redirected to `/login`.

### Dashboard shell pattern

Every role dashboard is a thin shell that passes a `tabList` to `CentralDashboard`:

```tsx
export function PharmacyDashboard(): JSX.Element {
  const tabList = [Tabs.Dashboard, Tabs.Prescription, Tabs.Pharmacy, Tabs.Lab];
  return <CentralDashboard tabList={tabList} />;
}
```

`CentralDashboard` renders the `Sidebar` (from `tabList`) and a `renderContent()` switch that maps tab names to the correct module component.

### Role-filtered dashboard widgets

The shared `Dashboard.tsx` renders different content per role using `hasAnyRole()` guards inside each section component:

| Section | Roles that see it |
|---------|-------------------|
| KPI — Total Patients | Administrator, Manager, Receptionist, Auditor |
| KPI — Appointments Today | Administrator, Manager, Receptionist, Clinician |
| KPI — Available Doctors | Administrator, Manager, Receptionist |
| KPI — Monthly Revenue | Administrator, Manager, Finance |
| Appointments table | Administrator, Manager, Receptionist, Clinician |
| Finance / Revenue chart | Administrator, Manager, Finance |
| Clinician workload | Clinician |
| Service health widget | Administrator |
| Audit log widget | Administrator, Auditor |
