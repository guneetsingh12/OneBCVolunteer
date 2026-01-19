import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vote, Mail, Phone, MapPin, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const DIRECTOR_EMAIL = 'arishali1674@gmail.com';

const signupSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  postal_code: z.string().regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Invalid postal code'),
  city: z.string().min(1, 'City is required'),
  street_address: z.string().optional(),
  availability: z.array(z.string()).min(1, 'Select at least one availability'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [existingVolunteer, setExistingVolunteer] = useState<any>(null);
  const [isDirectorSignup, setIsDirectorSignup] = useState(false);

  const prefillEmail = searchParams.get('email') || '';
  const roleParam = searchParams.get('role');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: prefillEmail,
      availability: [],
      interests: [],
      consent: false,
    }
  });

  const emailValue = watch('email');

  // Check if volunteer exists when email changes
  useEffect(() => {
    const checkExistingVolunteer = async () => {
      const email = emailValue?.toLowerCase().trim();
      if (!email || !email.includes('@')) return;

      // Check if director email
      if (email === DIRECTOR_EMAIL) {
        setIsDirectorSignup(true);
        setExistingVolunteer(null);
        return;
      }

      setIsDirectorSignup(false);

      // Check if volunteer exists in database
      const { data } = await supabase
        .from('volunteers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        setExistingVolunteer(data);
        // Pre-fill form with existing data
        setValue('first_name', data.first_name || '');
        setValue('last_name', data.last_name || '');
        setValue('phone', data.phone || '');
        setValue('city', data.city || '');
        setValue('postal_code', data.postal_code || '');
        setValue('street_address', data.street_address || '');
        
        if (data.availability_days?.length) {
          setSelectedAvailability(data.availability_days);
          setValue('availability', data.availability_days);
        }
        if (data.role_interest?.length) {
          setSelectedInterests(data.role_interest);
          setValue('interests', data.role_interest);
        }
        setValue('consent', data.consent_given || false);
      } else {
        setExistingVolunteer(null);
      }
    };

    checkExistingVolunteer();
  }, [emailValue, setValue]);

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

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);

    try {
      // Create Supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast({
            title: "Account Exists",
            description: "This email already has an account. Please login instead.",
            variant: "destructive"
          });
          navigate('/login');
        } else {
          toast({
            title: "Signup Error",
            description: authError.message,
            variant: "destructive"
          });
        }
        setLoading(false);
        return;
      }

      // If this is a director, we're done (they don't need a volunteer record)
      if (isDirectorSignup) {
        toast({
          title: "Director Account Created",
          description: "You can now login with your email and password.",
        });
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // For volunteers: Update or create volunteer record
      const volunteerData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        city: data.city,
        postal_code: data.postal_code,
        street_address: data.street_address || '',
        availability_days: data.availability,
        role_interest: data.interests,
        consent_given: data.consent,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (existingVolunteer) {
        // Update existing volunteer
        const { error } = await supabase
          .from('volunteers')
          .update(volunteerData)
          .eq('id', existingVolunteer.id);

        if (error) {
          console.error('Error updating volunteer:', error);
        }
      } else {
        // Create new volunteer record
        const { error } = await supabase
          .from('volunteers')
          .insert({
            ...volunteerData,
            date_signed_up: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error creating volunteer:', error);
        }
      }

      toast({
        title: "Account Created!",
        description: "You can now login with your email and password.",
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Signup error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground font-display mb-4">
            Account Created Successfully!
          </h1>
          <p className="text-primary-foreground/80 mb-8">
            {isDirectorSignup 
              ? "Your director account is ready. You can now login to access the full dashboard."
              : "Your volunteer account has been set up. You can now login to track your activities."}
          </p>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => navigate('/login')}
          >
            Go to Login
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-primary-foreground py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
              <Vote className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold font-display">BC Connect</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
            {isDirectorSignup ? 'Director Account Setup' : existingVolunteer ? 'Complete Your Account' : 'Volunteer Sign Up'}
          </h1>
          <p className="text-lg text-primary-foreground/80">
            {isDirectorSignup 
              ? 'Set up your password to access the director dashboard'
              : existingVolunteer 
                ? 'Set up your password to access your volunteer portal'
                : 'Create your volunteer account'}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-6 py-8 -mt-6">
        <div className="bg-card rounded-2xl shadow-xl p-8 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email & Password */}
            <div>
              <h2 className="text-xl font-semibold text-foreground font-display mb-4">
                Account Credentials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      {...register('email')} 
                      type="email" 
                      placeholder="your@email.com" 
                      className="pl-10"
                      disabled={!!prefillEmail}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                  {existingVolunteer && (
                    <p className="text-sm text-success mt-1">✓ Found your volunteer record - we'll link your account</p>
                  )}
                  {isDirectorSignup && (
                    <p className="text-sm text-primary mt-1">✓ Director account - full access will be granted</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password *
                  </label>
                  <Input
                    {...register('confirmPassword')}
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information - not needed for director */}
            {!isDirectorSignup && (
              <>
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
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Street Address
                      </label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...register('street_address')} placeholder="123 Main St" className="pl-10" />
                      </div>
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
                    checked={watch('consent')}
                  />
                  <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">
                    I consent to BC Connect storing and using my information to contact me about volunteer opportunities. 
                    I understand I can withdraw my consent at any time.
                  </label>
                </div>
                {errors.consent && (
                  <p className="text-sm text-destructive">{errors.consent.message}</p>
                )}
              </>
            )}

            {/* For director, just show consent */}
            {isDirectorSignup && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Checkbox
                  id="consent"
                  onCheckedChange={(checked) => setValue('consent', checked === true)}
                />
                <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">
                  I agree to the terms and conditions of BC Connect.
                </label>
              </div>
            )}

            {/* Submit */}
            <Button 
              type="submit" 
              variant="accent" 
              size="xl" 
              className="w-full gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
