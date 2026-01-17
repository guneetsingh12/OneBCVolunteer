export interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  postal_code: string;
  street_address: string;
  region: string;
  riding: string;
  riding_confirmed: boolean;
  preferred_contact: 'email' | 'phone' | 'text';
  languages: string[];
  availability_days: string[];
  availability_times: string[];
  hours_per_week: number;
  role_interest: string[];
  skills_notes: string;
  experience_level: 'new' | 'some' | 'experienced' | 'veteran';
  has_vehicle: boolean;
  status: 'active' | 'inactive' | 'pending' | 'on_leave';
  team_lead_id: string | null;
  date_signed_up: string;
  last_contacted_date: string | null;
  last_active_date: string | null;
  total_hours: number;
  total_shifts: number;
  total_doors_or_dials: number;
  notes: string;
  risk_flags: string[];
  consent_given: boolean;
  created_at: string;
  updated_at: string;
  // Property intelligence (optional)
  property_value_range?: string;
  housing_type?: 'owned' | 'rented' | 'unknown';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: 'door_knock' | 'phone_bank' | 'charity' | 'speech' | 'rally' | 'meeting' | 'training' | 'other';
  start_date: string;
  end_date: string;
  location: string;
  address: string;
  riding: string;
  region: string;
  max_volunteers: number;
  current_volunteers: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  outcomes?: EventOutcome;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventOutcome {
  doors_knocked: number;
  calls_made: number;
  signups_collected: number;
  notes: string;
}

export interface Riding {
  id: string;
  name: string;
  code: string;
  region: string;
  total_volunteers: number;
  active_volunteers: number;
  total_events: number;
  total_doors_knocked: number;
  total_calls_made: number;
  engagement_score: number;
  // Geo coordinates for mapping
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DashboardStats {
  total_volunteers: number;
  active_volunteers: number;
  pending_volunteers: number;
  total_events: number;
  upcoming_events: number;
  total_hours: number;
  total_doors: number;
  total_calls: number;
  volunteers_this_month: number;
  events_this_month: number;
  signups_this_week: number;
  engagement_rate: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'director' | 'team_lead' | 'volunteer';
  riding_access: string[];
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export' | 'login' | 'logout';
  entity_type: 'volunteer' | 'event' | 'riding' | 'user' | 'system';
  entity_id: string;
  entity_name: string;
  details: string;
  timestamp: string;
  ip_address?: string;
}

export interface CSVImportResult {
  total_rows: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: CSVImportError[];
}

export interface CSVImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface RidingLookupResult {
  riding: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  needs_review: boolean;
  source: 'postal_code' | 'address' | 'manual';
}

export type TabType = 'dashboard' | 'volunteers' | 'events' | 'map' | 'calendar' | 'reports' | 'settings' | 'activity';

export type PublicTabType = 'home' | 'events' | 'map' | 'signup';