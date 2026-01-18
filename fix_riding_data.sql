-- Fix riding data that contains city names instead of electoral districts
-- Run this in Supabase SQL Editor

-- Clear riding field where it contains city names
UPDATE volunteers
SET 
    riding = NULL,
    riding_confirmed = false,
    updated_at = NOW()
WHERE 
    riding IN ('Vancouver', 'West Vancouver', 'North Vancouver', 'Burnaby', 'Richmond', 'Surrey', 'Victoria', 'Kelowna', 'Kamloops', 'Prince George')
    OR riding IS NULL
    OR riding = ''
    OR riding_confirmed = false;

-- Verify the update
SELECT 
    id, 
    first_name, 
    last_name, 
    city, 
    riding, 
    riding_confirmed,
    street_address
FROM volunteers
WHERE riding_confirmed = false OR riding IS NULL
ORDER BY created_at DESC;
