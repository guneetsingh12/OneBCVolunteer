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
                    external_id: string | null
                    first_name: string
                    last_name: string
                    email: string
                    phone: string | null
                    city: string | null
                    postal_prefix: string | null
                    postal_code: string | null
                    street_address: string | null
                    region: string | null
                    riding: string | null
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
                    team_lead_name: string | null
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
                    property_value_range: string | null
                    housing_type: string | null
                }
                Insert: {
                    id?: string
                    external_id?: string | null
                    first_name: string
                    last_name: string
                    email: string
                    phone?: string | null
                    city?: string | null
                    postal_prefix?: string | null
                    postal_code?: string | null
                    street_address?: string | null
                    region?: string | null
                    riding?: string | null
                    riding_confirmed?: boolean | null
                    preferred_contact?: 'email' | 'phone' | 'text' | null
                    languages?: string[] | null
                    availability_days?: string[] | null
                    availability_times?: string[] | null
                    hours_per_week?: number | null
                    role_interest?: string[] | null
                    skills_notes?: string | null
                    experience_level?: 'new' | 'some' | 'experienced' | 'veteran' | null
                    has_vehicle?: boolean | null
                    status?: 'active' | 'inactive' | 'pending' | 'on_leave' | null
                    team_lead_id?: string | null
                    team_lead_name?: string | null
                    date_signed_up?: string | null
                    last_contacted_date?: string | null
                    last_active_date?: string | null
                    total_hours?: number | null
                    total_shifts?: number | null
                    total_doors_or_dials?: number | null
                    notes?: string | null
                    risk_flags?: string[] | null
                    consent_given?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                    property_value_range?: string | null
                    housing_type?: string | null
                }
                Update: {
                    id?: string
                    external_id?: string | null
                    first_name?: string
                    last_name?: string
                    email?: string
                    phone?: string | null
                    city?: string | null
                    postal_prefix?: string | null
                    postal_code?: string | null
                    street_address?: string | null
                    region?: string | null
                    riding?: string | null
                    riding_confirmed?: boolean | null
                    preferred_contact?: 'email' | 'phone' | 'text' | null
                    languages?: string[] | null
                    availability_days?: string[] | null
                    availability_times?: string[] | null
                    hours_per_week?: number | null
                    role_interest?: string[] | null
                    skills_notes?: string | null
                    experience_level?: 'new' | 'some' | 'experienced' | 'veteran' | null
                    has_vehicle?: boolean | null
                    status?: 'active' | 'inactive' | 'pending' | 'on_leave' | null
                    team_lead_id?: string | null
                    team_lead_name?: string | null
                    date_signed_up?: string | null
                    last_contacted_date?: string | null
                    last_active_date?: string | null
                    total_hours?: number | null
                    total_shifts?: number | null
                    total_doors_or_dials?: number | null
                    notes?: string | null
                    risk_flags?: string[] | null
                    consent_given?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                    property_value_range?: string | null
                    housing_type?: string | null
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
                Insert: {
                    id?: string
                    name: string
                    code: string
                    region: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    code?: string
                    region?: string
                    created_at?: string | null
                }
            }
            events: {
                Row: {
                    id: string
                    name: string
                    type: string
                    date: string
                    start_time: string | null
                    end_time: string | null
                    location: string | null
                    riding_id: string | null
                    description: string | null
                    volunteers_needed: number | null
                    volunteers_signed_up: number | null
                    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    type: string
                    date: string
                    start_time?: string | null
                    end_time?: string | null
                    location?: string | null
                    riding_id?: string | null
                    description?: string | null
                    volunteers_needed?: number | null
                    volunteers_signed_up?: number | null
                    status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    type?: string
                    date?: string
                    start_time?: string | null
                    end_time?: string | null
                    location?: string | null
                    riding_id?: string | null
                    description?: string | null
                    volunteers_needed?: number | null
                    volunteers_signed_up?: number | null
                    status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            activity_log: {
                Row: {
                    id: string
                    action: string
                    entity_type: string
                    entity_id: string | null
                    user_id: string | null
                    details: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    action: string
                    entity_type: string
                    entity_id?: string | null
                    user_id?: string | null
                    details?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    action?: string
                    entity_type?: string
                    entity_id?: string | null
                    user_id?: string | null
                    details?: Json | null
                    created_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
