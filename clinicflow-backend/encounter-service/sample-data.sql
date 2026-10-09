-- Sample Data for Testing

-- Insert test user (Clinician)
INSERT INTO user (name, role, email, phone, password_hash, status, created_at, updated_at) 
VALUES ('Dr. John Smith', 'Clinician', 'john.smith@clinic.com', '+1234567890', 'hash_password', 'Active', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert test patient
INSERT INTO patient (mrn, name, dob, gender, status, created_at)
VALUES ('MRN-2026-001', 'Jane Doe', '1990-05-15', 'F', 'Active', NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Sample encounter (after running main migrations)
INSERT INTO encounter (patient_id, clinician_id, visit_type, chief_complaint, start_at, status, created_at, updated_at)
VALUES (1, 1, 'Consultation', 'General checkup', NOW(), 'IN_PROGRESS', NOW(), NOW());

-- Sample problem list entry
INSERT INTO problem_list (patient_id, encounter_id, code, description, status, created_at, updated_at)
VALUES (1, 1, 'I10', 'Essential hypertension', 'ACTIVE', NOW(), NOW());
