
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking for user_roles table...');
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying user_roles:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('Table user_roles DOES NOT exist.');
        }
    } else {
        console.log('Table user_roles exists. Data:', data);
    }
}

checkTable();
