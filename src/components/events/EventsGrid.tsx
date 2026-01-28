import { useState, useEffect } from 'react';
import {
  Search,
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
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { EventModal } from './EventModal';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { isDirector } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events along with the count of volunteers tagged to each
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_volunteers (
            count
          )
        `)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        // Map the count from the join result to current_volunteers
        const formattedEvents = (data || []).map((event: any) => ({
          ...event,
          current_volunteers: event.event_volunteers?.[0]?.count || 0
        }));
        setEvents(formattedEvents as Event[]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
    setLoading(false);
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the event "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: `"${title}" has been successfully removed.`,
      });
      fetchEvents();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.status === filter;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

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
        <div className="flex flex-wrap items-center gap-4">
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

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border/50 focus-visible:ring-1"
            />
          </div>
        </div>

        <Button
          onClick={handleCreateEvent}
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
              className={cn(
                "stat-card group animate-slide-up hover:border-primary/50 transition-all",
                isDirector ? "cursor-pointer" : "cursor-default"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => isDirector && handleEditEvent(event)}
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
                  {isDirector && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id, event.title);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {!isDirector && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  )}
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
                    {event.current_volunteers || 0}/{event.max_volunteers || 0}
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
          <Button onClick={handleCreateEvent} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSuccess={fetchEvents}
        event={selectedEvent}
      />
    </div>
  );
}
