
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActivities() {
    console.log('--- Checking Activities ---');
    const { data: acts, error: aErr } = await supabase.from('activities').select('*').limit(5);
    if (aErr) console.error(aErr);
    console.log('Sample Activities:', acts);

    const { data: counts, error: cErr } = await supabase.from('activities').select('doors_knocked, calls_made');
    if (counts) {
        const totalDoors = counts.reduce((sum, a) => sum + (Number(a.doors_knocked) || 0), 0);
        const totalCalls = counts.reduce((sum, a) => sum + (Number(a.calls_made) || 0), 0);
        console.log('Calculated Totals -> Doors:', totalDoors, 'Calls:', totalCalls);
    }
}

checkActivities();
