
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    // This is a bit tricky with just an anon key, but we can try to query common tables
    const tables = ['event_volunteers', 'event_assignments', 'event_attendees'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        console.log(`Table ${table} existence:`, !error);
    }
}

listTables();
