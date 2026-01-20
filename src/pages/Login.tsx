import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Vote, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const DIRECTOR_EMAIL = 'arishali1674@gmail.com';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useUser();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({
                title: "Missing fields",
                description: "Please enter both email and password",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            console.log('[Login] Starting login for:', email);

            // Check if user exists in volunteers table and check their role status
            const { data: volunteerData } = await supabase
                .from('volunteers')
                .select('id, email')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();

            if (volunteerData) {
                console.log('[Login] Found volunteer record:', volunteerData.id);
                // Check if they have a password set in user_roles
                const { data: roleData, error: roleError } = await supabase
                    .from('user_roles')
                    .select('*')
                    .or(`user_id.eq.${volunteerData.id},id.eq.${volunteerData.id}`)
                    .maybeSingle();

                if (roleError) console.error('[Login] Error checking roleData:', roleError);

                if (roleData) {
                    if (roleData.status === 'pending') {
                        toast({
                            title: "Approval Pending",
                            description: "Your account request is still being reviewed by the director.",
                            variant: "destructive"
                        });
                        setLoading(false);
                        return;
                    }
                } else {
                    console.log('[Login] No role record found for volunteer');
                    // If no role record, we default to volunteer and allow login
                    // OR we could redirect to signup if we expect a role record
                }
            } else if (email.toLowerCase().trim() === DIRECTOR_EMAIL) {
                console.log('[Login] Checking director role setup');
                // Check if director has role record
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('*')
                    .eq('role', 'director')
                    .limit(1);

                if (!roleData || roleData.length === 0 || !roleData[0].password || roleData[0].password.length === 0) {
                    console.log('[Login] Director setup not found or password not set');
                    toast({
                        title: "Setup Required",
                        description: "Director account needs setup.",
                    });
                    navigate('/signup?email=' + encodeURIComponent(email) + '&role=director');
                    setLoading(false);
                    return;
                }

                if (roleData[0].status === 'pending') {
                    toast({
                        title: "Access Restricted",
                        description: "Director access pending activation.",
                        variant: "destructive"
                    });
                    setLoading(false);
                    return;
                }
            }

            // Attempt Supabase Auth login
            console.log('[Login] Attempting auth sign-in...');
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password
            });

            if (authError) {
                console.error('[Login] Auth error:', authError);
                let errorMessage = authError.message;

                if (errorMessage.toLowerCase().includes('email not confirmed')) {
                    errorMessage = "Your email hasn't been confirmed yet. Admin: Please disable 'Confirm email' in Supabase Auth Settings or check your inbox.";
                }

                toast({
                    title: "Login Failed",
                    description: errorMessage,
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            console.log('[Login] Auth success, user ID:', authData.user?.id);

            // --- NEW: Fetch the actual approved role from database ---
            const { data: roleRecord, error: roleFetchError } = await supabase
                .from('user_roles')
                .select('role, status')
                .eq('user_id', authData.user?.id)
                .maybeSingle();

            if (roleFetchError) console.error('[Login] Error fetching role:', roleFetchError);

            // Determine role: use database role if approved, otherwise default to volunteer
            let role: 'volunteer' | 'team_lead' | 'director' = 'volunteer';

            if (roleRecord) {
                if (roleRecord.status === 'approved') {
                    role = roleRecord.role as any;
                } else {
                    toast({
                        title: "Access Restricted",
                        description: `Your ${roleRecord.role} access is still pending approval. Logging in with limited access.`,
                    });
                }
            }

            // If volunteer, verify they exist in volunteers table (extra safety)
            if (role === 'volunteer') {
                const { data: volunteerData } = await supabase
                    .from('volunteers')
                    .select('id, email')
                    .eq('email', email.toLowerCase().trim())
                    .maybeSingle();

                if (!volunteerData && email.toLowerCase().trim() !== DIRECTOR_EMAIL) {
                    toast({
                        title: "Access Denied",
                        description: "Your account is not fully set up. Please contact the director.",
                        variant: "destructive"
                    });
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }
            }

            await login(email, role, authData.user?.id);
            toast({
                title: "Welcome back!",
                description: `Logged in as ${role === 'director' ? 'Director' : role === 'team_lead' ? 'Team Lead' : 'Volunteer'}`,
            });
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive"
            });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 flex-col">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-xl animate-fade-in">
                <div className="text-center space-y-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-accent shadow-accent mb-4">
                        <Vote className="h-8 w-8 text-sidebar-primary-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
                    <p className="text-muted-foreground">Log in to BC Connect</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                                Email address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                required
                                className="bg-background"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="bg-background pr-10"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-semibold bg-gradient-primary shadow-lg hover:translate-y-[-1px] transition-all"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </form>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        First time?{' '}
                        <Link to="/signup" className="text-primary hover:underline font-medium">
                            Set up your account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
