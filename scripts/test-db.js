
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

async function testUpdate() {
    console.log('Testing connection to:', supabaseUrl);

    // 1. Fetch a volunteer to get an ID
    const { data: volunteers, error: fetchError } = await supabase
        .from('volunteers')
        .select('*')
        .limit(1);

    if (fetchError) {
        console.error('Error fetching volunteers:', fetchError);
        return;
    }

    if (!volunteers || volunteers.length === 0) {
        console.log('No volunteers found to test update on.');
        return;
    }

    const volunteer = volunteers[0];
    console.log(`Found volunteer: ${volunteer.first_name} (ID: ${volunteer.id})`);
    console.log(`Initial updated_at: ${volunteer.updated_at}`);

    // 2. Try to update WITHOUT select
    const newDate = new Date().toISOString();
    console.log(`Attempting to update updated_at to: ${newDate}`);

    const { error: updateError, count } = await supabase
        .from('volunteers')
        .update({ updated_at: newDate })
        .eq('id', volunteer.id);

    if (updateError) {
        console.error('Update failed with error:', updateError);
    } else {
        console.log('Update call completed successfully (no error).');
    }

    // 3. Verify
    const { data: verifyData } = await supabase
        .from('volunteers')
        .select('updated_at')
        .eq('id', volunteer.id)
        .single();

    if (verifyData) {
        console.log(`Verifying updated_at after update: ${verifyData.updated_at}`);
        if (verifyData.updated_at === newDate) {
            console.log('SUCCESS: Validation confirmed data WAS updated in DB.');
        } else {
            console.log('FAILURE: Data in DB did NOT match expected new value. (RLS blocked update)');
        }
    } else {
        console.log('Could not verify - select failed.');
    }
}

testUpdate();
