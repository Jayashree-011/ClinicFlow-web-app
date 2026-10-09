-- ============================================================================
-- ClinicFlow – Production Database Initialisation Script
-- Run once against a fresh MySQL instance before starting any service.
-- All databases use utf8mb4 / utf8mb4_unicode_ci.
-- Table DDL mirrors the JPA entity definitions; Hibernate ddl-auto=update
-- will reconcile any drift on startup.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================================
-- 1. USER-SERVICE  →  clinicflow_users
-- ============================================================================
CREATE DATABASE IF NOT EXISTS clinicflow_users
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinicflow_users;

CREATE TABLE IF NOT EXISTS users (
    user_id         BIGINT          NOT NULL AUTO_INCREMENT,
    username        VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(255)    NOT NULL,
    role            VARCHAR(50)     NOT NULL,   -- UserRole enum (STRING)
    email           VARCHAR(255)    NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    phone           VARCHAR(255),
    status          VARCHAR(50)     NOT NULL,   -- UserStatus enum (STRING)
    clinic_name     VARCHAR(255),
    address         VARCHAR(255),
    city            VARCHAR(255),
    notif_email_alerts   BOOLEAN,
    notif_appointments   BOOLEAN,
    notif_billing        BOOLEAN,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME        NOT NULL,
    session_token   VARCHAR(255),
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_username     (username),
    UNIQUE KEY uq_users_email        (email),
    UNIQUE KEY uq_users_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 2. CONSULTATION-SERVICE  →  clinicflow_consultation
-- ============================================================================
CREATE DATABASE IF NOT EXISTS clinicflow_consultation
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinicflow_consultation;

CREATE TABLE IF NOT EXISTS doctors (
    doctor_id       BIGINT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(255)    NOT NULL,
    specialty       VARCHAR(255),
    qualification   VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(255),
    status          VARCHAR(255),
    user_id         BIGINT,
    PRIMARY KEY (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patients (
    patient_id              BIGINT          NOT NULL AUTO_INCREMENT,
    mrn                     VARCHAR(255)    NOT NULL,
    name                    VARCHAR(255)    NOT NULL,
    dob                     DATE,
    gender                  VARCHAR(255),
    contact_info            VARCHAR(2000),
    address                 VARCHAR(2000),
    primary_contact         VARCHAR(255),
    status                  VARCHAR(255),
    user_id                 BIGINT,
    created_at              DATETIME,
    updated_at              DATETIME,
    patient_condition       VARCHAR(255),
    last_visit_date         DATE,
    registered_by_user_id   BIGINT,
    PRIMARY KEY (patient_id),
    UNIQUE KEY uq_patients_mrn (mrn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id  BIGINT          NOT NULL AUTO_INCREMENT,
    patient_id      BIGINT          NOT NULL,
    doctor_id       BIGINT          NOT NULL,
    department      VARCHAR(255),
    service_type    VARCHAR(255),
    start_at        DATETIME,
    end_at          DATETIME,
    status          VARCHAR(255),
    created_at      DATETIME,
    updated_at      DATETIME,
    PRIMARY KEY (appointment_id),
    CONSTRAINT fk_appt_patient  FOREIGN KEY (patient_id) REFERENCES patients (patient_id),
    CONSTRAINT fk_appt_doctor   FOREIGN KEY (doctor_id)  REFERENCES doctors  (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 3. BILLING-SERVICE  →  clinicflow_billing
-- ============================================================================
CREATE DATABASE IF NOT EXISTS clinicflow_billing
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinicflow_billing;

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id      BIGINT              NOT NULL AUTO_INCREMENT,
    patient_id      BIGINT              NOT NULL,
    encounter_id    BIGINT,
    appointment_id  BIGINT,                         -- set when auto-generated from an appointment booking
    prescription_id BIGINT,                         -- set when auto-generated from a prescription being issued
    lab_order_id    BIGINT,                         -- set when auto-generated from a lab order creation
    description     VARCHAR(500),                   -- auto-generated human-readable summary (BillingService)
    line_items_json TEXT,
    subtotal        DECIMAL(10, 2)      NOT NULL,
    taxes           DECIMAL(10, 2)      NOT NULL,
    discounts       DECIMAL(10, 2)      NOT NULL,
    total_amount    DECIMAL(10, 2)      NOT NULL,
    status          VARCHAR(50)         NOT NULL,   -- InvoiceStatus enum (STRING)
    issued_at       DATETIME            NOT NULL,
    PRIMARY KEY (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_items (
    service_item_id     BIGINT          NOT NULL AUTO_INCREMENT,
    code                VARCHAR(50)     NOT NULL,
    description         VARCHAR(255)    NOT NULL,
    patient_id          BIGINT          NOT NULL,
    invoice_id          BIGINT          NOT NULL,
    price               DECIMAL(10, 2)  NOT NULL,
    department          VARCHAR(255)    NOT NULL,
    billing_category    VARCHAR(50)     NOT NULL,   -- BillingCategory enum (STRING): CONSULTATION,LAB_TEST,IMAGING,PROCEDURE,OTHER
    status              VARCHAR(50)     NOT NULL,   -- ServiceStatus enum (STRING)
    PRIMARY KEY (service_item_id),
    UNIQUE KEY uq_service_items_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    payment_id      BIGINT          NOT NULL AUTO_INCREMENT,
    invoice_id      BIGINT          NOT NULL,
    patient_id      BIGINT          NOT NULL,
    amount          DECIMAL(10, 2)  NOT NULL,
    payment_method  VARCHAR(50)     NOT NULL,   -- PaymentMethod enum (STRING)
    paid_at         DATETIME        NOT NULL,
    status          VARCHAR(50)     NOT NULL,   -- PaymentStatus enum (STRING)
    PRIMARY KEY (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS insurance_claims (
    claim_id            BIGINT      NOT NULL AUTO_INCREMENT,
    invoice_id          BIGINT      NOT NULL,
    patient_id          BIGINT      NOT NULL,
    claim_payload_json  TEXT,
    response_json       TEXT,
    status              VARCHAR(50) NOT NULL,   -- ClaimStatus enum (STRING)
    submitted_at        DATETIME    NOT NULL,
    PRIMARY KEY (claim_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 4. ENCOUNTER-SERVICE  →  clinicflow_encounter
-- ============================================================================
CREATE DATABASE IF NOT EXISTS clinicflow_encounter
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinicflow_encounter;

CREATE TABLE IF NOT EXISTS encounter (
    encounter_id    BIGINT          NOT NULL AUTO_INCREMENT,
    patient_id      BIGINT          NOT NULL,
    doctor_id       BIGINT          NOT NULL,
    visit_type      VARCHAR(255)    NOT NULL,
    chief_complaint TEXT,
    vitals          JSON,
    notes           JSON,
    diagnoses       JSON,
    orders          JSON,
    prescriptions   JSON,
    start_at        DATETIME        NOT NULL,
    end_at          DATETIME,
    status          VARCHAR(50)     NOT NULL,   -- EncounterStatus enum (STRING)
    signed_by       BIGINT,
    signed_at       DATETIME,
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME,
    version         BIGINT,                     -- optimistic-lock @Version
    PRIMARY KEY (encounter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS problem_list (
    problem_id      BIGINT          NOT NULL AUTO_INCREMENT,
    patient_id      BIGINT          NOT NULL,
    encounter_id    BIGINT          NOT NULL,
    code            VARCHAR(255)    NOT NULL,
    description     TEXT,
    onset_date      DATE,
    status          VARCHAR(50)     NOT NULL,   -- ProblemStatus enum (STRING)
    icd_code        VARCHAR(255),
    created_at      DATETIME        NOT NULL,
    updated_at      DATETIME,
    PRIMARY KEY (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 5. LAB-SERVICE  →  clinicflow_lab
-- ============================================================================
CREATE DATABASE IF NOT EXISTS clinicflow_lab
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinicflow_lab;

CREATE TABLE IF NOT EXISTS lab_order (
    lab_order_id    BIGINT          NOT NULL AUTO_INCREMENT,
    encounter_id    BIGINT,
    patient_id      BIGINT,
    ordered_by      BIGINT,
    tests_json      TEXT,
    sample_id       VARCHAR(255),
    collected_at    DATETIME,
    status          VARCHAR(255),
    result_uri      VARCHAR(255),
    PRIMARY KEY (lab_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_result (
    result_id               BIGINT          NOT NULL AUTO_INCREMENT,
    lab_order_id            BIGINT,
    test_code               VARCHAR(255),
    result_value            VARCHAR(255),
    units                   VARCHAR(255),
    reference_range_json    TEXT,
    flag                    VARCHAR(50),    -- Flag enum (STRING): NORMAL,HIGH,LOW,CRITICAL
    reported_at             DATETIME,
    reported_by             BIGINT,
    PRIMARY KEY (result_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 6. NOTIFICATION-SERVICE  →  clinicflow_notification
-- ============================================================================
CREATE DATABASE IF NOT EXISTS clinicflow_notification
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinicflow_notification;

CREATE TABLE IF NOT EXISTS notification (
    notification_id BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT,
    patient_id      BIGINT,
    entity_id       BIGINT,
    message         VARCHAR(255),
    category        VARCHAR(255),
    channel         VARCHAR(50),    -- Channel enum (STRING): SMS,EMAIL,PUSH
    severity        VARCHAR(255),
    created_at      DATETIME,
    read_at         DATETIME,
    status          VARCHAR(255),
    PRIMARY KEY (notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task (
    task_id             BIGINT          NOT NULL AUTO_INCREMENT,
    assigned_to         BIGINT,
    related_entity_id   BIGINT,
    description         VARCHAR(255),
    due_date            DATETIME,
    priority            VARCHAR(255),
    created_at          DATETIME,
    completed_at        DATETIME,
    status              VARCHAR(255),
    PRIMARY KEY (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 7. PHARMACY-SERVICE  →  clinicflow_pharmacy
-- ============================================================================
CREATE DATABASE IF NOT EXISTS clinicflow_pharmacy
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinicflow_pharmacy;

CREATE TABLE IF NOT EXISTS inventory_item (
    inventory_id        BIGINT          NOT NULL AUTO_INCREMENT,
    med_id              BIGINT,
    medication_name     VARCHAR(255),
    batch_number        VARCHAR(255),
    quantity            INT,
    unit                VARCHAR(255),
    expiry_date         DATE,
    location            VARCHAR(255),
    cost_price          DECIMAL(10, 2),
    status              VARCHAR(255),
    PRIMARY KEY (inventory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispense_record (
    dispense_id         BIGINT          NOT NULL AUTO_INCREMENT,
    rx_id               BIGINT,
    inventory_id        BIGINT,
    patient_id          BIGINT,
    dispensed_by        BIGINT,
    medication_name     VARCHAR(255),
    quantity            INT,
    dispensed_at        DATETIME,
    status              VARCHAR(255),
    notes               VARCHAR(255),
    PRIMARY KEY (dispense_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 8. PRESCRIPTION-SERVICE  →  clinicflow_prescription
-- ============================================================================
CREATE DATABASE IF NOT EXISTS clinicflow_prescription
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinicflow_prescription;

CREATE TABLE IF NOT EXISTS medication_master (
    med_id          BIGINT          NOT NULL AUTO_INCREMENT,
    code            VARCHAR(255),
    name            VARCHAR(255),
    formulation     VARCHAR(255),
    strength        VARCHAR(255),
    status          VARCHAR(255),
    PRIMARY KEY (med_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prescription (
    rx_id           BIGINT          NOT NULL AUTO_INCREMENT,
    encounter_id    BIGINT,
    patient_id      BIGINT,
    doctor_id       BIGINT,
    med_id          BIGINT,
    medication_name VARCHAR(255),
    dosage          VARCHAR(255),
    frequency       VARCHAR(255),
    duration_days   INT,
    quantity        INT,
    repeats         INT,
    route           VARCHAR(255),
    notes           VARCHAR(255),
    status          VARCHAR(50),    -- PrescriptionStatus enum (STRING)
    issued_at       DATETIME,
    PRIMARY KEY (rx_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- Run this script as a MySQL superuser, e.g.:
--   mysql -u root -p < init-databases.sql
-- Then grant per-service credentials if needed:
--   CREATE USER 'clinicflow'@'%' IDENTIFIED BY '<password>';
--   GRANT ALL PRIVILEGES ON clinicflow_users.*        TO 'clinicflow'@'%';
--   GRANT ALL PRIVILEGES ON clinicflow_consultation.* TO 'clinicflow'@'%';
--   GRANT ALL PRIVILEGES ON clinicflow_billing.*      TO 'clinicflow'@'%';
--   GRANT ALL PRIVILEGES ON clinicflow_encounter.*    TO 'clinicflow'@'%';
--   GRANT ALL PRIVILEGES ON clinicflow_lab.*          TO 'clinicflow'@'%';
--   GRANT ALL PRIVILEGES ON clinicflow_notification.* TO 'clinicflow'@'%';
--   GRANT ALL PRIVILEGES ON clinicflow_pharmacy.*     TO 'clinicflow'@'%';
--   GRANT ALL PRIVILEGES ON clinicflow_prescription.* TO 'clinicflow'@'%';
--   FLUSH PRIVILEGES;
