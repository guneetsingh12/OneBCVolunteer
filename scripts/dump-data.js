import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllData() {
    const { data: volunteers } = await supabase.from('volunteers').select('*').limit(5);
    const { data: userRoles } = await supabase.from('user_roles').select('*').limit(5);

    console.log('Volunteers:', volunteers);
    console.log('User Roles:', userRoles);
}

checkAllData();
