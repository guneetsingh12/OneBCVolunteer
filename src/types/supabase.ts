export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            volunteers: {
                Row: {
                    id: string
                    first_name: string
                    last_name: string
                    email: string
                    phone: string | null
                    city: string | null
                    postal_code: string | null
                    street_address: string | null
                    riding_id: string | null
                    riding_confirmed: boolean | null
                    preferred_contact: 'email' | 'phone' | 'text' | null
                    languages: string[] | null
                    availability_days: string[] | null
                    availability_times: string[] | null
                    hours_per_week: number | null
                    role_interest: string[] | null
                    skills_notes: string | null
                    experience_level: 'new' | 'some' | 'experienced' | 'veteran' | null
                    has_vehicle: boolean | null
                    status: 'active' | 'inactive' | 'pending' | 'on_leave' | null
                    team_lead_id: string | null
                    date_signed_up: string | null
                    last_contacted_date: string | null
                    last_active_date: string | null
                    total_hours: number | null
                    total_shifts: number | null
                    total_doors_or_dials: number | null
                    notes: string | null
                    risk_flags: string[] | null
                    consent_given: boolean | null
                    created_at: string | null
                    updated_at: string | null
                    // New fields
                    property_value_range: string | null
                    housing_type: string | null
                }
                Insert: {
                    // ... (simplified for now, usually generated)
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
            }
            ridings: {
                Row: {
                    id: string
                    name: string
                    code: string
                    region: string
                    created_at: string | null
                }
                Insert: { [key: string]: any }
                Update: { [key: string]: any }
            }
            // ... Add other tables as needed strictly generated
        }
    }
}
