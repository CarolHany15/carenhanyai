-- DAHAB DIVE CENTER
-- Initial schema for a fresh Supabase PostgreSQL database.
-- Run this once in the Supabase SQL Editor. For an existing database with
-- customers, staff, diving_sessions, and bookings tables, use schema_update.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL
        CHECK (role IN ('admin', 'manager', 'staff', 'receptionist', 'instructor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.diving_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    session_id UUID NOT NULL REFERENCES public.diving_sessions(id),
    instructor_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    booking_phone VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bookings_customer_session UNIQUE (customer_id, session_id)
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL
        CHECK (role IN ('customer', 'receptionist', 'admin', 'manager', 'staff', 'instructor')),
    customer_id UUID UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
    staff_id UUID UNIQUE REFERENCES public.staff(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diving_sessions_start_time
    ON public.diving_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id
    ON public.bookings(customer_id);

CREATE INDEX IF NOT EXISTS idx_bookings_session_status
    ON public.bookings(session_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON public.bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_instructor_id
    ON public.bookings(instructor_id);

CREATE INDEX IF NOT EXISTS idx_staff_role
    ON public.staff(role);

COMMIT;
