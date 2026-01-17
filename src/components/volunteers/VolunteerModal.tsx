import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Mail, Phone, MapPin, Car, Languages, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Volunteer } from '@/types';
import { cn } from '@/lib/utils';
import { lookupRidingFromPostalCode } from '@/data/mockData';

const volunteerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  postal_code: z.string().regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Invalid BC postal code'),
  city: z.string().min(1, 'City is required'),
  street_address: z.string().optional(),
  preferred_contact: z.enum(['email', 'phone', 'text']),
  languages: z.array(z.string()),
  hours_per_week: z.number().min(1).max(40),
  experience_level: z.enum(['new', 'some', 'experienced', 'veteran']),
  has_vehicle: z.boolean(),
  skills_notes: z.string().optional(),
  consent_given: z.boolean().refine(val => val === true, 'Consent is required'),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer: Volunteer | null;
}

const availabilityDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const availabilityTimes = ['Morning', 'Afternoon', 'Evening'];
const roleInterests = ['Door Knocking', 'Phone Banking', 'Event Volunteering', 'Data Entry', 'Social Media', 'Translation', 'Driving', 'Administrative'];
const languageOptions = ['English', 'French', 'Mandarin', 'Cantonese', 'Punjabi', 'Hindi', 'Spanish', 'Tagalog', 'Korean', 'Other'];

export function VolunteerModal({ isOpen, onClose, volunteer }: VolunteerModalProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(volunteer?.availability_days || []);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(volunteer?.availability_times || []);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(volunteer?.role_interest || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(volunteer?.languages || ['English']);
  const [ridingLookup, setRidingLookup] = useState<{ riding: string; confidence: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: volunteer ? {
      first_name: volunteer.first_name,
      last_name: volunteer.last_name,
      email: volunteer.email,
      phone: volunteer.phone,
      postal_code: volunteer.postal_code,
      city: volunteer.city,
      street_address: volunteer.street_address,
      preferred_contact: volunteer.preferred_contact,
      languages: volunteer.languages,
      hours_per_week: volunteer.hours_per_week,
      experience_level: volunteer.experience_level,
      has_vehicle: volunteer.has_vehicle,
      skills_notes: volunteer.skills_notes,
      consent_given: volunteer.consent_given,
    } : {
      preferred_contact: 'email',
      experience_level: 'new',
      has_vehicle: false,
      consent_given: false,
      languages: ['English'],
      hours_per_week: 5,
    }
  });

  const postalCode = watch('postal_code');

  const handlePostalCodeBlur = () => {
    if (postalCode && postalCode.length >= 6) {
      const result = lookupRidingFromPostalCode(postalCode);
      setRidingLookup(result);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
    setValue('languages', selectedLanguages);
  };

  const onSubmit = (data: VolunteerFormData) => {
    const fullData = {
      ...data,
      availability_days: selectedDays,
      availability_times: selectedTimes,
      role_interest: selectedInterests,
      languages: selectedLanguages,
      riding: ridingLookup?.riding || 'Needs Review',
      riding_confirmed: ridingLookup?.confidence === 'high',
    };
    console.log('Volunteer data:', fullData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {volunteer ? 'Edit Volunteer' : 'Add New Volunteer'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {volunteer ? 'Update volunteer information' : 'Enter volunteer details below'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  First Name *
                </label>
                <Input {...register('first_name')} />
                {errors.first_name && (
                  <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Last Name *
                </label>
                <Input {...register('last_name')} />
                {errors.last_name && (
                  <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...register('email')} type="email" className="pl-10" />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...register('phone')} type="tel" className="pl-10" />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Location & Riding
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Street Address
                </label>
                <Input {...register('street_address')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  City *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...register('city')} className="pl-10" />
                </div>
                {errors.city && (
                  <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Postal Code *
                </label>
                <Input 
                  {...register('postal_code')} 
                  placeholder="V6B 1A1"
                  onBlur={handlePostalCodeBlur}
                />
                {errors.postal_code && (
                  <p className="text-sm text-destructive mt-1">{errors.postal_code.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Detected Riding
                </label>
                {ridingLookup ? (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border",
                    ridingLookup.confidence === 'high' 
                      ? "bg-success/10 border-success/20 text-success" 
                      : "bg-warning/10 border-warning/20 text-warning"
                  )}>
                    {ridingLookup.confidence !== 'high' && <AlertTriangle className="h-4 w-4" />}
                    <span className="text-sm font-medium">{ridingLookup.riding}</span>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-lg bg-muted text-sm text-muted-foreground">
                    Enter postal code to auto-detect
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Languages */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                    selectedLanguages.includes(lang)
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "bg-card border-border hover:border-secondary/50 text-foreground"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Availability
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Days Available</p>
                <div className="flex flex-wrap gap-2">
                  {availabilityDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                        selectedDays.includes(day)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50 text-foreground"
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">Time Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {availabilityTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => toggleTime(time)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                        selectedTimes.includes(time)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50 text-foreground"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Hours per week
              </label>
              <Input 
                {...register('hours_per_week', { valueAsNumber: true })} 
                type="number" 
                min={1} 
                max={40} 
                className="w-32" 
              />
            </div>
          </div>

          {/* Role Interests */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Role Interests
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {roleInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left",
                    selectedInterests.includes(interest)
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card border-border hover:border-accent/50 text-foreground"
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Experience Level
              </label>
              <select
                {...register('experience_level')}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm"
              >
                <option value="new">New Volunteer</option>
                <option value="some">Some Experience</option>
                <option value="experienced">Experienced</option>
                <option value="veteran">Veteran</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Preferred Contact Method
              </label>
              <select
                {...register('preferred_contact')}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text Message</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch {...register('has_vehicle')} id="vehicle" />
            <label htmlFor="vehicle" className="text-sm text-foreground flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              Has access to a vehicle
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Skills & Notes
            </label>
            <Textarea 
              {...register('skills_notes')} 
              placeholder="Any relevant skills, experience, or notes..."
              rows={3}
            />
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <input
              type="checkbox"
              {...register('consent_given')}
              id="consent"
              className="mt-1 rounded border-input"
            />
            <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">
              This volunteer has provided consent for their information to be stored and used for campaign activities. 
              Data will be handled in accordance with Canadian privacy laws (PIPEDA).
            </label>
          </div>
          {errors.consent_given && (
            <p className="text-sm text-destructive">{errors.consent_given.message}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary">
              {volunteer ? 'Save Changes' : 'Add Volunteer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}