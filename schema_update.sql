-- DAHAB DIVE CENTER
-- schema_update.sql
-- Safe, additive migration for the existing schema and the earlier update script.
-- Run this in the Supabase SQL Editor. It does not drop tables or delete rows.

BEGIN;

-- 1. Remove the old Supabase Auth foreign keys.
-- Existing customer and staff IDs and records remain unchanged.
ALTER TABLE public.customers
    DROP CONSTRAINT IF EXISTS fk_customers_auth;

ALTER TABLE public.staff
    DROP CONSTRAINT IF EXISTS fk_staff_auth;

-- 2. Ensure the custom-login table exists.
-- Register customers through the backend; do not expose receptionist registration.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL
        CHECK (role IN ('customer', 'receptionist', 'admin', 'manager', 'staff', 'instructor')),
    customer_id UUID UNIQUE,
    staff_id UUID UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add profile links if users was created by the earlier migration.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS customer_id UUID;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS staff_id UUID;

-- 4. Add foreign keys only if they do not already exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_users_customer'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT fk_users_customer
            FOREIGN KEY (customer_id)
            REFERENCES public.customers(id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_users_staff'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT fk_users_staff
            FOREIGN KEY (staff_id)
            REFERENCES public.staff(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Allow receptionist and instructor staff profiles.
ALTER TABLE public.staff
    DROP CONSTRAINT IF EXISTS staff_role_check;

ALTER TABLE public.staff
    ADD CONSTRAINT staff_role_check
    CHECK (role IN ('admin', 'manager', 'staff', 'receptionist', 'instructor'));

-- 6. Add booking fields required by the booking form.
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS instructor_id UUID;

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS booking_phone VARCHAR(30);

-- 7. Link optional booking instructor to staff.
-- If an instructor profile is removed, retain the booking and clear the assignment.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_bookings_instructor'
          AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE public.bookings
            ADD CONSTRAINT fk_bookings_instructor
            FOREIGN KEY (instructor_id)
            REFERENCES public.staff(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 8. Add indexes used by login, booking lists, and instructor lookups.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_customer_id
    ON public.users(customer_id)
    WHERE customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_staff_id
    ON public.users(staff_id)
    WHERE staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON public.bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_instructor_id
    ON public.bookings(instructor_id);

COMMIT;
