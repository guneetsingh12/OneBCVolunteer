import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDirector() {
    const { data } = await supabase.from('volunteers').select('*').eq('email', 'arishali1674@gmail.com');
    console.log('Director in volunteers:', data);
}

checkDirector();
