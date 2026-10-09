# Encounter Microservice - ClinicFlow

## Overview

The Encounter Microservice handles clinical encounters (visits) for the ClinicFlow system. It manages the complete encounter lifecycle from creation through signing, including SOAP-formatted clinical notes, vital signs, diagnoses, and problem lists.

## Module Responsibilities

- **Encounter Management**: Create, update, complete, and sign encounters
- **Problem List Management**: Track and manage patient problems/diagnoses
- **SOAP Documentation**: Support for Subjective, Objective, Assessment, and Plan notes
- **Vital Signs Recording**: JSON-based vital signs storage
- **Clinical Decision Support**: Basic clinical rule validation (allergies, duplicates)
- **Encounter State Management**: Full lifecycle control with versioning support

## Architecture

### Tech Stack
- **Framework**: Spring Boot 4.0.6
- **Language**: Java 21
- **Database**: MySQL 8.0
- **ORM**: Hibernate/JPA
- **Mapping**: ModelMapper 3.1.1
- **Build**: Maven

### Project Structure

```
Encounter/
├── src/main/java/com/clinicflow/Encounter/
│   ├── EncounterApplication.java          # Main application entry point
│   ├── controller/                        
│   │   ├── EncounterController.java       # REST endpoints for Encounter
│   │   └── ProblemListController.java    # REST endpoints for Problem List
│   ├── service/
│   │   ├── EncounterService.java         # Business logic for Encounter
│   │   └── ProblemListService.java       # Business logic for Problem List
│   ├── repository/
│   │   ├── EncounterRepository.java      # Data access for Encounter
│   │   └── ProblemListRepository.java    # Data access for Problem List
│   ├── entity/
│   │   ├── Encounter.java                # Encounter entity with JPA annotations
│   │   ├── EncounterStatus.java          # Encounter status enum
│   │   ├── ProblemList.java              # Problem list entity
│   │   └── ProblemStatus.java            # Problem status enum
│   ├── dto/
│   │   ├── EncounterDTO.java             # Data transfer object for Encounter
│   │   ├── EncounterCreateRequest.java   # Request DTO for creating Encounter
│   │   ├── ProblemListDTO.java           # Data transfer object for Problem List
│   │   └── ProblemListCreateRequest.java # Request DTO for creating Problem List
│   ├── exception/
│   │   ├── EncounterNotFoundException.java
│   │   ├── InvalidEncounterStateException.java
│   │   ├── ProblemListNotFoundException.java
│   │   └── GlobalExceptionHandler.java   # Centralized exception handling
│   └── config/
│       └── ModelMapperConfig.java        # ModelMapper bean configuration
├── src/main/resources/
│   ├── application.properties             # Application configuration
│   └── schema.sql                        # Database schema scripts
├── pom.xml                               # Maven configuration
└── README.md
```

## Database Schema

### Encounter Table
```sql
CREATE TABLE encounter (
    encounter_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    clinician_id BIGINT NOT NULL,
    visit_type VARCHAR(50) NOT NULL,
    chief_complaint TEXT,
    vitals JSON,
    notes JSON,
    diagnoses JSON,
    orders JSON,
    prescriptions JSON,
    start_at DATETIME NOT NULL,
    end_at DATETIME,
    status VARCHAR(50) NOT NULL,
    signed_by BIGINT,
    signed_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    version BIGINT
);
```

### Problem List Table
```sql
CREATE TABLE problem_list (
    problem_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    encounter_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    onset_date DATE,
    status VARCHAR(20) NOT NULL,
    icd_code VARCHAR(20),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

## Key Features

### 1. Encounter Lifecycle Management

**Status Flow**: `IN_PROGRESS` → `COMPLETED` → `SIGNED` | `CANCELLED`

- **IN_PROGRESS**: Encounter is actively being documented
- **COMPLETED**: Clinical documentation is complete but not yet signed
- **SIGNED**: Encounter has been reviewed and signed by clinician
- **CANCELLED**: Encounter was cancelled

### 2. Concurrent Access Control

- **Optimistic Locking**: Uses version column to prevent concurrent modification conflicts
- **SELECT FOR UPDATE**: Prevents race conditions during critical operations

### 3. Clinical Data Management

- **SOAP Format**: Supports Subjective, Objective, Assessment, Plan documentation
- **JSON Storage**: Flexible storage for vital signs, diagnoses, orders via JSON
- **Problem List**: Tracks active and resolved patient problems

### 4. Audit Trail

- **Automatic Timestamps**: CreatedAt and UpdatedAt automatically managed
- **Signed Records**: Tracks who signed and when
- **Version Control**: Optimistic locking for concurrent updates

## API Endpoints

### Encounter Endpoints

#### Create Encounter
```
POST /api/encounters
Content-Type: application/json

