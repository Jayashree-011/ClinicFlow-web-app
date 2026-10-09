-- ============================================================================
-- Migration: billing service integration
--
-- Background: Three services (consultation, prescription, lab) were wired to
-- create invoices automatically.  Two schema changes are required in
-- clinicflow_billing to support this:
--
--   1. invoices table
--        Three nullable FK columns were added to the Invoice entity so that
--        every auto-generated invoice carries a back-reference to the source
--        clinical event (appointment, prescription, or lab order).
--        ddl-auto=update will add these columns on service restart, but this
--        script makes the change explicit and repeatable.
--
--   2. service_items table  ← DATA MIGRATION REQUIRED (ddl-auto will NOT fix this)
--        The BillingCategory enum was stored as an ordinal integer (0–4) because
--        @Enumerated(EnumType.STRING) was missing from the entity field.  It has
--        now been added.  Any existing rows must be back-filled from their integer
--        ordinals to the corresponding enum name strings before the application
--        restarts, otherwise Hibernate will fail to read existing rows.
--
--        Ordinal → String mapping:
--          0 = CONSULTATION
--          1 = LAB_TEST
--          2 = IMAGING
--          3 = PROCEDURE
--          4 = OTHER
--
-- Run once against your live MySQL instance BEFORE restarting billing-service:
--   mysql -u root -p < migrate-billing-integration.sql
-- ============================================================================

USE clinicflow_billing;

-- ── 1. invoices: add clinical-event reference columns ────────────────────────
--
-- ADD COLUMN IF NOT EXISTS (MySQL 8.0+) makes this step idempotent — safe to
-- re-run after ddl-auto=update has already added the columns.

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS appointment_id  BIGINT       NULL
        COMMENT 'Set when invoice was auto-generated from an appointment booking',
    ADD COLUMN IF NOT EXISTS prescription_id BIGINT       NULL
        COMMENT 'Set when invoice was auto-generated from a prescription being issued',
    ADD COLUMN IF NOT EXISTS lab_order_id    BIGINT       NULL
        COMMENT 'Set when invoice was auto-generated from a lab order creation',
    ADD COLUMN IF NOT EXISTS description     VARCHAR(500) NULL
        COMMENT 'Auto-generated human-readable summary (populated by BillingService on create/update)';

-- Back-fill descriptions for rows that existed before this migration.
-- The pattern mirrors the Java generateInvoiceDescription() logic.
UPDATE invoices
SET description = CASE
    WHEN appointment_id  IS NOT NULL THEN CONCAT('Consultation fee for Patient #', patient_id,  ' — Appointment #',  appointment_id,  '. Total: $', FORMAT(total_amount, 2))
    WHEN prescription_id IS NOT NULL THEN CONCAT('Prescription charge for Patient #', patient_id, ' — Prescription #', prescription_id, '. Total: $', FORMAT(total_amount, 2))
    WHEN lab_order_id    IS NOT NULL THEN CONCAT('Lab order fee for Patient #', patient_id, ' — Lab Order #', lab_order_id, '. Total: $', FORMAT(total_amount, 2))
    WHEN encounter_id    IS NOT NULL THEN CONCAT('Clinical encounter for Patient #', patient_id, ' — Encounter #', encounter_id, '. Total: $', FORMAT(total_amount, 2))
    ELSE                                  CONCAT('Medical services for Patient #', patient_id, '. Total: $', FORMAT(total_amount, 2))
END
WHERE description IS NULL;


-- ── 2. service_items: migrate billing_category INT ordinals → VARCHAR strings ─
--
-- This section MUST run before billing-service restarts.
-- It is NOT idempotent — run only once on a database that still has the old INT
-- column.  If the column is already VARCHAR(50) this block will fail safely
-- (DROP COLUMN of a non-existent INT column is a no-op after RENAME, and MySQL
-- will error before doing any harm — just skip this section if already applied).

-- Step 1: Add a staging column to hold the translated string values.
ALTER TABLE service_items
    ADD COLUMN billing_category_str VARCHAR(50) NULL;

-- Step 2: Translate every existing row's ordinal integer to its enum name.
UPDATE service_items
SET billing_category_str = CASE billing_category
    WHEN 0 THEN 'CONSULTATION'
    WHEN 1 THEN 'LAB_TEST'
    WHEN 2 THEN 'IMAGING'
    WHEN 3 THEN 'PROCEDURE'
    WHEN 4 THEN 'OTHER'
    ELSE 'OTHER'            -- safety net for any unexpected value
END;

-- Step 3: Drop the old INT column now that every row has been translated.
ALTER TABLE service_items
    DROP COLUMN billing_category;

-- Step 4: Rename the staging column to the canonical name and enforce NOT NULL.
ALTER TABLE service_items
    CHANGE COLUMN billing_category_str billing_category VARCHAR(50) NOT NULL;


-- ── Note on init-databases.sql ────────────────────────────────────────────────
--
-- For fresh MySQL deployments (no existing data) the init-databases.sql schema
-- definitions should also be updated to reflect the new state:
--
--   invoices table  — add the three new BIGINT columns.
--   service_items   — change billing_category from INT to VARCHAR(50).
--
-- This migration file only applies to existing databases that were created with
-- the previous schema and contain live data.
-- ============================================================================
