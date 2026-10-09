# ClinicFlow — Kafka Messaging Flow

> **Current implementation note:** The running system uses **synchronous Feign calls** (fire-and-forget) for user provisioning — `consultation-service` calls `user-service` via OpenFeign with a try/catch; failures are logged and never propagated. This document describes the **Kafka-based async alternative** that the codebase also supports. The Kafka path can be activated by enabling the Kafka configuration in both services.

## Overview

The Kafka design provides fully asynchronous, event-driven communication between
`consultation-service` and `user-service`.  When a new Patient or Doctor is
registered, consultation-service publishes a provision request; user-service
consumes it, creates an INACTIVE user account, then publishes a confirmation;
consultation-service consumes the confirmation and writes the `userId` back to
the original row.

This decouples the two services: patient/doctor registration always succeeds
immediately, regardless of whether user-service is available at that moment.

---

## Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `consultation.user.provision` | consultation-service → user-service | Request to create an INACTIVE user account |
| `user.provisioned` | user-service → consultation-service | Confirmation with the new `userId` |

Both topics use **1 partition, replication factor 1** (suitable for local/dev).
Each service declares both topics via `NewTopic` beans so they are auto-created
on startup regardless of which service starts first.

Default broker address: `localhost:9092`
Override with environment variable: `KAFKA_BOOTSTRAP_SERVERS=<host>:<port>`

---

## Message Flow

```
consultation-service                              user-service
─────────────────────────────────────────────────────────────────

registerPatient()  or  registerDoctor()
         │
         │  UserProvisionEvent (JSON string)
         ├──────────────────────────────────►  UserProvisionConsumer
         │   topic: consultation.user.provision       │
         │                                     createInactiveUser()
         │                                     status = INACTIVE
         │                                            │
UserProvisionedConsumer  ◄──────────────────  UserProvisionedProducer
         │   topic: user.provisioned           (entityType, entityId, userId)
         │
patient.setUserId(userId)
  or
doctor.setUserId(userId)
         │
   patientRepository.save()
   doctorRepository.save()
```

---

## Event Schemas

### `UserProvisionEvent`
Published to `consultation.user.provision`.

| Field | Type | Description |
|-------|------|-------------|
| `entityType` | String | `"Patient"` or `"Doctor"` |
| `entityId` | Long | PK of the Patient/Doctor row in consultation-service |
| `username` | String | Unique login handle — MRN for patients, email for clinicians |
| `fullName` | String | Display name |
| `email` | String | Email address (derived from contactInfo JSON for patients) |
| `phone` | String | Phone number |
| `role` | String | `"Patient"` or `"Clinician"` — matches `User.UserRole` enum |
| `password` | String | Initial password (`ClinicFlow@2025`) |

**Patient example**
```json
{
  "entityType": "Patient",
  "entityId": 7,
  "username": "MRN-0007",
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+1 555 000 0007",
  "role": "Patient",
  "password": "ClinicFlow@2025"
}
```

**Doctor example**
```json
{
  "entityType": "Doctor",
  "entityId": 3,
  "username": "clara.mendes@clinicflow.local",
  "fullName": "Dr. Clara Mendes",
  "email": "clara.mendes@clinicflow.local",
  "phone": "+1 (555) 201-0003",
  "role": "Clinician",
  "password": "ClinicFlow@2025"
}
```

---

### `UserProvisionedEvent`
Published to `user.provisioned`.

| Field | Type | Description |
|-------|------|-------------|
| `entityType` | String | Echoed back from the request |
| `entityId` | Long | PK of the Patient/Doctor row |
| `userId` | Long | PK of the newly created User row in user-service |

**Example**
```json
{
  "entityType": "Doctor",
  "entityId": 3,
  "userId": 42
}
```

---

## Serialization

All messages are serialized as **plain JSON strings** using Jackson `ObjectMapper`.
Both services use `StringSerializer` / `StringDeserializer` for Kafka key and value;
the JSON-to-object mapping is done manually inside each producer/consumer.

```yaml
# application.yml (both services)
spring:
  kafka:
    producer:
      key-serializer:   org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
    consumer:
      key-deserializer:   org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
```

---

## Consumer Groups

| Service | Group ID | Listens to |
|---------|----------|-----------|
| `user-service` | `user-service-group` | `consultation.user.provision` |
| `consultation-service` | `consultation-group` | `user.provisioned` |

---

## Source Files

### consultation-service

```
src/main/java/com/clinicflow/consultation/
├── event/
│   ├── UserProvisionEvent.java       # outbound event schema
│   └── UserProvisionedEvent.java     # inbound event schema
├── kafka/
│   ├── UserProvisionProducer.java    # publishes to consultation.user.provision
│   └── UserProvisionedConsumer.java  # consumes from user.provisioned
└── config/
    └── KafkaConfig.java              # NewTopic beans
```

### user-service

```
src/main/java/com/clinicflow/userservice/
├── event/
│   ├── UserProvisionEvent.java       # inbound event schema
│   └── UserProvisionedEvent.java     # outbound event schema
├── kafka/
│   ├── UserProvisionConsumer.java    # consumes from consultation.user.provision
│   └── UserProvisionedProducer.java  # publishes to user.provisioned
└── config/
    └── KafkaConfig.java              # NewTopic beans
```

---

## Error Handling

All producer and consumer methods wrap their logic in `try/catch`.
Failures are logged to stdout but **never propagate to the caller** — patient and
doctor registration always succeed even if Kafka is unavailable or user-service
is down.

Idempotency is handled in `UserService.createInactiveUser()`: if a user with the
same username already exists the method returns `null`, the consumer then looks up
the existing account and still publishes the `UserProvisionedEvent` so the
`userId` link is always written back.

---

## Running Kafka Locally

The quickest way to spin up a single-node Kafka broker for development:

```bash
# Using Docker
docker run -d --name kafka \
  -p 9092:9092 \
  -e KAFKA_CFG_NODE_ID=0 \
  -e KAFKA_CFG_PROCESS_ROLES=broker,controller \
  -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
  -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093 \
  -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  bitnami/kafka:latest
```

Topics are auto-created by the `NewTopic` beans when the services start.
No manual `kafka-topics.sh` commands are needed.
