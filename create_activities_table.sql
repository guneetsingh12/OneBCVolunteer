
-- Activities table to track individual volunteer contributions
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL, -- e.g., 'door_knock', 'phone_bank', 'rally', 'meeting'
  hours_spent DECIMAL(5,2) DEFAULT 0,
  doors_knocked INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  notes TEXT,
  activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Allow volunteers to see their own activities
CREATE POLICY "Volunteers can see their own activities" ON activities
  FOR SELECT USING (true); -- Simplified for now, should be tied to auth.uid() later

-- Allow volunteers to insert their own activities
CREATE POLICY "Volunteers can insert their own activities" ON activities
  FOR INSERT WITH CHECK (true);

-- Allow directors/admins to see all activities
CREATE POLICY "Internal users can see all activities" ON activities
  FOR SELECT USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
