-- Update Volunteers Table
ALTER TABLE public.volunteers 
ADD COLUMN IF NOT EXISTS riding TEXT, -- Changing/Adding riding text field instead of just ID relationship for now
ADD COLUMN IF NOT EXISTS availability_times TEXT[],
ADD COLUMN IF NOT EXISTS vehicle_yn BOOLEAN, -- Alias for has_vehicle if needed or mapping
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; 

-- Just in case they don't exist yet from previous attempts
ALTER TABLE public.volunteers
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS postal_prefix TEXT,
ADD COLUMN IF NOT EXISTS team_lead_name TEXT;

