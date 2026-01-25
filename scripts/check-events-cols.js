
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsTable() {
    console.log('Checking events table columns...');
    const { data, error } = await supabase.from('events').select('*').limit(0);

    if (error) {
        console.error('Error fetching events table:', error);
        return;
    }

    // In some cases, we can't get columns this way if the table is empty and we don't have enough permissions
    // But let's try to insert a dummy one or use a trick

    const { data: cols, error: colError } = await supabase.from('events').select().limit(1);
    if (cols && cols.length > 0) {
        console.log('Columns found:', Object.keys(cols[0]));
    } else {
        console.log('Table is empty or columns hidden. Trying to describe via error...');
        const { error: err } = await supabase.from('events').select('non_existent_column_test').limit(1);
        console.log('Error hint:', err?.message);
    }
}

checkEventsTable();
