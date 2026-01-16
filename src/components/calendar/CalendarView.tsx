import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { mockEvents } from '@/data/mockData';
import { format, isSameDay } from 'date-fns';
import { Clock, MapPin, Users, DoorOpen, Phone, Heart, Mic, GraduationCap, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

  const eventsOnSelectedDate = selectedDate
    ? mockEvents.filter((event) =>
        isSameDay(new Date(event.start_date), selectedDate)
      )
    : [];

  const hasEvents = (date: Date) => {
    return mockEvents.some((event) =>
      isSameDay(new Date(event.start_date), date)
    );
  };

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
          modifiersStyles={{
            hasEvent: {
              fontWeight: 'bold',
            },
          }}
          components={{
            Day: ({ date, ...props }) => {
              const hasEvent = hasEvents(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              
              return (
                <button
                  {...props}
                  className={cn(
                    "relative h-12 w-12 p-0 font-normal aria-selected:opacity-100 rounded-lg transition-all",
                    "hover:bg-muted focus:bg-muted",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary focus:bg-primary",
                    !isSelected && hasEvent && "font-semibold"
                  )}
                >
                  <span>{date.getDate()}</span>
                  {hasEvent && !isSelected && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            },
          }}
        />
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
          <h4 className="text-sm font-medium text-muted-foreground mb-3">This Week</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 text-center">
              <p className="text-2xl font-bold text-primary font-display">
                {mockEvents.filter(e => e.status === 'upcoming').length}
              </p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="p-3 rounded-lg bg-success/5 text-center">
              <p className="text-2xl font-bold text-success font-display">
                {mockEvents.filter(e => e.status === 'in_progress').length}
              </p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
