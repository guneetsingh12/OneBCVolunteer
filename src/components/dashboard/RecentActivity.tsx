import { User, Calendar, MapPin, Clock } from 'lucide-react';
import { mockVolunteers, mockEvents } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';

export function RecentActivity() {
  const recentVolunteers = mockVolunteers.slice(0, 3);
  const upcomingEvents = mockEvents.filter(e => e.status === 'upcoming').slice(0, 3);

  return (
    <div className="stat-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground font-display">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest updates and upcoming events</p>
      </div>

      <div className="space-y-6">
        {/* Recent Signups */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Recent Volunteer Signups
          </h4>
          <div className="space-y-3">
            {recentVolunteers.map((volunteer) => (
              <div key={volunteer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                    {volunteer.first_name[0]}{volunteer.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {volunteer.first_name} {volunteer.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{volunteer.riding}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(volunteer.date_signed_up), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Events
          </h4>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                    {event.event_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.riding}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(event.start_date).toLocaleDateString()}
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
      </div>
    </div>
  );
}
