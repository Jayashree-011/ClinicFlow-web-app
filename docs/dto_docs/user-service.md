# user-service — DTOs

Package: `com.clinicflow.userservice.dto`

---

## LoginRequest

**Direction:** Request body  
**Endpoint:** `POST /auth/login`

| Field | Type | Notes |
|-------|------|-------|
| `username` | `String` | |
| `password` | `String` | |

---

## RegisterRequest

**Direction:** Request body  
**Endpoint:** `POST /auth/register`

| Field | Type | Notes |
|-------|------|-------|
| `username` | `String` | |
| `password` | `String` | |
| `fullName` | `String` | |
| `email` | `String` | |
| `phone` | `String` | |
| `role` | `User.UserRole` | Enum: role assigned to the new user |

---

## UpdateRequest

**Direction:** Request body  
**Endpoint:** `PUT /auth/update`  
**Extends:** `RegisterRequest`

| Field | Type | Notes |
|-------|------|-------|
| *(all fields from RegisterRequest)* | | |
| `oldPassword` | `String` | Required for password change verification |

---

## LoginResponse

**Direction:** Response body

| Field | Type | Notes |
|-------|------|-------|
| `token` | `String` | JWT bearer token |
| `type` | `String` | Token type (e.g. `"Bearer"`) |
| `id` | `Long` | User ID |
| `username` | `String` | |
| `email` | `String` | |
| `role` | `String` | |
| `fullName` | `String` | |
| `phone` | `String` | |