{
  "patientId": 1,
  "clinicianId": 5,
  "visitType": "Consultation",
  "chiefComplaint": "Headache and fever",
  "vitals": { "bp": "120/80", "temp": "37.5" },
  "notes": { "subjective": "Patient complains of..." },
  "startAt": "2026-05-10T10:00:00"
}

Response: 201 Created
{
  "encounterId": 1,
  "patientId": 1,
  "clinicianId": 5,
  "status": "IN_PROGRESS",
  ...
}
```

#### Get Encounter
```
GET /api/encounters/{encounterId}

Response: 200 OK
{
  "encounterId": 1,
  ...
}
```

#### Get Patient Encounters
```
GET /api/encounters/patient/{patientId}

Response: 200 OK
[
  { "encounterId": 1, ... },
  { "encounterId": 2, ... }
]
```

#### Update Encounter
```
PUT /api/encounters/{encounterId}
Content-Type: application/json

{
  "notes": { "assessment": "Diagnosis..." },
  "diagnoses": { "icd10": ["I10"] },
  ...
}

Response: 200 OK
```

#### Complete Encounter
```
POST /api/encounters/{encounterId}/complete

Response: 200 OK
{
  "status": "COMPLETED",
  "endAt": "2026-05-10T11:00:00"
}
```

#### Sign Encounter
```
POST /api/encounters/{encounterId}/sign?clinicianId=5

Response: 200 OK
{
  "status": "SIGNED",
  "signedBy": 5,
  "signedAt": "2026-05-10T11:30:00"
}
```

#### Cancel Encounter
```
POST /api/encounters/{encounterId}/cancel

Response: 200 OK
{
  "status": "CANCELLED"
}
```

#### Add Diagnosis
```
POST /api/encounters/{encounterId}/diagnosis
Content-Type: application/json

{
  "icd10": ["I10"],
  "description": "Essential hypertension"
}

Response: 200 OK
```

#### Add Vitals
```
POST /api/encounters/{encounterId}/vitals
Content-Type: application/json

{
  "bp": "120/80",
  "temp": "37.5",
  "pulse": "72",
  "rr": "16"
}

Response: 200 OK
```

#### Get Encounters by Date Range
```
GET /api/encounters/patient/{patientId}/range?start=2026-05-01T00:00:00&end=2026-05-31T23:59:59

Response: 200 OK
[...]
```

#### Get Clinician Encounters by Status
```
GET /api/encounters/clinician/{clinicianId}/status/{status}

Response: 200 OK
[...]
```

### Problem List Endpoints

#### Add Problem
```
POST /api/problem-list
Content-Type: application/json

{
  "patientId": 1,
  "encounterId": 1,
  "code": "I10",
  "description": "Essential hypertension",
  "onsetDate": "2024-01-15",
  "icdCode": "I10"
}

Response: 201 Created
```

#### Get Problem
```
GET /api/problem-list/{problemId}

Response: 200 OK
```

#### Get Patient Problems
```
GET /api/problem-list/patient/{patientId}

Response: 200 OK
[...]
```

#### Get Active Problems
```
GET /api/problem-list/patient/{patientId}/active

Response: 200 OK
[...]
```

#### Get Encounter Problems
```
GET /api/problem-list/encounter/{encounterId}

Response: 200 OK
[...]
```

#### Update Problem
```
PUT /api/problem-list/{problemId}
Content-Type: application/json

{
  "status": "RESOLVED",
  "description": "Updated description"
}

Response: 200 OK
```

#### Resolve Problem
```
POST /api/problem-list/{problemId}/resolve

