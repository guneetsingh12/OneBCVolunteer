import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vote, Mail, Phone, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, Car, Languages, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  postal_code: z.string().regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Invalid BC postal code'),
  city: z.string().min(1, 'City is required'),
  street_address: z.string().optional(),

  // Volunteer specifics
  role: z.enum(['volunteer', 'team_lead', 'director']).default('volunteer'),
  preferred_contact: z.enum(['email', 'phone', 'text']).default('email'),
  languages: z.array(z.string()).default(['English']),
  hours_per_week: z.number().min(1).max(40).default(5),
  experience_level: z.enum(['new', 'some', 'experienced', 'veteran']).default('new'),
  has_vehicle: z.boolean().default(false),
  skills_notes: z.string().optional(),
  availability_days: z.array(z.string()).optional(),
  availability_times: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),

  consent: z.boolean().refine(val => val === true, 'Consent is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const availabilityDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const availabilityTimes = ['Morning', 'Afternoon', 'Evening'];
const interestOptions = [
  'Door Knocking', 'Phone Banking', 'Event Volunteering', 'Data Entry',
  'Social Media', 'Translation', 'Driving', 'Administrative'
];
const languageOptions = ['English', 'French', 'Mandarin', 'Cantonese', 'Punjabi', 'Hindi', 'Spanish', 'Tagalog', 'Korean', 'Other'];

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [existingVolunteer, setExistingVolunteer] = useState<any>(null);

  const prefillEmail = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: prefillEmail,
      role: 'volunteer',
      languages: ['English'],
      preferred_contact: 'email',
      experience_level: 'new',
      hours_per_week: 5,
      has_vehicle: false,
      consent: false,
    }
  });

  const emailValue = watch('email');
  const roleValue = watch('role');

  useEffect(() => {
    const checkExistingVolunteer = async () => {
      const email = emailValue?.toLowerCase().trim();
      if (!email || !email.includes('@')) {
        setExistingVolunteer(null);
        return;
      }

      if (email === DIRECTOR_EMAIL) {
        setValue('role', 'director');
        setExistingVolunteer(null);
        return;
      }

      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        setExistingVolunteer(data);
        setValue('role', 'volunteer'); // Force role to volunteer if they exist in that table
        setValue('first_name', data.first_name || '');
        setValue('last_name', data.last_name || '');
        setValue('phone', data.phone || '');
        setValue('city', data.city || '');
        setValue('postal_code', data.postal_code || '');
        setValue('street_address', data.street_address || '');
        setValue('preferred_contact', data.preferred_contact || 'email');
        setValue('experience_level', data.experience_level || 'new');
        setValue('hours_per_week', data.hours_per_week || 5);
        setValue('has_vehicle', data.has_vehicle || false);
        setValue('skills_notes', data.skills_notes || '');

        if (data.availability_days?.length) {
          setSelectedDays(data.availability_days);
          setValue('availability_days', data.availability_days);
        }
        if (data.availability_times?.length) {
          setSelectedTimes(data.availability_times);
          setValue('availability_times', data.availability_times);
        }
        if (data.role_interest?.length) {
          setSelectedInterests(data.role_interest);
          setValue('interests', data.role_interest);
        }
        if (data.languages?.length) {
          setSelectedLanguages(data.languages);
          setValue('languages', data.languages);
        }
        setValue('consent', data.consent_given || true);
      } else {
        setExistingVolunteer(null);
      }
    };

    checkExistingVolunteer();
  }, [emailValue, setValue]);

  const toggleDay = (item: string) => {
    const next = selectedDays.includes(item) ? selectedDays.filter(i => i !== item) : [...selectedDays, item];
    setSelectedDays(next);
    setValue('availability_days', next);
  };

  const toggleTime = (item: string) => {
    const next = selectedTimes.includes(item) ? selectedTimes.filter(i => i !== item) : [...selectedTimes, item];
    setSelectedTimes(next);
    setValue('availability_times', next);
  };

  const toggleInterest = (item: string) => {
    const next = selectedInterests.includes(item) ? selectedInterests.filter(i => i !== item) : [...selectedInterests, item];
    setSelectedInterests(next);
    setValue('interests', next);
  };

  const toggleLanguage = (item: string) => {
    const next = selectedLanguages.includes(item) ? selectedLanguages.filter(i => i !== item) : [...selectedLanguages, item];
    setSelectedLanguages(next);
    setValue('languages', next);
  };

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast({
            title: "Account Exists",
            description: "You already have a login. Please go to the Login page.",
            variant: "destructive"
          });
        } else {
          toast({ title: "Signup Error", description: authError.message, variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      const isPrimaryDirector = data.email.toLowerCase().trim() === DIRECTOR_EMAIL;

      // --- STEP 1: Handle User Role ---
      // Instead of upsert which triggers unique constraint errors, we'll check then insert/update
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', authData.user?.id)
        .maybeSingle();

      const roleStatus = (isPrimaryDirector || data.role === 'volunteer') ? 'approved' : 'pending';
      const rolePayload = {
        user_id: authData.user?.id,
        email: data.email.toLowerCase().trim(),
        role: data.role,
        password: ['updated'],
        status: roleStatus
      };

      if (existingRole) {
        await supabase.from('user_roles').update(rolePayload).eq('user_id', authData.user?.id);
      } else {
        await supabase.from('user_roles').insert(rolePayload);
      }

      // --- STEP 2: Handle Volunteer Record ---
      // We keep the Auth User ID as the primary link ID for NEW volunteers.
      // For EXISTING volunteers, we update their record by email.
      const volunteerPayload: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        city: data.city,
        postal_code: data.postal_code,
        street_address: data.street_address || '',
        preferred_contact: data.preferred_contact,
        languages: selectedLanguages,
        hours_per_week: data.hours_per_week,
        experience_level: data.experience_level,
        has_vehicle: data.has_vehicle,
        skills_notes: data.skills_notes,
        availability_days: selectedDays,
        availability_times: selectedTimes,
        role_interest: selectedInterests,
        consent_given: data.consent,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (existingVolunteer) {
        // Update the existing record. We keep the original ID to preserve existing links
        const { error: updateError } = await supabase
          .from('volunteers')
          .update(volunteerPayload)
          .eq('email', data.email.toLowerCase().trim());

        if (updateError) console.error('Volunteer Update Error:', updateError);
      } else {
        // Insert new record using the Auth ID as the record ID
        const { error: insertError } = await supabase.from('volunteers').insert({
          ...volunteerPayload,
          id: authData.user?.id,
          date_signed_up: new Date().toISOString(),
          created_at: new Date().toISOString(),
          riding: 'Needs Review',
          riding_confirmed: false,
        });
        if (insertError) console.error('Volunteer Insert Error:', insertError);
      }

      toast({
        title: "Account Created!",
        description: (isPrimaryDirector || data.role === 'volunteer')
          ? "You can now login."
          : `Your request for ${data.role} access is pending director approval.`,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Signup error:', err);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong during signup. Please check console for details.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6 text-center">
        <div className="max-w-md animate-scale-in">
          <CheckCircle2 className="h-20 w-20 text-success mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-primary-foreground mb-4">Welcome Aboard!</h1>
          <p className="text-primary-foreground/80 mb-8">
            Your account has been created. {watch('role') !== 'volunteer' && "Once the director approves your level of access, you'll be able to see the full dashboard."}
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-hero text-primary-foreground py-16 px-6 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center rotate-3 scale-110 shadow-2xl">
            <Vote className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4 font-display tracking-tight">Support BC Connect</h1>
        <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">Help us build a better future. Sign up today to get involved.</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12">
        <div className="bg-card rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 space-y-10 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">

            {existingVolunteer && (
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="text-xl font-bold text-primary mb-2">Welcome back, {existingVolunteer.first_name}!</h2>
                <p className="text-sm text-muted-foreground">
                  We found your volunteer record. Please set up a password to access your dashboard.
                </p>
              </div>
            )}

            {/* Role Header */}
            {!existingVolunteer && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-2xl font-bold font-display">Who are you joining as?</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'volunteer', label: 'Volunteer', desc: 'Standard access' },
                    { id: 'team_lead', label: 'Team Lead', desc: 'Manage local ridings' },
                    { id: 'director', label: 'Director', desc: 'System administrator' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setValue('role', r.id as any)}
                      className={cn(
                        "p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                        watch('role') === r.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <div className="font-bold text-lg mb-1">{r.label}</div>
                      <div className="text-sm text-muted-foreground">{r.desc}</div>
                      {r.id !== 'volunteer' && (
                        <div className="mt-3 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full inline-block border border-amber-100">
                          APPROVAL REQUIRED
                        </div>
                      )}
                      {watch('role') === r.id && (
                        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold font-display">Account Credentials</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="text-sm font-semibold mb-2 block">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...register('email')} className="pl-10 h-12 rounded-xl" disabled={!!prefillEmail} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Password *</label>
                  <Input {...register('password')} type="password" placeholder="••••••••" className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Confirm Password *</label>
                  <Input {...register('confirmPassword')} type="password" placeholder="••••••••" className="h-12 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Basic Details */}
            {!existingVolunteer && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-2xl font-bold font-display">Personal Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">First Name *</label>
                    <Input {...register('first_name')} className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Last Name *</label>
                    <Input {...register('last_name')} className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Phone Number *</label>
                    <Input {...register('phone')} className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Preferred Contact</label>
                    <select {...register('preferred_contact')} className="w-full h-12 px-3 rounded-xl border border-input bg-card text-sm font-medium">
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="text">SMS/Text</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Full Volunteer Form - Conditional */}
            {roleValue === 'volunteer' && !existingVolunteer && (
              <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-2xl font-bold font-display">Address Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold mb-2 block">Street Address</label>
                      <Input {...register('street_address')} className="h-12 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">City *</label>
                      <Input {...register('city')} className="h-12 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Postal Code *</label>
                      <Input {...register('postal_code')} placeholder="V6B 1A1" className="h-12 rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold font-display">Languages Spoken</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {languageOptions.map(l => (
                        <button key={l} type="button" onClick={() => toggleLanguage(l)}
                          className={cn("px-4 py-2 rounded-full text-sm font-bold border transition-all", selectedLanguages.includes(l) ? "bg-primary text-white border-primary" : "hover:border-primary")}
                        >{l}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold font-display">Experience & Time</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block opacity-60">Experience Level</label>
                        <select {...register('experience_level')} className="w-full h-10 px-3 rounded-lg border border-input bg-card text-xs font-bold">
                          <option value="new">New</option>
                          <option value="some">Intermediate</option>
                          <option value="experienced">Experienced</option>
                          <option value="veteran">Campaign Veteran</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block opacity-60">Hours/Week</label>
                        <Input {...register('hours_per_week', { valueAsNumber: true })} type="number" className="h-10 rounded-lg text-xs font-bold" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <Switch onCheckedChange={(c) => setValue('has_vehicle', c)} checked={watch('has_vehicle')} />
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">I have a vehicle</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-2xl font-bold font-display">Availability & Interests</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">When can you help?</p>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {availabilityDays.map(d => (
                            <button key={d} type="button" onClick={() => toggleDay(d)}
                              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", selectedDays.includes(d) ? "bg-accent text-white border-accent" : "hover:border-primary")}
                            >{d.slice(0, 3)}</button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availabilityTimes.map(t => (
                            <button key={t} type="button" onClick={() => toggleTime(t)}
                              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", selectedTimes.includes(t) ? "bg-accent text-white border-accent" : "hover:border-primary")}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">What interests you?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {interestOptions.map(i => (
                          <button key={i} type="button" onClick={() => toggleInterest(i)}
                            className={cn("px-3 py-3 rounded-xl text-[11px] font-bold border text-left transition-all", selectedInterests.includes(i) ? "bg-secondary text-white border-secondary" : "hover:border-secondary")}
                          >{i}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold px-1">Skills & Notes</label>
                  <Textarea {...register('skills_notes')} placeholder="Tell us about any specific skills or things we should know..." className="rounded-2xl" rows={4} />
                </div>
              </div>
            )}

            {/* Simple Address for non-volunteers */}
            {roleValue !== 'volunteer' && !existingVolunteer && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold mb-2 block">City *</label>
                  <Input {...register('city')} className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Postal Code *</label>
                  <Input {...register('postal_code')} className="h-12 rounded-xl" />
                </div>
              </div>
            )}

            {/* Submit & Consent */}
            <div className="pt-6 space-y-8">
              <div className="flex items-start gap-4 p-6 bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/20">
                <Checkbox id="consent" onCheckedChange={(c) => setValue('consent', c === true)} className="mt-1" />
                <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">
                  I agree to receive communications from BC Connect. I understand that my data will be stored securely and that I can opt-out at any time.
                </label>
              </div>

              <Button type="submit" size="xl" className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 gap-3" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                  <>
                    Complete Registration
                    <ArrowRight className="h-6 w-6" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign in here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
