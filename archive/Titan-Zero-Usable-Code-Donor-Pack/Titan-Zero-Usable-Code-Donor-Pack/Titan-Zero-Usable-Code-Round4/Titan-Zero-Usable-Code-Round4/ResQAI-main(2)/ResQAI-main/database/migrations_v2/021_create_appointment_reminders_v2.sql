-- ResQAI V2 Migration 021
-- Date:    2026-06-29
-- Purpose: Create appointment_reminders_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create appointment_reminders_v2 table
-- ============================================================
-- lemma table create appointment_reminders_v2
--   id --type UUID --pk
--   appointment_id --type UUID --nullable            -- FK -> appointments_v2(id) ON DELETE CASCADE
--   reminder_type --type TEXT --nullable
--   scheduled_for --type TIMESTAMPTZ --nullable
--   sent_at --type TIMESTAMPTZ --nullable
--   channel --type TEXT --nullable
--   status --type TEXT --nullable --default "pending"
--   error_message --type TEXT --nullable
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe appointment_reminders_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index appointment_reminders_v2 appointment_id
-- lemma table add-index appointment_reminders_v2 status_scheduled_for --type INDEX --expression "(status, scheduled_for)"

-- Verify: lemma table list-indexes appointment_reminders_v2
