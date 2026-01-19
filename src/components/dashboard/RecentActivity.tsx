import { User, Calendar, MapPin, Clock, Activity, DoorOpen, Phone } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Volunteer, Event } from '@/types';

interface ActivityItem {
  id: string;
  volunteer_id: string;
  activity_type: string;
  hours_spent: number;
  doors_knocked: number;
  calls_made: number;
  notes: string;
  activity_date: string;
  created_at: string;
  volunteer?: {
    first_name: string;
    last_name: string;
  };
}

interface RecentActivityProps {
  recentVolunteers: Volunteer[];
  upcomingEvents: Event[];
  recentActivities: ActivityItem[];
}

const activityTypeLabels: Record<string, string> = {
  door_knock: 'Door Knocking',
  phone_bank: 'Phone Banking',
  canvassing: 'Canvassing',
  event: 'Event',
  training: 'Training',
  meeting: 'Meeting',
  other: 'Other Activity',
};

export function RecentActivity({ recentVolunteers, upcomingEvents, recentActivities }: RecentActivityProps) {
  return (
    <div className="stat-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground font-display">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest updates and volunteer activities</p>
      </div>

      <div className="space-y-6">
        {/* Recent Activities from Database */}
        {recentActivities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Volunteer Activities
            </h4>
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {activity.volunteer?.first_name?.[0] || '?'}{activity.volunteer?.last_name?.[0] || ''}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {activity.volunteer?.first_name} {activity.volunteer?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{activityTypeLabels[activity.activity_type] || activity.activity_type}</span>
                        {activity.hours_spent > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {activity.hours_spent}h
                          </span>
                        )}
                        {activity.doors_knocked > 0 && (
                          <span className="flex items-center gap-1">
                            <DoorOpen className="h-3 w-3" /> {activity.doors_knocked}
                          </span>
                        )}
                        {activity.calls_made > 0 && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {activity.calls_made}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Signups */}
        {recentVolunteers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Recent Volunteer Signups
            </h4>
            <div className="space-y-3">
              {recentVolunteers.slice(0, 3).map((volunteer) => (
                <div key={volunteer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-medium text-sm">
                      {volunteer.first_name[0]}{volunteer.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {volunteer.first_name} {volunteer.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{volunteer.city || 'Location unknown'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {volunteer.created_at && formatDistanceToNow(new Date(volunteer.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Events
            </h4>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                      {event.event_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location || event.riding}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.start_date && format(new Date(event.start_date), 'MMM d, h:mm a')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {event.current_volunteers}/{event.max_volunteers}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentActivities.length === 0 && recentVolunteers.length === 0 && upcomingEvents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