Response: 200 OK
```

## Configuration

### application.properties

```properties
# Server
server.port=8081
server.servlet.context-path=/encounter-service

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/clinicflow_encounter
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# Logging
logging.level.com.clinicflow.Encounter=DEBUG
```

## Running the Service

### Prerequisites
- Java 21+
- Maven 3.8+
- MySQL 8.0+

### Build
```bash
mvn clean install
```

### Run
```bash
mvn spring-boot:run
```

Or:
```bash
java -jar target/Encounter-0.0.1-SNAPSHOT.jar
```

### Database Setup

1. Create database:
```sql
CREATE DATABASE clinicflow_encounter;
```

2. Run schema script:
```bash
mysql -u root -p clinicflow_encounter < schema.sql
```

## Error Handling

The service implements centralized exception handling with the following error codes:

- **404 NOT_FOUND**: Encounter or Problem not found
- **400 BAD_REQUEST**: Invalid encounter state (e.g., trying to sign an in-progress encounter)
- **500 INTERNAL_SERVER_ERROR**: Unexpected server errors

Example Error Response:
```json
{
  "timestamp": "2026-05-10T10:30:00",
  "status": 400,
  "error": "Invalid Encounter State",
  "message": "Cannot update a signed encounter"
}
```

## Validation Rules

### Encounter Rules
- Cannot update a SIGNED encounter
- Can only complete IN_PROGRESS encounters
- Can only sign COMPLETED encounters
- Cannot cancel SIGNED encounters

### Problem List Rules
- Each patient can have at most one active problem with the same code
- Problems must belong to a valid encounter

## Performance Optimization

### Indexes
- `idx_patient_id` on encounter table for patient lookups
- `idx_clinician_id` on encounter table for clinician lookups
- `idx_status` on encounter table for status filtering
- `idx_encounter_patient_date` composite index for date range queries

### Caching Strategy
- Cache medication master data (updated infrequently)
- Cache clinician schedules (for availability checks)
- Implement query result caching for frequently accessed data

## Integration Points

### External Services
- **Patient Service**: Validates patientId exists
- **User Service**: Validates clinicianId exists
- **Allergy Service**: Checks medications against patient allergies
- **Prescription Service**: Links encounters to prescriptions
- **Lab Service**: Links encounters to lab orders

## Testing

### Unit Tests
Run unit tests:
```bash
mvn test
```

### Integration Tests
Integration tests verify:
- Encounter lifecycle management
- Problem list operations
- Concurrent access scenarios
- Date range queries
- Exception handling

## Deployment

### Docker Build
```dockerfile
FROM openjdk:21-jdk-slim
COPY target/Encounter-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: encounter-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: encounter-service
  template:
    metadata:
      labels:
        app: encounter-service
    spec:
      containers:
      - name: encounter-service
        image: clinicflow/encounter-service:latest
        ports:
        - containerPort: 8081
        env:
        - name: SPRING_DATASOURCE_URL
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: url
```

## Monitoring & Logging

### Health Check
```
GET /encounter-service/health
```

### Metrics
```
GET /encounter-service/metrics
```

### Logging Levels
- **DEBUG**: com.clinicflow.Encounter (detailed operation logs)
- **INFO**: Database operations, service lifecycle
- **ERROR**: Exception traces

## Future Enhancements

1. **Patient Portal Integration**: Allow patients to view their encounters
2. **Real-time Notifications**: WebSocket support for clinical events
3. **Document Upload**: Attach medical documents to encounters
4. **Voice Notes**: Support for voice-to-text clinical notes
5. **Clinical Templates**: Pre-configurable encounter templates by speciality
6. **Decision Support**: Integrate with clinical decision support systems
7. **Interoperability**: HL7/FHIR compliance for external system integration

## Contributing

When contributing, ensure:
- All tests pass
- Code follows Spring Boot conventions
- New endpoints are documented
- Database migrations are included
- Error handling is comprehensive

## Support

For issues or questions:
- Check application logs: `logs/encounter-service.log`
- Verify database connectivity
- Ensure all dependencies are installed
- Review API documentation above

## License

ClinicFlow Encounter Module - All Rights Reserved
