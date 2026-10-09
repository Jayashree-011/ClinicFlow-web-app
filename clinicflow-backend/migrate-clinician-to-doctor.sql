-- ============================================================================
-- Migration: rename clinician_id → doctor_id
--
-- Background: ddl-auto=update added a new doctor_id column when the JPA
-- entity field was renamed, but never removed the old clinician_id column.
-- This script:
--   1. Copies any existing data from clinician_id → doctor_id
--   2. Enforces the NOT NULL constraint on encounter.doctor_id
--   3. Drops the stale clinician_id columns from both tables
--
-- Run once against your live MySQL instance:
--   mysql -u root -p < migrate-clinician-to-doctor.sql
-- ============================================================================

-- ── encounter table (clinicflow_encounter) ───────────────────────────────────

USE clinicflow_encounter;

-- Step 1: Back-fill doctor_id from clinician_id for any existing rows
UPDATE encounter
SET    doctor_id = clinician_id
WHERE  doctor_id IS NULL
  AND  clinician_id IS NOT NULL;

-- Step 2: Enforce NOT NULL now that all rows have a value
ALTER TABLE encounter
    MODIFY COLUMN doctor_id BIGINT NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE encounter
    DROP COLUMN clinician_id;


-- ── prescription table (clinicflow_prescription) ─────────────────────────────

USE clinicflow_prescription;

-- Step 1: Back-fill doctor_id from clinician_id for any existing rows
UPDATE prescription
SET    doctor_id = clinician_id
WHERE  doctor_id IS NULL
  AND  clinician_id IS NOT NULL;

-- Step 2: Drop the old column (prescription.doctor_id is nullable, no MODIFY needed)
ALTER TABLE prescription
    DROP COLUMN clinician_id;
