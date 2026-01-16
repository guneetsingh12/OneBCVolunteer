import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vote, Mail, Phone, MapPin, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const signupSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  postal_code: z.string().regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Invalid postal code'),
  city: z.string().min(1, 'City is required'),
  availability: z.array(z.string()).min(1, 'Select at least one availability'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
});

type SignupFormData = z.infer<typeof signupSchema>;

const availabilityOptions = [
  'Weekday Mornings',
  'Weekday Afternoons',
  'Weekday Evenings',
  'Weekend Mornings',
  'Weekend Afternoons',
  'Weekend Evenings',
];

const interestOptions = [
  'Door Knocking',
  'Phone Banking',
  'Event Volunteering',
  'Data Entry',
  'Social Media',
  'Translation',
  'Driving',
  'Administrative',
];

export function PublicSignup() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      availability: [],
      interests: [],
      consent: false,
    }
  });

  const toggleAvailability = (option: string) => {
    const newSelection = selectedAvailability.includes(option)
      ? selectedAvailability.filter(a => a !== option)
      : [...selectedAvailability, option];
    setSelectedAvailability(newSelection);
    setValue('availability', newSelection);
  };

  const toggleInterest = (option: string) => {
    const newSelection = selectedInterests.includes(option)
      ? selectedInterests.filter(i => i !== option)
      : [...selectedInterests, option];
    setSelectedInterests(newSelection);
    setValue('interests', newSelection);
  };

  const onSubmit = (data: SignupFormData) => {
    console.log('Form submitted:', data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground font-display mb-4">
            Thank You for Signing Up!
          </h1>
          <p className="text-primary-foreground/80 mb-8">
            We've received your volunteer application. A team member will reach out to you soon with next steps.
          </p>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => setSubmitted(false)}
          >
            Sign Up Another Volunteer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-primary-foreground py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
              <Vote className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold font-display">EngageBC</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Join Our Volunteer Team
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Make a difference in your community. Sign up today and help shape the future of British Columbia.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-6 py-12 -mt-8">
        <div className="bg-card rounded-2xl shadow-xl p-8 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-foreground font-display mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Name *
                  </label>
                  <Input {...register('first_name')} placeholder="John" />
                  {errors.first_name && (
                    <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Last Name *
                  </label>
                  <Input {...register('last_name')} placeholder="Smith" />
                  {errors.last_name && (
                    <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...register('email')} type="email" placeholder="john@example.com" className="pl-10" />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...register('phone')} type="tel" placeholder="604-555-0123" className="pl-10" />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...register('city')} placeholder="Vancouver" className="pl-10" />
                  </div>
                  {errors.city && (
                    <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Postal Code *
                  </label>
                  <Input {...register('postal_code')} placeholder="V6B 1A1" />
                  {errors.postal_code && (
                    <p className="text-sm text-destructive mt-1">{errors.postal_code.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h2 className="text-xl font-semibold text-foreground font-display mb-4">
                Availability
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                When are you available to volunteer? (Select all that apply)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availabilityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleAvailability(option)}
                    className={cn(
                      "p-3 rounded-lg border text-sm font-medium transition-all text-left",
                      selectedAvailability.includes(option)
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.availability && (
                <p className="text-sm text-destructive mt-2">{errors.availability.message}</p>
              )}
            </div>

            {/* Interests */}
            <div>
              <h2 className="text-xl font-semibold text-foreground font-display mb-4">
                Areas of Interest
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                What types of volunteer work interest you? (Select all that apply)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interestOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleInterest(option)}
                    className={cn(
                      "p-3 rounded-lg border text-sm font-medium transition-all text-left",
                      selectedInterests.includes(option)
                        ? "border-secondary bg-secondary/5 text-secondary"
                        : "border-border hover:border-secondary/50 text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.interests && (
                <p className="text-sm text-destructive mt-2">{errors.interests.message}</p>
              )}
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Checkbox
                id="consent"
                onCheckedChange={(checked) => setValue('consent', checked === true)}
              />
              <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">
                I consent to EngageBC storing and using my information to contact me about volunteer opportunities. 
                I understand I can withdraw my consent at any time. This data will be handled in accordance with 
                Canadian privacy laws (PIPEDA).
              </label>
            </div>
            {errors.consent && (
              <p className="text-sm text-destructive">{errors.consent.message}</p>
            )}

            {/* Submit */}
            <Button type="submit" variant="accent" size="xl" className="w-full gap-2">
              Sign Up as a Volunteer
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
