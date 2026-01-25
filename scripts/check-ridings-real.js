
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('--- Checking Ridings ---');
    const { data: ridings, error: rErr } = await supabase.from('ridings').select('*').limit(5);
    if (rErr) {
        console.log('Ridings table error (might not exist):', rErr.message);
    } else {
        console.log('Ridings data:', ridings);
    }
}

checkTables();
