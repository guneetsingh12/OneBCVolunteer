
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findFenton() {
    console.log('--- Finding Fenton Travers ---');
    const { data: v, error: vErr } = await supabase
        .from('volunteers')
        .select('id, email, first_name, last_name')
        .ilike('email', '%fenton.travers%');

    if (vErr) {
        console.error('Error finding Fenton:', vErr.message);
        return;
    }

    console.log('Volunteer records found:', v);

    if (v && v.length > 0) {
        const vId = v[0].id;
        console.log(`\n--- Checking assignments for Fenton (ID: ${vId}) ---`);
        const { data: ev, error: evErr } = await supabase
            .from('event_volunteers')
            .select('*, events(*)')
            .eq('volunteer_id', vId);

        if (evErr) {
            console.error('Error finding assignments:', evErr.message);
        } else {
            console.log('Assignments count:', ev?.length || 0);
            console.log('Assignments details:', JSON.stringify(ev, null, 2));
        }
    }
}

findFenton();
