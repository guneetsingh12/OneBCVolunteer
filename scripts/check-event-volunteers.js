
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventVolunteers() {
    const { data, error } = await supabase.from('event_volunteers').select('*').limit(1);
    if (error) {
        console.log('Error or empty:', error.message);
        // Try to trigger a column error
        const { error: err } = await supabase.from('event_volunteers').select('non_existent').limit(1);
        console.log('Error hint:', err?.message);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('Table exists but is empty. Trying to guess columns...');
        const commonCols = ['event_id', 'volunteer_id', 'status', 'created_at'];
        for (const col of commonCols) {
            const { error: e } = await supabase.from('event_volunteers').select(col).limit(1);
            console.log(`Column ${col}:`, !e);
        }
    }
}

checkEventVolunteers();
