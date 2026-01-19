import { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  MoreHorizontal,
  DoorOpen,
  Phone,
  Heart,
  Mic,
  GraduationCap,
  PartyPopper,
  Loader2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { EventModal } from './EventModal';

const eventTypeConfig = {
  door_knock: { icon: DoorOpen, label: 'Door Knock', color: 'bg-primary/10 text-primary' },
  phone_bank: { icon: Phone, label: 'Phone Bank', color: 'bg-info/10 text-info' },
  charity: { icon: Heart, label: 'Charity', color: 'bg-destructive/10 text-destructive' },
  speech: { icon: Mic, label: 'Speech', color: 'bg-secondary/10 text-secondary' },
  rally: { icon: PartyPopper, label: 'Rally', color: 'bg-accent/10 text-accent' },
  meeting: { icon: Users, label: 'Meeting', color: 'bg-muted text-muted-foreground' },
  training: { icon: GraduationCap, label: 'Training', color: 'bg-warning/10 text-warning' },
  other: { icon: Calendar, label: 'Other', color: 'bg-muted text-muted-foreground' },
};

const statusConfig = {
  upcoming: { label: 'Upcoming', className: 'bg-info/10 text-info border-info/20' },
  in_progress: { label: 'In Progress', className: 'bg-success/10 text-success border-success/20' },
  completed: { label: 'Completed', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function EventsGrid() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'in_progress' | 'completed'>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents((data || []) as Event[]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
    setLoading(false);
  };

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
          {['all', 'upcoming', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as typeof filter)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                filter === status 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {status === 'all' ? 'All Events' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-gradient-primary gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents.map((event, index) => {
          const typeConfig = eventTypeConfig[event.event_type] || eventTypeConfig.other;
          const TypeIcon = typeConfig.icon;
          const typeColor = typeConfig.color;
          const volunteerPercentage = event.max_volunteers > 0 
            ? (event.current_volunteers / event.max_volunteers) * 100
            : 0;

          return (
            <div 
              key={event.id}
              className="stat-card group cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl", typeColor)}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusConfig[event.status]?.className || ''}>
                    {statusConfig[event.status]?.label || event.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-semibold text-foreground font-display text-lg mb-2 line-clamp-1">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {event.description}
              </p>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{event.start_date && format(new Date(event.start_date), 'MMM d, yyyy')}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <Clock className="h-4 w-4" />
                  <span>{event.start_date && format(new Date(event.start_date), 'h:mm a')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              </div>

              {/* Volunteer Progress */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Volunteers
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {event.current_volunteers}/{event.max_volunteers}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      volunteerPercentage >= 80 
                        ? "bg-success" 
                        : volunteerPercentage >= 50 
                          ? "bg-accent" 
                          : "bg-primary"
                    )}
                    style={{ width: `${volunteerPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {events.length === 0 
              ? "Get started by creating your first event."
              : "Try adjusting your filters or create a new event."}
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      )}

      {/* Event Modal */}
      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEvents}
      />
    </div>
  );
}
