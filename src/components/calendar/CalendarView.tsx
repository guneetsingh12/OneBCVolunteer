import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, startOfMonth, endOfMonth, isToday, isPast, isFuture } from 'date-fns';
import { Clock, MapPin, Users, DoorOpen, Phone, Heart, Mic, GraduationCap, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useEffect, useState } from 'react';
import { Event } from '@/types';

const eventTypeIcons = {
  door_knock: DoorOpen,
  phone_bank: Phone,
  charity: Heart,
  speech: Mic,
  rally: Users,
  meeting: Users,
  training: GraduationCap,
  other: CalendarIcon,
};

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDirector, volunteerData, isVolunteer } = useUser();

  useEffect(() => {
    fetchEvents();
  }, [volunteerData?.id]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      if (isDirector) {
        // Director sees all events
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            event_volunteers (
              count
            )
          `)
          .order('start_date', { ascending: true });

        if (data) {
          const formatted = data.map(e => ({
            ...e,
            current_volunteers: e.event_volunteers?.[0]?.count || 0
          }));
          setEvents(formatted as Event[]);
        }
      } else if (isVolunteer && volunteerData?.id) {
        // Volunteer sees their tagged events
        const { data, error } = await supabase
          .from('event_volunteers')
          .select(`
            event_id,
            events (
              *,
              event_volunteers (
                count
              )
            )
          `)
          .eq('volunteer_id', volunteerData.id);

        if (data) {
          const extracted = data
            .map((item: any) => item.events)
            .filter(Boolean)
            .map(e => ({
              ...e,
              current_volunteers: e.event_volunteers?.[0]?.count || 0
            }));
          setEvents(extracted as Event[]);
        }
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    }
    setLoading(false);
  };

  const eventsOnSelectedDate = selectedDate
    ? events.filter((event) =>
      isSameDay(new Date(event.start_date), selectedDate)
    )
    : [];

  const hasEvents = (date: Date) => {
    return events.some((event) =>
      isSameDay(new Date(event.start_date), date)
    );
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const activeEvents = events.filter(e => isToday(new Date(e.start_date)));
  const completedEvents = events.filter(e => {
    const d = new Date(e.start_date);
    return isPast(d) && !isToday(d);
  });
  const upcomingThisMonth = events.filter(e => {
    const d = new Date(e.start_date);
    return d <= monthEnd && isFuture(d) && !isToday(d);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Calendar */}
      <div className="lg:col-span-2 stat-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground font-display">Campaign Calendar</h3>
          <p className="text-sm text-muted-foreground">View and manage all scheduled activities</p>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-lg border-0 w-full"
          modifiers={{
            hasEvent: (date) => hasEvents(date),
          }}
          modifiersClassNames={{
            hasEvent: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-accent"
          }}
        />
        {loading && (
          <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Updating calendar...</span>
          </div>
        )}
      </div>

      {/* Events for Selected Date */}
      <div className="stat-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground font-display">
            {selectedDate
              ? format(selectedDate, 'MMMM d, yyyy')
              : 'Select a Date'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {eventsOnSelectedDate.length} event{eventsOnSelectedDate.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        <div className="space-y-4">
          {eventsOnSelectedDate.length > 0 ? (
            eventsOnSelectedDate.map((event) => {
              const TypeIcon = eventTypeIcons[event.event_type];

              return (
                <div
                  key={event.id}
                  className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TypeIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground text-sm mb-1">
                        {event.title}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(event.start_date), 'h:mm a')} -{' '}
                            {format(new Date(event.end_date), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>
                            {event.current_volunteers}/{event.max_volunteers} volunteers
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No events scheduled for this date
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Events Summary */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Calendar Overview</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 text-center">
              <p className="text-2xl font-bold text-primary font-display">
                {upcomingThisMonth.length}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Upcoming (Month)</p>
            </div>
            <div className="p-3 rounded-lg bg-success/5 text-center">
              <p className="text-2xl font-bold text-success font-display">
                {activeEvents.length + completedEvents.length}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Active / Done</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
