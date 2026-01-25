
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRead() {
    console.log('Testing read from events...');
    const { data, error } = await supabase.from('events').select('count');
    if (error) {
        console.error('Events Read Error:', error.message);
    } else {
        console.log('Events Count read success:', data);
    }

    console.log('Testing read from event_volunteers...');
    const { data: data2, error: error2 } = await supabase.from('event_volunteers').select('count');
    if (error2) {
        console.error('Event Volunteers Read Error:', error2.message);
    } else {
        console.log('Event Volunteers Count read success:', data2);
    }
}

testRead();
