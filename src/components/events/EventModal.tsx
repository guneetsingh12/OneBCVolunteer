import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Volunteer } from '@/types';
import { useEffect } from 'react';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  event_type: z.enum(['door_knock', 'phone_bank', 'charity', 'speech', 'rally', 'meeting', 'training', 'other']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  location: z.string().min(1, 'Location is required').max(200),
  address: z.string().max(300).optional(),
  riding: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  max_volunteers: z.number().min(1, 'At least 1 volunteer required').max(1000),
  is_public: z.boolean(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  event?: any; // The event to edit, if any
}

const eventTypes = [
  { value: 'door_knock', label: 'Door Knock' },
  { value: 'phone_bank', label: 'Phone Bank' },
  { value: 'charity', label: 'Charity' },
  { value: 'speech', label: 'Speech' },
  { value: 'rally', label: 'Rally' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

export function EventModal({ isOpen, onClose, onSuccess, event }: EventModalProps) {
  const [loading, setLoading] = useState(false);
  const [regionalVolunteers, setRegionalVolunteers] = useState<Volunteer[]>([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event_type: 'meeting',
      max_volunteers: 10,
      is_public: true,
    }
  });

  useEffect(() => {
    if (event) {
      setValue('title', event.title);
      setValue('description', event.description || '');
      setValue('event_type', event.event_type);
      setValue('start_date', event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '');
      setValue('end_date', event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '');

      // Handle location which might be "Location (Address)"
      const locationMatch = event.location.match(/^(.*?) \((.*?)\)$/);
      if (locationMatch) {
        setValue('location', locationMatch[1]);
        setValue('address', locationMatch[2]);
      } else {
        setValue('location', event.location);
        setValue('address', '');
      }

      setValue('riding', event.riding || '');
      setValue('region', event.region || '');
      setValue('max_volunteers', event.max_volunteers);
      setValue('is_public', event.is_public !== false);
    } else {
      reset({
        event_type: 'meeting',
        max_volunteers: 10,
        is_public: true,
      });
    }
  }, [event, setValue, reset]);

  const watchedRegion = watch('region');

  useEffect(() => {
    const fetchRegionalVolunteers = async () => {
      if (!watchedRegion || watchedRegion.trim().length < 2) {
        setRegionalVolunteers([]);
        setSelectedVolunteerIds([]);
        return;
      }

      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .ilike('region', `%${watchedRegion.trim()}%`);

      if (!error && data) {
        setRegionalVolunteers(data as unknown as Volunteer[]);
      }
    };

    const timer = setTimeout(fetchRegionalVolunteers, 500);
    return () => clearTimeout(timer);
  }, [watchedRegion]);

  const toggleVolunteer = (id: string) => {
    setSelectedVolunteerIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const selectAllVolunteers = () => {
    if (!regionalVolunteers) return;

    if (selectedVolunteerIds.length === regionalVolunteers.length) {
      setSelectedVolunteerIds([]);
    } else {
      const allIds = regionalVolunteers
        .filter(v => v && v.id)
        .map(v => v.id);
      setSelectedVolunteerIds(allIds);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);

    try {
      const eventData = {
        title: data.title,
        description: data.description || '',
        event_type: data.event_type,
        start_date: new Date(data.start_date).toISOString(),
        end_date: data.end_date ? new Date(data.end_date).toISOString() : new Date(data.start_date).toISOString(),
        location: data.address ? `${data.location} (${data.address})` : data.location,
        region: data.region || '',
        max_volunteers: data.max_volunteers,
        status: event?.status || 'upcoming',
        updated_at: new Date().toISOString(),
      };

      let result;
      if (event) {
        // Update existing event
        const { data: updateData, error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = updateData;
      } else {
        // Create new event
        const { data: insertData, error: insertError } = await supabase
          .from('events')
          .insert({
            ...eventData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = insertData;
      }

      if (result && selectedVolunteerIds.length > 0) {
        // Tag volunteers
        const assignments = selectedVolunteerIds.map(vId => ({
          event_id: result.id,
          volunteer_id: vId,
          status: 'registered'
        }));

        const { error: assignError } = await supabase
          .from('event_volunteers')
          .insert(assignments);

        if (assignError) {
          console.error('Error tagging volunteers:', assignError);
          toast({
            title: event ? "Event Updated, but tagging failed" : "Event Created, but tagging failed",
            description: assignError.message,
            variant: "warning" as any
          });
        }
      }

      toast({
        title: event ? "Event Updated" : "Event Created",
        description: `"${data.title}" has been ${event ? 'updated' : 'created'} successfully.`,
      });

      reset();
      setSelectedVolunteerIds([]);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving event:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to save event. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {event ? 'Edit Event' : 'Create New Event'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {event ? 'Update the details of this event' : 'Add a new event for volunteers'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event Title *
              </label>
              <Input {...register('title')} placeholder="e.g., Downtown Door Knocking Campaign" />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <Textarea
                {...register('description')}
                placeholder="Describe the event and what volunteers will be doing..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event Type *
              </label>
              <select
                {...register('event_type')}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date & Time *
              </label>
              <Input {...register('start_date')} type="datetime-local" />
              {errors.start_date && (
                <p className="text-sm text-destructive mt-1">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                End Date & Time
              </label>
              <Input {...register('end_date')} type="datetime-local" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location *
              </label>
              <Input {...register('location')} placeholder="e.g., Community Center" />
              {errors.location && (
                <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Address
              </label>
              <Input {...register('address')} placeholder="123 Main St, Vancouver, BC" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Riding
                </label>
                <Input {...register('riding')} placeholder="e.g., Vancouver-False Creek" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Region
                </label>
                <Input {...register('region')} placeholder="e.g., Metro Vancouver" />
              </div>
            </div>

            {/* Regional Volunteers Checklist */}
            {regionalVolunteers.length > 0 && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    Tag Volunteers in {watchedRegion} ({regionalVolunteers.length} found)
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllVolunteers}
                    className="h-7 text-xs text-primary hover:text-primary/80"
                  >
                    {selectedVolunteerIds.length === regionalVolunteers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-1">
                    {regionalVolunteers?.filter(v => v && v.id).map((volunteer) => (
                      <div
                        key={volunteer.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <input
                          type="checkbox"
                          id={`v-${volunteer.id}`}
                          checked={selectedVolunteerIds.includes(volunteer.id)}
                          onChange={() => toggleVolunteer(volunteer.id)}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                        />
                        <label
                          htmlFor={`v-${volunteer.id}`}
                          className="flex flex-col min-w-0 flex-1 cursor-pointer select-none"
                        >
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {volunteer.first_name} {volunteer.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {volunteer.email}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedVolunteerIds.length > 0 && (
                  <p className="text-xs text-primary font-medium">
                    {selectedVolunteerIds.length} volunteer(s) selected to be tagged
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Volunteers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Max Volunteers *
              </label>
              <Input
                {...register('max_volunteers', { valueAsNumber: true })}
                type="number"
                min={1}
                max={1000}
              />
              {errors.max_volunteers && (
                <p className="text-sm text-destructive mt-1">{errors.max_volunteers.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="is_public"
                {...register('is_public')}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="is_public" className="text-sm text-foreground">
                Public event (visible to all volunteers)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {event ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                event ? 'Update Event' : 'Create Event'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
