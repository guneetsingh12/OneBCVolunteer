# Riding Extraction Issue - Diagnosis and Fix

## Problem
The "Riding" column in the volunteer table is showing city names (Vancouver, West Vancouver) instead of electoral districts.

## Root Cause
During CSV import, the `riding` field is being populated from the CSV's "Riding" column. If your CSV has city names in that column instead of actual electoral district names, they get imported as-is.

## Solution

### Option 1: Clear Invalid Riding Data (Recommended)
Run this SQL in your Supabase SQL Editor to clear riding data that looks like city names:

```sql
-- Clear riding field where it contains common city names
UPDATE volunteers
SET riding = NULL,
    riding_confirmed = false
WHERE riding IN ('Vancouver', 'West Vancouver', 'North Vancouver', 'Burnaby', 'Richmond', 'Surrey', 'Victoria')
   OR riding IS NULL
   OR riding = '';
```

After running this, use the "Extract Riding" button to fetch the correct electoral districts.

### Option 2: Prevent City Names During Import
The CSV import should not accept city names as riding names. The import logic at line 176-185 tries to auto-lookup if riding is empty or contains "Needs Review", but it doesn't check if the riding value is actually a city name.

## Steps to Fix Your Current Data

1. **Open Supabase Dashboard**:
   - Go to https://vyxozhupdnnfdolfogev.supabase.co
   - Navigate to SQL Editor

2. **Run the cleanup query**:
   ```sql
   UPDATE volunteers
   SET riding = NULL,
       riding_confirmed = false
   WHERE riding IN ('Vancouver', 'West Vancouver', 'North Vancouver')
      OR riding_confirmed = false;
   ```

3. **Refresh your application** (F5)

4. **Click "Extract Riding"** button
   - The agent will now process all volunteers with `riding_confirmed = false`
   - Watch the browser window open and extract the correct districts

## Expected Behavior After Fix

- Riding column should show: "Vancouver-Point Grey (VNP)", "West Vancouver-Sea to Sky (WSS)", etc.
- City column should show: "Vancouver", "West Vancouver", etc.
- The warning triangle icon should disappear after successful extraction

## Verification

After extraction completes, check the browser console (F12) for logs like:
```
[Extract] Response for Dmytro Bilous: {riding: "Vancouver-Point Grey (VNP)", success: true}
[Extract] Successfully updated database for Dmytro Bilous
```

If you see database errors, check the RLS policies in Supabase.
