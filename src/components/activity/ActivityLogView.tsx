import { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  DoorOpen, 
  Phone,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface ActivityRecord {
  id: string;
  volunteer_id: string;
  activity_type: string;
  hours_spent: number;
  doors_knocked: number;
  calls_made: number;
  notes: string;
  activity_date: string;
  created_at: string;
  volunteer?: { first_name: string; last_name: string };
}

const activityTypeConfig: Record<string, { label: string; className: string }> = {
  door_knock: { label: 'Door Knocking', className: 'bg-primary/10 text-primary' },
  phone_bank: { label: 'Phone Banking', className: 'bg-info/10 text-info' },
  canvassing: { label: 'Canvassing', className: 'bg-secondary/10 text-secondary' },
  event: { label: 'Event', className: 'bg-accent/10 text-accent' },
  training: { label: 'Training', className: 'bg-warning/10 text-warning' },
  meeting: { label: 'Meeting', className: 'bg-muted text-muted-foreground' },
  other: { label: 'Other', className: 'bg-muted text-muted-foreground' },
};

export function ActivityLogView() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesData && activitiesData.length > 0) {
        const volunteerIds = [...new Set(activitiesData.map(a => a.volunteer_id))];
        const { data: volunteersData } = await supabase
          .from('volunteers')
          .select('id, first_name, last_name')
          .in('id', volunteerIds);

        const volunteerMap = new Map(volunteersData?.map(v => [v.id, v]) || []);
        
        setActivities(activitiesData.map(a => ({
          ...a,
          volunteer: volunteerMap.get(a.volunteer_id) || { first_name: 'Unknown', last_name: '' }
        })));
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity Log</h3>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities recorded yet</p>
            </div>
          ) : (
            activities.map((activity) => {
              const config = activityTypeConfig[activity.activity_type] || activityTypeConfig.other;
              
              return (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={cn("p-2 rounded-lg shrink-0", config.className)}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.volunteer?.first_name} {activity.volunteer?.last_name}</span>
                      {' '}logged <span className="font-medium">{config.label}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {activity.hours_spent > 0 && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{activity.hours_spent}h</span>
                      )}
                      {activity.doors_knocked > 0 && (
                        <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" />{activity.doors_knocked} doors</span>
                      )}
                      {activity.calls_made > 0 && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{activity.calls_made} calls</span>
                      )}
                    </div>
                    {activity.notes && <p className="text-xs text-muted-foreground mt-1">{activity.notes}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
