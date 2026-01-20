import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRoles() {
    // Try to select email from user_roles
    const { data, error } = await supabase
        .from('user_roles')
        .select('email')
        .limit(1);

    if (error) {
        console.log('user_roles does NOT have email column:', error.message);
    } else {
        console.log('user_roles HAS email column');
    }
}

checkUserRoles();
