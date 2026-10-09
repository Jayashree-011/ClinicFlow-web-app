-- Database Schema for Encounter Module

-- Create Encounter Table
CREATE TABLE IF NOT EXISTS encounter (
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
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    signed_by BIGINT,
    signed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    FOREIGN KEY (clinician_id) REFERENCES user(user_id),
    FOREIGN KEY (signed_by) REFERENCES user(user_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_clinician_id (clinician_id),
    INDEX idx_status (status),
    INDEX idx_start_at (start_at),
    UNIQUE KEY unique_encounter_slot (clinician_id, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Problem List Table
CREATE TABLE IF NOT EXISTS problem_list (
    problem_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    encounter_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    onset_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    icd_code VARCHAR(20),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    FOREIGN KEY (encounter_id) REFERENCES encounter(encounter_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_encounter_id (encounter_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_patient_problem (patient_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Indexes for Performance Optimization
CREATE INDEX idx_encounter_patient_date ON encounter(patient_id, start_at, status);
CREATE INDEX idx_encounter_clinician_date ON encounter(clinician_id, start_at, status);
CREATE INDEX idx_problem_list_patient_status ON problem_list(patient_id, status);
CREATE INDEX idx_problem_list_encounter ON problem_list(encounter_id, status);

-- Create Trigger for Encounter Updated At
DELIMITER $$
CREATE TRIGGER encounter_update_trigger
BEFORE UPDATE ON encounter
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END $$
DELIMITER ;

-- Create Trigger for Problem List Updated At
DELIMITER $$
CREATE TRIGGER problem_list_update_trigger
BEFORE UPDATE ON problem_list
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END $$
DELIMITER ;
