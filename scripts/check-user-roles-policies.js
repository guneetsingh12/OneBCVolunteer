import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    console.log('Checking for user_roles policies...');
    const { data, error } = await supabase.rpc('get_policies', { table_name: 'user_roles' });

    if (error) {
        console.error('Error querying policies:', error.message);
        // Fallback: try to see if we can at least select
        const { error: selectError } = await supabase.from('user_roles').select('*').limit(1);
        console.log('Select user_roles error:', selectError?.message);
    } else {
        console.log('Policies:', data);
    }
}

checkPolicies();
