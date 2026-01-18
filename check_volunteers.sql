-- Check current volunteer data
SELECT id, first_name, last_name, city, riding, riding_confirmed, street_address
FROM volunteers
ORDER BY created_at DESC
LIMIT 10;
