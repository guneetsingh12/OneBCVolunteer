import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    // Try to use a common RPC or just guess common names
    const columns = ['id', 'user_id', 'role', 'password', 'created_at', 'volunteer_id', 'email', 'name'];
    const results = {};

    for (const col of columns) {
        const { error } = await supabase.from('user_roles').select(col).limit(1);
        results[col] = !error;
    }

    console.log('Columns existence:', results);
}

checkColumns();
