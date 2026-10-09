# ClinicFlow Interview Preparation Guide
> Java Spring Boot · React · Microservices — 28 questions

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Spring Boot & Microservices](#2-spring-boot--microservices)
   - [Q1 — Architecture walkthrough](#q1--can-you-walk-me-through-the-architecture-of-clinicflow)
   - [Q2 — JWT authentication](#q2--how-does-jwt-authentication-work-in-this-project)
   - [Q3 — Service-to-service communication](#q3--how-does-service-to-service-communication-work)
   - [Q4 — User provisioning flow](#q4--explain-the-user-provisioning-flow-when-a-doctor-is-registered)
   - [Q5 — Spring Cloud Gateway vs Zuul](#q5--what-is-spring-cloud-gateway-and-why-not-zuul)
   - [Q6 — RBAC implementation](#q6--how-is-role-based-access-control-rbac-implemented)
   - [Q7 — Database strategy](#q7--what-database-strategy-is-used-across-services)
   - [Q8 — Config Server](#q8--how-does-the-config-server-work)
   - [Q9 — Resilience4j circuit breaker](#q9--explain-the-resilience4j-circuit-breaker-pattern)
   - [Q10 — Random ports](#q10--why-use-serverport0-for-domain-services)
   - [Q11 — ApplicationReadyEvent vs PostConstruct](#q11--how-does-eventlistenerapplicationreadyeventclass-differ-from-postconstruct)
   - [Q12 — Java pitfalls](#q12--what-java-pitfalls-are-addressed-in-this-codebase)
3. [React & Frontend](#3-react--frontend)
   - [Q13 — Routing & auth](#q13--how-is-routing-and-authentication-handled-in-the-react-frontend)
   - [Q14 — Axios auth](#q14--how-does-axios-handle-authentication)
   - [Q15 — Custom hooks](#q15--describe-the-custom-hook-pattern-used-in-clinicflow)
   - [Q16 — TypeScript usage](#q16--how-is-typescript-used-in-the-frontend)
   - [Q17 — Role dashboards](#q17--how-are-role-specific-dashboards-structured)
   - [Q18 — Username suggestion](#q18--how-does-registertsx-handle-username-suggestions)
   - [Q19 — Staff vs Doctors vs Users](#q19--whats-the-difference-between-stafftsx-doctorstsx-and-userstsx)
   - [Q20 — Settings vs Users](#q20--how-does-settingstsx-differ-from-userstsx)
4. [System Design & Architecture](#4-system-design--architecture)
   - [Q21 — Horizontal scaling](#q21--how-would-you-scale-clinicflow-horizontally)
   - [Q22 — DB-per-service trade-offs](#q22--what-are-the-trade-offs-of-the-database-per-service-pattern)
   - [Q23 — Handling inter-service failures](#q23--how-does-clinicflow-handle-failures-in-inter-service-communication)
   - [Q24 — Spring Boot version mismatch](#q24--why-does-the-api-gateway-use-spring-boot-330-while-others-use-406)
   - [Q25 — Adding a new microservice](#q25--how-would-you-add-a-new-microservice-to-clinicflow)
5. [Behavioral & Scenario Questions](#5-behavioral--scenario-questions)
   - [Q26 — Patient books an appointment](#q26--walk-me-through-how-a-patient-books-an-appointment)
   - [Q27 — Debugging a 401](#q27--how-would-you-debug-a-401-error-on-a-protected-endpoint)
   - [Q28 — Adding the Auditor role](#q28--a-new-auditor-role-needs-read-only-access-how-would-you-implement-it)
6. [Quick Reference Cheat Sheet](#6-quick-reference-cheat-sheet)

---

## 1. Project Overview

ClinicFlow is a healthcare management system with role-based dashboards for **Admin, Receptionist, Clinician, Patient, Pharmacy, Finance, Manager, and Auditor** roles.

### Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 4.0.6 (Spring Boot 3.3.0 for api-gateway), Maven |
| Microservices | Spring Cloud Gateway, Eureka, OpenFeign, Resilience4j, Config Server |
| Database | H2 (dev), MySQL (prod) via Spring Data JPA |
| Frontend | React 18, TypeScript, Vite, React Router v7 |
| UI | Material-UI v7, Radix UI, Tailwind CSS v4 |
| HTTP Client | Axios with JWT cookie auth |

### Services & Startup Order

> Services **must** start in this order or they fail to resolve dependencies.

| # | Service | Port | Role |
|---|---|---|---|
| 1 | `config-server` | 8701 | Centralised config for all services |
| 2 | `discovery-server` | 8710 | Eureka service registry |
| 3 | `api-gateway` | 8700 | JWT validation + routing |
| 4+ | `user-service`, `consultation-service`, `billing-service`, `lab-service`, `notification-service`, `pharmacy-service`, `prescription-service`, `encounter-service` | random (`0`) | Domain services |

---

## 2. Spring Boot & Microservices

---

### Q1 — Can you walk me through the architecture of ClinicFlow?

ClinicFlow follows a **microservices architecture** with a Spring Cloud API Gateway as the single entry point on port `8700`. All client requests pass through the gateway which:

1. Validates the JWT token.
2. Injects user identity headers (`X-User-Id`, `X-User-Username`, `X-User-Role`) into the forwarded request.
3. Routes to the correct downstream service via **Eureka** service discovery — no hard-coded ports.

A **Config Server** (port `8701`) serves centralised configuration to all services at startup. Domain services communicate with each other using **OpenFeign** clients backed by **Resilience4j** circuit breakers.

```
Browser / Frontend
      │
      ▼
  api-gateway :8700  ──── JWT validate ────► X-User-* headers injected
      │
      ├──► user-service          (Eureka name: USER-SERVICE)
      ├──► consultation-service  (Eureka name: CONSULTATION-SERVICE)
      ├──► billing-service       (Eureka name: BILLING-SERVICE)
      └──► ...
```

---

### Q2 — How does JWT authentication work in this project?

The `JwtAuthenticationGatewayFilterFactory` in `api-gateway` classifies every request path into one of three categories:

| Category | Behaviour | Example paths |
|---|---|---|
| **Public** | Always bypassed — no JWT needed | `POST /api/auth/login` |
| **Semi-public** | No token → pass through anonymously; valid token → validate + inject headers | `POST /api/auth/register` |
| **Protected** | JWT required; missing/invalid → `401` | everything else |

When a JWT is valid the gateway injects three headers before forwarding:

```
X-User-Id
X-User-Username
X-User-Role
```

Downstream services extract these via `GatewayHeaderFilter` and bind them to `@AuthenticationPrincipal UserDetailsImpl`.

**JWT details:**
- Secret: `clinicflow-secret-key-for-jwt-token-generation-and-validation`
- Expiry: 24 hours
- Library: JJWT v0.12.6 (`user-service/security/JwtUtils.java`)

---

### Q3 — How does service-to-service communication work?

Services communicate using **OpenFeign** clients with **Eureka** discovery — no hard-coded URLs.

```java
// consultation-service
@FeignClient(name = "BILLING-SERVICE", fallback = BillingServiceFeignClientFallback.class)
public interface BillingServiceFeignClient {
    @PostMapping("/api/billing/invoices")
    InvoiceResponse createInvoice(@RequestBody InvoiceRequest request);
}
```

**Failure handling:**
- **Resilience4j circuit breaker** — when the failure rate exceeds a threshold the circuit opens and the `Fallback` class is invoked instead of the real call.
- **Fire-and-forget** — non-critical calls (e.g. user account provisioning) catch all exceptions, log them, and let the primary operation succeed regardless.

---

### Q4 — Explain the user provisioning flow when a doctor is registered.

When `DoctorService.registerDoctor()` is called:

1. The doctor entity is saved to `consultation-service`'s database.
2. `UserServiceClient.createDoctorUser()` is called (fire-and-forget).
3. It calls `suggestUsername` via Feign to derive a unique username from the doctor's name.
4. It `POST`s to `/api/auth/internal/create` — creating a user account in `user-service` with:
   - `status = INACTIVE`
   - default password: `ClinicFlow@2025`
5. The endpoint is **idempotent** — if the username already exists it returns a no-op.
6. On first login, `INACTIVE` status is **automatically flipped to `ACTIVE`** before the JWT is issued.

> The seeder uses `@EventListener(ApplicationReadyEvent.class)` — not `@PostConstruct` — so Eureka registration finishes before Feign calls are attempted. On every restart, the seeder re-calls provisioning to catch any previously missed accounts.

---

### Q5 — What is Spring Cloud Gateway and why not Zuul?

| | Spring Cloud Gateway | Zuul |
|---|---|---|
| Stack | Reactive (Spring WebFlux / Project Reactor) | Servlet-based (blocking) |
| Concurrency | High — non-blocking I/O, fewer threads | Lower — one thread per request |
| Status | Active, maintained | Legacy, deprecated |

In ClinicFlow the gateway uses a custom `GatewayFilterFactory` (`JwtAuthenticationGatewayFilterFactory`) to intercept every request, validate the JWT, and add user context headers before forwarding downstream — a pattern that maps cleanly onto WebFlux's filter chain.

---

### Q6 — How is role-based access control (RBAC) implemented?

RBAC is applied at **two layers**:

**Layer 1 — Gateway (path-level)**

Requests to public/semi-public paths bypass auth; everything else requires a valid JWT.

**Layer 2 — Service (endpoint-level)**

Each service's `SecurityConfig` uses Spring Security's `HttpSecurity` with `requestMatchers` to restrict access by role:

```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.GET, "/api/consultation/doctors").hasAnyRole("Clinician", "Receptionist", "Patient")
    .requestMatchers("/api/consultation/admin/**").hasRole("Administrator")
    .anyRequest().authenticated()
);
```

`@EnableMethodSecurity` with `@PreAuthorize` can be added for method-level checks. The role value comes from the `X-User-Role` header injected by the gateway.

**`UserRole` enum values:** `Patient`, `Receptionist`, `Clinician`, `Pharmacy`, `Finance`, `Manager`, `Administrator`, `Auditor`

---

### Q7 — What database strategy is used across services?

**Database-per-service pattern.** Each microservice owns its own isolated database.

| Profile | Database | How to activate |
|---|---|---|
| `h2` (default dev) | H2 in-memory | `mvn spring-boot:run -Dspring-boot.run.profiles=h2` |
| `mysql` (prod) | MySQL | `mvn spring-boot:run -Dspring-boot.run.profiles=mysql` |

Schema is managed by Spring Data JPA with `ddl-auto=update` — no Flyway or Liquibase. Each service's schema evolves independently.

---

### Q8 — How does the Config Server work?

1. `config-server` starts on port `8701` and serves property files for each service.
2. All other services include a bootstrap config pointing to `http://localhost:8701` and pull their properties at startup.
3. Per-service overrides live in `application.yml`, `application-h2.yml`, `application-mysql.yml`, `application-prod.yml`.
4. **Services will fail to start** if the Config Server is unreachable — it must be started first.

---

### Q9 — Explain the Resilience4j circuit breaker pattern.

```
Normal state (CLOSED):  Feign call → billing-service  ✓
                                                 failure rate > threshold
                                                         ↓
Open state (OPEN):      Feign call → Fallback.createInvoice()  (instant, no network call)
                                                 after wait duration
                                                         ↓
Half-open (HALF-OPEN):  a few probe calls go through → if OK → back to CLOSED
```

The `BillingServiceFeignClientFallback` returns a safe default response (e.g. empty list or null invoice) so the caller degrades gracefully instead of throwing an exception.

---

### Q10 — Why use `server.port=0` for domain services?

`server.port=0` tells Spring Boot to pick a **random available port** at startup. This means:

- Multiple instances of the same service can run simultaneously without port conflicts.
- Each instance registers its actual resolved port with Eureka.
- The API Gateway and Feign clients resolve services by **logical name** (e.g. `CONSULTATION-SERVICE`) from Eureka — they never need to know the port.

---

### Q11 — How does `@EventListener(ApplicationReadyEvent.class)` differ from `@PostConstruct`?

| | `@PostConstruct` | `@EventListener(ApplicationReadyEvent.class)` |
|---|---|---|
| When it runs | During bean initialisation | After the full Spring context is ready |
| Eureka registry ready? | No | Yes |
| Safe for Feign calls? | No — `NoInstanceAvailableException` | Yes |

In ClinicFlow the `DefaultDoctor` and `DefaultPatient` seeders use `ApplicationReadyEvent` so Eureka has fetched the service list before any Feign call to `user-service` is attempted.

---

### Q12 — What Java pitfalls are addressed in this codebase?

**1. String comparison with `==`**

Role values arrive as HTTP header strings — heap-allocated, never interned literals. Using `==` compares object references, not content.

```java
// Wrong
if (role == "Administrator") { ... }

// Correct
if (role.equals("Administrator")) { ... }
```

**2. `Long` comparison with `==`**

Java only caches `Long` in the range **−128 to 127**. Outside that range `==` returns `false` even for equal values.

```java
// Wrong
if (userId == currentUserId) { ... }

// Correct
if (userId.equals(currentUserId)) { ... }
```

**3. Username uniqueness on update**

In `UserService.save()`, the username-uniqueness check only runs when `userId == null` (new user). An existing user being updated already owns their username — checking again would throw a false "username taken" error.

---

## 3. React & Frontend

---

### Q13 — How is routing and authentication handled in the React frontend?

`App.tsx` configures React Router v7 with:
- **Public routes:** `/login`, `/register`
- **Protected routes:** `/administrator`, `/receptionist`, `/clinician`, `/patient` (and more per role)

A `ProtectedRoute` wrapper checks for the JWT cookie. If absent, it redirects to `/login`. After a successful login the JWT is stored as a cookie and Axios includes it on every subsequent request.

---

### Q14 — How does Axios handle authentication?

`src/app/services/client.ts` exports a configured Axios instance that:

1. Reads the JWT from the cookie and attaches it as `Authorization: Bearer <token>` on every request.
2. Has a **response interceptor** — on any `401` response it redirects the user to `/login`.

Vite proxies all `/api/*` requests to `http://localhost:8700` (the API Gateway), so no CORS configuration is needed in development.

---

### Q15 — Describe the custom hook pattern used in ClinicFlow.

`usePatientLookup` in `components/Billing/usePatientLookup.ts` is a clean example:

```ts
function usePatientLookup(query: string) {
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await lookupPatient(query);
        setName(result.name);
      } catch (e) {
        setError('Not found');
      } finally {
        setLoading(false);
      }
    }, 400); // debounce

    return () => clearTimeout(timer); // cleanup cancels in-flight call
  }, [query]);

  return { name, loading, error };
}
```

The hook **encapsulates** the debounce timer, loading state, and error state — the component that calls it stays clean and declarative.

---

### Q16 — How is TypeScript used in the frontend?

- Every component is a `.tsx` file.
- API response shapes are TypeScript **interfaces** (e.g. `Invoice`, `Payment` in `components/Billing/types.ts`).
- Status fields use TypeScript **enums** (e.g. `InvoiceStatus`).
- Props are typed explicitly on every component.
- Path alias `@/` → `./src/` is configured in `tsconfig.json`:

```ts
import { client } from '@/app/services/client';
```

---

### Q17 — How are role-specific dashboards structured?

Each role has its own top-level directory under `src/app/components/`:

```
components/
├── Admin/         → AdminDashboard.tsx
├── Reception/     → ReceptionDashboard.tsx
├── Clinician/     → ClinicianDashboard.tsx
├── Patient/       → PatientDashboard.tsx
├── Pharmacy/      → PharmacyDashboard.tsx
├── Finance/       → FinanceDashboard.tsx
├── Manager/       → ManagerDashboard.tsx
├── Auditor/       → AuditorDashboard.tsx
└── Dashboard/     → shared sections (AdminSection, KPISection, FinanceSection…)
```

After login the backend returns the user's role; the frontend navigates to the matching route. Shared widgets live in `Dashboard/` and are imported by multiple role dashboards.

---

### Q18 — How does `Register.tsx` handle username suggestions?

1. The `fullName` input has a **400 ms debounce**.
2. When the user pauses typing, `suggestUsername` is called: `GET /api/auth/suggestUsername/{baseName}`.
3. The `deriveBase` algorithm (identical on frontend and backend):
   - Strip leading `Dr.` prefix
   - Lowercase
   - Replace spaces with dots
   - Strip non-alphanumeric characters except `.`, `_`, `-`
4. `suggestUsername` appends an incrementing suffix until a free username is found (`john.smith`, `john.smith2`, …).

The same algorithm is implemented in both `Register.tsx` and `UserServiceClient.java` so usernames derived on the frontend always match what the backend would generate.

---

### Q19 — What's the difference between `Staff.tsx`, `Doctors.tsx`, and `Users.tsx`?

| Component | Who uses it | Can mutate? | API calls |
|---|---|---|---|
| `Users.tsx` | Admin only | Yes — edit any account, create users | `getUsers`, `adminUpdateUser`, `registerUser` |
| `Staff.tsx` | Admin only | Yes — register & delete doctors | `getDoctors`, `registerDoctor`, `deleteDoctor` |
| `Doctors.tsx` | All roles | No — read-only directory | `getDoctors` |

---

### Q20 — How does `Settings.tsx` differ from `Users.tsx`?

| | `Settings.tsx` | `Users.tsx` |
|---|---|---|
| Scope | Current logged-in user only | All user accounts (admin) |
| Fetch | `GET /api/auth/user/me` | `GET /api/auth/user` |
| Save | `PUT /api/auth/update` (requires old password) | `PUT /api/auth/user/{id}` |
| Role field | Read-only — cannot self-promote | Editable by admin |
| Status field | Not shown | Never written — system-managed |

---

## 4. System Design & Architecture

---

### Q21 — How would you scale ClinicFlow horizontally?

- **Services:** `server.port=0` means you can launch N instances of the same service with no port conflicts. Each registers with Eureka and the Gateway load-balances across them.
- **Gateway:** Stateless JWT validation — any gateway instance can validate any token. Run multiple gateway instances behind a layer-4 load balancer.
- **Database:** Each service has its own DB, so read replicas can be added per service independently without affecting others.

---

### Q22 — What are the trade-offs of the database-per-service pattern?

**Benefits**

- Schema changes in one service never break another.
- Independent scaling and technology choices per service.
- No shared DB lock contention between services.

**Trade-offs**

- No cross-service ACID transactions — ClinicFlow uses **eventual consistency** (fire-and-forget, idempotent retry).
- Cross-service reporting requires API composition or a dedicated read model / data warehouse.
- Joining data from multiple services (e.g. patient details + invoice) must happen in the application layer.

---

### Q23 — How does ClinicFlow handle failures in inter-service communication?

Three strategies, each suited to a different scenario:

| Strategy | Where used | Behaviour on failure |
|---|---|---|
| **Fire-and-forget** | User provisioning (doctor/patient registration) | Exception caught and logged; primary operation succeeds |
| **Circuit breaker + fallback** | Billing, notification Feign calls | Fallback class returns safe default; circuit opens after threshold |
| **Idempotent endpoints** | `/api/auth/internal/create` | Re-running on restart is safe — existing accounts are a no-op |

---

### Q24 — Why does the API Gateway use Spring Boot 3.3.0 while others use 4.0.6?

Spring Cloud Gateway (reactive WebFlux stack) requires Spring Cloud `2023.0.x`, which aligns with Spring Boot `3.3.x`. Domain services run the servlet stack independently and can use Spring Boot `4.0.6`. The version mismatch is **intentional** — the gateway has stricter Spring Cloud compatibility constraints than domain services, and mixing stacks is supported as long as they communicate over HTTP.

---

### Q25 — How would you add a new microservice to ClinicFlow?

1. Create a new Spring Boot project; add `spring-cloud-starter-netflix-eureka-client`, `spring-cloud-starter-config`, `spring-boot-starter-security`.
2. In `application.yml`:
   ```yaml
   server.port: 0
   eureka.client.serviceUrl.defaultZone: http://localhost:8710/eureka/
   spring.config.import: optional:configserver:http://localhost:8701
   ```
3. Add `GatewayHeaderFilter` to parse `X-User-Id`, `X-User-Username`, `X-User-Role` into the security context.
4. Add the routing rule in `api-gateway/src/main/resources/application.yaml`:
   ```yaml
   - id: my-new-service
     uri: lb://MY-NEW-SERVICE
     predicates:
       - Path=/api/my-new/**
   ```
5. If calling another service, create a `@FeignClient(name = "TARGET-SERVICE", fallback = ...)` interface and annotate the main class with `@EnableFeignClients`.

---

## 5. Behavioral & Scenario Questions

---

### Q26 — Walk me through how a patient books an appointment.

```
Patient (browser)
  │  POST /api/auth/login
  ▼
api-gateway → user-service → returns JWT (cookie)
  │
  │  React routes to /patient dashboard
  │
  │  POST /api/consultation/appointments  (Axios + JWT cookie)
  ▼
api-gateway
  ├── validates JWT
  ├── injects X-User-Id, X-User-Role headers
  └── routes to consultation-service
        │
        ├── PatientAppointmentService.createAppointment() → saved to DB
        ├── notification-service Feign call → reminder queued  (fire-and-forget)
        └── billing-service Feign call → invoice record created (fire-and-forget)
```

---

### Q27 — How would you debug a 401 error on a protected endpoint?

1. **Check request headers** — is `Authorization: Bearer <token>` present in the request?
2. **Check gateway logs** (`JwtAuthenticationGatewayFilterFactory`) — is the token being parsed without error?
3. **Verify JWT secret** — must be identical in every service's `application.yml`: `clinicflow-secret-key-for-jwt-token-generation-and-validation`.
4. **Check token expiry** — JWTs expire after 24 hours; force a re-login.
5. **Check path classification** — is the endpoint accidentally listed as a public path in the gateway filter?
6. **Check downstream SecurityConfig** — the service itself may be rejecting the request after the gateway already passed it through.

---

### Q28 — A new "Auditor" role needs read-only access. How would you implement it?

1. Add `Auditor` to the `UserRole` enum in `user-service`.
2. In each domain service's `SecurityConfig`, allow GET requests for Auditor:
   ```java
   .requestMatchers(HttpMethod.GET, "/**").hasAnyRole("Administrator", "Auditor")
   ```
3. Wire the existing `AuditorDashboard.tsx` component (already scaffolded in the frontend) to its API calls.
4. Add the `/auditor` route to `App.tsx`'s `ProtectedRoute`.
5. No gateway changes needed — the role is already propagated via the `X-User-Role` header.

---

## 6. Quick Reference Cheat Sheet

| Topic | Key Class / File | Notes |
|---|---|---|
| JWT generation | `user-service: JwtUtils.java` | JJWT v0.12.6, 24 h expiry |
| JWT validation | `api-gateway: JwtAuthenticationGatewayFilterFactory.java` | Injects `X-User-*` headers |
| Service discovery | `discovery-server` (port 8710) | All services register on startup |
| Centralised config | `config-server` (port 8701) | Must start before all other services |
| Inter-service calls | `consultation-service: BillingServiceFeignClient.java` | OpenFeign + Resilience4j fallback |
| User provisioning | `consultation-service: UserServiceClient.java` | Idempotent, fire-and-forget |
| Role-based security | `each service: SecurityConfig.java` | Spring Security `HttpSecurity` matchers |
| Frontend routing | `clinicflow-frontend: App.tsx` | React Router v7, `ProtectedRoute` |
| API HTTP client | `clinicflow-frontend: services/client.ts` | Axios + JWT cookie + 401 interceptor |
| Username suggestion | `Register.tsx` + `UserServiceClient.java` | Same `deriveBase` algorithm on both sides |
| Custom React hook | `components/Billing/usePatientLookup.ts` | Debounced search, loading/error state |
| Admin user mgmt | `components/Users.tsx` | `getUsers`, `adminUpdateUser`, `registerUser` |

---

*Last updated: 2026-05-28*
