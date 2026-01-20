import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else {
        // Even if no data, we can sometimes get headers from a join or other tricks
        // But let's try to find if there's any record at all.
        console.log('Data:', data);
    }
}

checkColumns();
