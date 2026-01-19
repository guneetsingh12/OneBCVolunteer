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
            // Attempt Supabase Auth login
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password
            });

            if (authError) {
                // If auth fails, check if user exists in volunteers table (first-time setup)
                if (authError.message.includes('Invalid login credentials')) {
                    const { data: volunteerData } = await supabase
                        .from('volunteers')
                        .select('email')
                        .eq('email', email.toLowerCase().trim())
                        .maybeSingle();

                    if (volunteerData) {
                        toast({
                            title: "Password Setup Required",
                            description: "You need to set up your password first. Please use the Sign Up page.",
                            variant: "destructive"
                        });
                        navigate('/signup?email=' + encodeURIComponent(email));
                    } else if (email.toLowerCase().trim() === DIRECTOR_EMAIL) {
                        toast({
                            title: "Director Account",
                            description: "Please set up your director account via Sign Up first.",
                            variant: "destructive"
                        });
                        navigate('/signup?email=' + encodeURIComponent(email) + '&role=director');
                    } else {
                        toast({
                            title: "Login Failed",
                            description: "Invalid email or password. If you're new, please sign up first.",
                            variant: "destructive"
                        });
                    }
                } else {
                    toast({
                        title: "Login Error",
                        description: authError.message,
                        variant: "destructive"
                    });
                }
                setLoading(false);
                return;
            }

            // Determine role based on email
            const isDirector = email.toLowerCase().trim() === DIRECTOR_EMAIL;
            const role = isDirector ? 'director' : 'volunteer';

            // If volunteer, verify they exist in volunteers table
            if (!isDirector) {
                const { data: volunteerData } = await supabase
                    .from('volunteers')
                    .select('id, email')
                    .eq('email', email.toLowerCase().trim())
                    .maybeSingle();

                if (!volunteerData) {
                    toast({
                        title: "Access Denied",
                        description: "Your email is not registered as a volunteer. Please contact the director.",
                        variant: "destructive"
                    });
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }
            }

            await login(email, role);
            toast({
                title: "Welcome back!",
                description: `Logged in as ${role === 'director' ? 'Director' : 'Volunteer'}`,
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
