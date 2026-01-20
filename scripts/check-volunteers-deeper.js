import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVolunteersSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'volunteers' });
    if (error) {
        // Try another way to get column names
        const { data: sample, error: selectError } = await supabase.from('volunteers').select('*').limit(1);
        console.log('Columns from select:', sample ? Object.keys(sample[0] || {}) : 'No data');
    } else {
        console.log('Columns from RPC:', data);
    }
}

checkVolunteersSchema();
