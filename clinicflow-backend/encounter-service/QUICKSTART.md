# Quick Start Guide - Encounter Microservice

## Prerequisites
- Java 21 JDK
- Maven 3.8+
- MySQL 8.0+
- Docker (for containerized deployment)
- Git

## Local Development Setup

### Step 1: Clone and Navigate
```bash
cd clinicflow-backend/Encounter
```

### Step 2: Configure Database

Create MySQL database:
```bash
mysql -u root -p
```

```sql
CREATE DATABASE clinicflow_encounter;
CREATE DATABASE clinicflow_encounter_test;
```

### Step 3: Update Application Properties

Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/clinicflow_encounter
spring.datasource.username=root
spring.datasource.password=your_password
```

For testing, create `application-test.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/clinicflow_encounter_test
spring.jpa.hibernate.ddl-auto=create-drop
```

### Step 4: Build the Application

```bash
# Clean build
mvn clean install

# Skip tests
mvn clean install -DskipTests

# Build and run tests
mvn clean test
```

### Step 5: Run the Service

Using Maven:
```bash
mvn spring-boot:run
```

Or using JAR:
```bash
java -jar target/Encounter-0.0.1-SNAPSHOT.jar
```

### Step 6: Verify Service is Running

Health check:
```bash
curl http://localhost:8081/encounter-service/health
```

Response:
```json
{
  "status": "UP"
}
```

---

## Docker Deployment

### Build Docker Image
```bash
# Build Maven project first
mvn clean package

# Build Docker image
docker build -t clinicflow/encounter-service:latest .
```

### Run with Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f encounter-service

# Stop services
docker-compose down
```

### Verify Docker Deployment
```bash
# Check containers
docker-compose ps

# Test service
curl http://localhost:8081/encounter-service/health
```

---

## Kubernetes Deployment

### Prerequisites
- kubectl configured
- Kubernetes cluster running
- Docker image pushed to registry

### Create Namespace
```bash
kubectl create namespace clinicflow
```

### Create ConfigMap for Application Properties
```bash
kubectl create configmap encounter-config \
  --from-file=application-k8s.properties \
  -n clinicflow
```

### Create Secret for Database Credentials
```bash
kubectl create secret generic db-credentials \
  --from-literal=username=root \
  --from-literal=password=your_password \
  -n clinicflow
```

### Apply Kubernetes Manifests
```yaml
# encounter-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: encounter-service
  namespace: clinicflow
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
        imagePullPolicy: Always
        ports:
        - containerPort: 8081
        env:
        - name: SPRING_DATASOURCE_URL
          value: jdbc:mysql://mysql-service:3306/clinicflow_encounter
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /encounter-service/health/liveness
            port: 8081
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /encounter-service/health/readiness
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: encounter-service
  namespace: clinicflow
spec:
  type: ClusterIP
  selector:
    app: encounter-service
  ports:
  - protocol: TCP
    port: 8081
    targetPort: 8081
```

Deploy:
```bash
kubectl apply -f encounter-deployment.yaml
```

---

## Testing

### Run Unit Tests
```bash
mvn test
```

### Run Integration Tests
```bash
mvn verify
```

### Run Specific Test Class
```bash
mvn test -Dtest=EncounterServiceTest
```

### Run Test with Coverage
```bash
mvn clean test jacoco:report
```

View coverage report:
```
target/site/jacoco/index.html
```

---

## API Testing

### Using curl

Create Encounter:
```bash
curl -X POST http://localhost:8081/encounter-service/api/encounters \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "clinicianId": 5,
    "visitType": "Consultation",
    "chiefComplaint": "Fever",
    "startAt": "2026-05-10T10:00:00"
  }'
```

Get Encounter:
```bash
curl http://localhost:8081/encounter-service/api/encounters/1
```

### Using Postman

1. Import the collection from `postman-collection.json`
2. Update environment variables
3. Run requests

### Using REST Client (VS Code)

Create `requests.http`:
```http
### Create Encounter
POST http://localhost:8081/encounter-service/api/encounters
Content-Type: application/json

{
  "patientId": 1,
  "clinicianId": 5,
  "visitType": "Consultation",
  "chiefComplaint": "Fever",
  "startAt": "2026-05-10T10:00:00"
}

### Get Encounter
GET http://localhost:8081/encounter-service/api/encounters/1
```

---

## Database Management

### Initialize Schema
```bash
mysql -u root -p clinicflow_encounter < schema.sql
```

### Load Sample Data
```bash
mysql -u root -p clinicflow_encounter < sample-data.sql
```

### Backup Database
```bash
mysqldump -u root -p clinicflow_encounter > backup.sql
```

### Restore Database
```bash
mysql -u root -p clinicflow_encounter < backup.sql
```

---

## Troubleshooting

### Service won't start

**Check logs:**
```bash
# Maven run
mvn spring-boot:run 2>&1 | tail -50

# Docker
docker-compose logs encounter-service
```

**Common issues:**
1. Port 8081 already in use: Change in `application.properties`
2. Database connection failed: Verify MySQL is running
3. MissingBeanDefinition: Missing dependency - check pom.xml

### Database connection errors

```bash
# Check MySQL is running
sudo service mysql status

# Test connection
mysql -u root -p -h localhost

# Check database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'clinicflow_encounter';"
```

### Tests failing

```bash
# Clear Maven cache
mvn clean install -U

# Run with debug output
mvn test -X

# Run single test
mvn test -Dtest=EncounterServiceTest#testCreateEncounter
```

---

## Performance Tuning

### JVM Parameters
```bash
java -Xmx1g -Xms512m -Xss256k \
  -XX:+UseG1GC \
  -jar Encounter-0.0.1-SNAPSHOT.jar
```

### Database Connection Pool
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
```

### Caching
```properties
spring.cache.type=redis
spring.redis.host=localhost
spring.redis.port=6379
```

---

## Monitoring

### Health Endpoints
- Liveness: `GET /encounter-service/health/liveness`
- Readiness: `GET /encounter-service/health/readiness`

### Metrics
```bash
curl http://localhost:8081/encounter-service/metrics
```

### Logs
```bash
# View recent logs
tail -f logs/encounter-service.log

# Filter by level
grep "ERROR" logs/encounter-service.log
```

---

## Production Checklist

- [ ] Database backups configured
- [ ] Logging aggregation setup
- [ ] Monitoring and alerting configured
- [ ] API documentation reviewed
- [ ] Security scan completed
- [ ] Load testing performed
- [ ] Deployment runbooks created
- [ ] Rollback procedure documented

---

## Support

For issues or questions:
1. Check `logs/encounter-service.log`
2. Review API_DOCUMENTATION.md
3. Check ENCOUNTER_MODULE_README.md
4. Contact DevOps team

---

## Next Steps

1. Set up CI/CD pipeline
2. Configure API gateway routing
3. Set up service mesh (Istio/Linkerd)
4. Implement distributed tracing
5. Set up centralized logging (ELK Stack)
