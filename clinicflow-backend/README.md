# ClinicFlow Backend — Spring Boot Microservices

Healthcare management system backend built with Java 21, Spring Boot, and Spring Cloud.

---

## Services

| # | Service | Port | Description |
|---|---------|------|-------------|
| 1 | `config-server` | 8701 | Centralized YAML configuration for all services |
| 2 | `discovery-server` | 8710 | Eureka service registry |
| 3 | `api-gateway` | 8700 | JWT validation + request routing (Spring Boot 3.3 / Spring Cloud 2023) |
| 4 | `user-service` | random | Accounts, authentication, JWT issuance |
| 6 | `consultation-service` | random | Doctors, patients, appointments |
| 7 | `encounter-service` | random | Clinical encounter records |
| 8 | `lab-service` | random | Lab test orders and results |
| 9 | `pharmacy-service` | random | Medication dispensing |
| 10 | `prescription-service` | random | Prescription management |
| 11 | `billing-service` | random | Invoicing and payments |
| 12 | `notification-service` | random | Email / SMS alerts |

Domain services (5–12) use `server.port=0` (random) and register with Eureka; the gateway resolves them by service name.

---

## Prerequisites

- Java 21
- Maven (matches the version in each service's `pom.xml`)
- (Optional) MySQL for production profile — H2 in-memory is used by default

---

## Starting Services

**Services must start in this order** (each depends on the ones above it):

```bash
# 1. Config server — must be first
cd config-server && mvn spring-boot:run

# 2. Eureka
cd discovery-server && mvn spring-boot:run

# 3. Gateway
cd api-gateway && mvn spring-boot:run

# 4+. Domain services (order within this group doesn't matter)
cd user-service         && mvn spring-boot:run
cd consultation-service && mvn spring-boot:run
# … etc.
```

**Or start everything at once:**

```bat
# Windows
run-all-services.bat
.\run-all-services.ps1 -Build -Profile prod

# Linux / Mac
./run-all-services.sh
```

---

## Database Profiles

| Profile | Command flag | Database |
|---------|-------------|----------|
| `h2` (default) | `-Dspring-boot.run.profiles=h2` | H2 in-memory; schema recreated on each start |
| `mysql` | `-Dspring-boot.run.profiles=mysql` | MySQL; configure URL/credentials in `application-mysql.yml` |
| `prod` | `-Dspring-boot.run.profiles=prod` | Production MySQL via run-all script |

JPA `ddl-auto=update` — schema is managed automatically, no migration tool needed.

---

## API Gateway — Endpoint Categories

The gateway (`JwtAuthenticationGatewayFilterFactory`) classifies every path into one of three categories:

| Category | Behaviour | Current paths |
|----------|-----------|---------------|
| **Public** | Always bypassed — no JWT checked, no headers injected | `POST /api/auth/login` |
| **Semi-public** | No token → pass through anonymously; valid token → inject `X-User-*` headers | `POST /api/auth/register` |
| **Public prefix** | Prefix match, always bypassed | `GET /api/auth/suggestUsername/**` |
| **Protected** | JWT required; invalid/missing → 401 | everything else |

When a JWT is valid the gateway mutates the request with three headers before forwarding:

```
X-User-Id:       <userId>
X-User-Username: <username>
X-User-Role:     <role>
```

Downstream services read these via `GatewayHeaderFilter` → `@AuthenticationPrincipal UserDetailsImpl`.

---

## user-service API

Base path: `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/login` | Public | Returns JWT + user profile |
| `POST` | `/register` | Patient: public · Other roles: Administrator JWT | Register a new user account |
| `GET` | `/suggestUsername/{baseName}` | Public | Returns first available username derived from baseName |
| `GET` | `/user/me` | Any authenticated | Current user's profile |
| `GET` | `/user` | Administrator | List all user accounts |
| `GET` | `/user/{id}` | Self, Administrator, or Receptionist | Get user by ID |
| `PUT` | `/update` | Self | Update own profile (requires old password) |
| `PUT` | `/user/{id}` | Administrator | Patch fullName / email / phone / role (no password, no status) |
| `DELETE` | `/delete` | Self | Delete own account |
| `POST` | `/internal/create` | Internal (no gateway JWT) | Provision an INACTIVE account from another service |

### User Roles

`Patient` · `Receptionist` · `Clinician` · `Pharmacy` · `Finance` · `Manager` · `Administrator` · `Auditor`

### User Status

`ACTIVE` / `INACTIVE` — system-managed, not writable via any public endpoint.
INACTIVE accounts are auto-activated to ACTIVE on the first successful login.

---

## User Provisioning Flow

When a doctor or patient is registered via `consultation-service`, a corresponding user account is automatically provisioned in `user-service`:

1. `DoctorService.registerDoctor()` / `PatientAppointmentService.registerPatient()` saves the entity, then calls `UserServiceClient.createDoctorUser()` / `createPatientUser()` (fire-and-forget).
2. `UserServiceClient` calls `suggestUsername` to derive a unique username from the person's name, then POSTs to `/api/auth/internal/create`.
3. The account is created with status `INACTIVE` and default password `ClinicFlow@2025`.
4. Default seeder data (`DefaultDoctor`, `DefaultPatient`) runs via `@EventListener(ApplicationReadyEvent.class)` — after Eureka is ready — and re-attempts provisioning for already-existing entities on each restart (idempotent).

---

## JWT

- **Secret:** `clinicflow-secret-key-for-jwt-token-generation-and-validation`
- **Expiry:** 24 hours
- Defined in each service's `application.yml`

---

## Configuration

Each service fetches config from `http://localhost:8701` at startup. Per-service overrides live in `src/main/resources/application.yml` plus profile-specific variants (`application-h2.yml`, `application-mysql.yml`, `application-prod.yml`).
