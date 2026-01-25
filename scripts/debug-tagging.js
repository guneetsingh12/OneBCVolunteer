
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    console.log('--- Checking Events ---');
    const { data: events, error: eErr } = await supabase.from('events').select('*').limit(5);
    console.log('Events:', events?.length || 0, events);

    console.log('\n--- Checking Event Volunteers ---');
    const { data: ev, error: evErr } = await supabase.from('event_volunteers').select('*').limit(5);
    console.log('Event Volunteers:', ev?.length || 0, ev);

    console.log('\n--- Checking Volunteers ---');
    const { data: volunteers, error: vErr } = await supabase.from('volunteers').select('id, first_name, last_name, email, region').limit(5);
    console.log('Volunteers:', volunteers?.length || 0, volunteers);
}

debugData();
