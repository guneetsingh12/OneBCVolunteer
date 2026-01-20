import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVolunteers() {
    const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Volunteer Columns:', data[0] ? Object.keys(data[0]) : 'No data');
    }
}

checkVolunteers();
