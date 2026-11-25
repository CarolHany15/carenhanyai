-- OPTIONAL DEMO DATA ONLY.
-- Run this AFTER schema_update.sql if you want sample instructors and future sessions.
-- Safe to re-run: instructor emails and session titles are checked before insertion.

INSERT INTO public.staff (full_name, email, role)
SELECT 'Ahmed Hassan', 'ahmed.instructor@dahabdive.example', 'instructor'
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff WHERE email = 'ahmed.instructor@dahabdive.example'
);

INSERT INTO public.staff (full_name, email, role)
SELECT 'Mariam Ali', 'mariam.instructor@dahabdive.example', 'instructor'
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff WHERE email = 'mariam.instructor@dahabdive.example'
);

INSERT INTO public.diving_sessions (title, start_time, capacity, price, status)
SELECT 'Discover Scuba Diving', NOW() + INTERVAL '2 days', 6, 1800, 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM public.diving_sessions
  WHERE title = 'Discover Scuba Diving' AND start_time > NOW()
);

INSERT INTO public.diving_sessions (title, start_time, capacity, price, status)
SELECT 'Blue Hole Adventure', NOW() + INTERVAL '4 days', 5, 2200, 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM public.diving_sessions
  WHERE title = 'Blue Hole Adventure' AND start_time > NOW()
);

INSERT INTO public.diving_sessions (title, start_time, capacity, price, status)
SELECT 'Coral Garden Exploration', NOW() + INTERVAL '6 days', 8, 1500, 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM public.diving_sessions
  WHERE title = 'Coral Garden Exploration' AND start_time > NOW()
);
