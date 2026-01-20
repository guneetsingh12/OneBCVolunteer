import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnum() {
    const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'app_role' });
    if (error) {
        console.error('Error fetching enum:', error.message);
        // Fallback: try to insert a fake record and see the error
        const { error: insertError } = await supabase.from('user_roles').insert({ role: 'director' });
        console.log('Insert director error:', insertError?.message);
    } else {
        console.log('Enum values:', data);
    }
}

checkEnum();
