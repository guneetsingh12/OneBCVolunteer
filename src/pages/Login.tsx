import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Vote, Sparkles, User as UserIcon, Shield, Briefcase } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'director' | 'volunteer'>('director');
    const { login } = useUser();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            await login(email, role);
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 flex-col">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-xl animate-fade-in">
                <div className="text-center space-y-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-accent shadow-accent mb-4">
                        <Vote className="h-8 w-8 text-sidebar-primary-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
                    <p className="text-muted-foreground">Log in to enter BC Connect political dashboard</p>
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
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-foreground">Choose your portal</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('director')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'director'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-card hover:bg-muted/50'
                                        }`}
                                >
                                    <Shield className={`h-6 w-6 mb-2 ${role === 'director' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <span className={`text-sm font-medium ${role === 'director' ? 'text-primary' : 'text-foreground'}`}>Director</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('volunteer')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'volunteer'
                                            ? 'border-secondary bg-secondary/5'
                                            : 'border-border bg-card hover:bg-muted/50'
                                        }`}
                                >
                                    <UserIcon className={`h-6 w-6 mb-2 ${role === 'volunteer' ? 'text-secondary' : 'text-muted-foreground'}`} />
                                    <span className={`text-sm font-medium ${role === 'volunteer' ? 'text-secondary' : 'text-foreground'}`}>Volunteer</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11 text-base font-semibold bg-gradient-primary shadow-lg hover:translate-y-[-1px] transition-all">
                        Enter Portal
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
