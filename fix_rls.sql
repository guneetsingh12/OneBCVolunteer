-- Fix RLS Policies to allow full CRUD for development
-- WARNING: This allows anyone (anon) to modify data. Use only for development.

-- Allow anon to INSERT
CREATE POLICY "Allow anon insert" ON public.volunteers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anon to SELECT
CREATE POLICY "Allow anon select" ON public.volunteers FOR SELECT TO anon, authenticated USING (true);

-- Allow anon to UPDATE
CREATE POLICY "Allow anon update" ON public.volunteers FOR UPDATE TO anon, authenticated USING (true);

-- Allow anon to DELETE
CREATE POLICY "Allow anon delete" ON public.volunteers FOR DELETE TO anon, authenticated USING (true);
