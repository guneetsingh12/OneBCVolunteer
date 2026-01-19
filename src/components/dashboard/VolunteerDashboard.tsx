import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import {
    Clock,
    Calendar,
    DoorOpen,
    Phone,
    TrendingUp,
    Activity as ActivityIcon,
    MapPin
} from 'lucide-react';

interface Activity {
    id: string;
    activity_type: string;
    hours_spent: number;
    doors_knocked: number;
    calls_made: number;
    notes: string;
    activity_date: string;
}

export function VolunteerDashboard() {
    const { volunteerData } = useUser();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (volunteerData?.id) {
            fetchActivities();
        }
    }, [volunteerData?.id]);

    const fetchActivities = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('activities')
            .select('*')
            .eq('volunteer_id', volunteerData?.id)
            .order('activity_date', { ascending: false });

        if (data) setActivities(data as Activity[]);
        setLoading(false);
    };

    // Calculate real-time stats from the activities table
    const totalHours = activities.reduce((sum, act) => sum + (Number(act.hours_spent) || 0), 0);
    const totalContacts = activities.reduce((sum, act) => sum + (Number(act.doors_knocked) || 0) + (Number(act.calls_made) || 0), 0);
    const totalShifts = activities.length;

    const stats = [
        { label: 'Total Hours', value: totalHours.toFixed(1), icon: Clock, color: 'text-primary' },
        { label: 'Total Shifts', value: totalShifts, icon: Calendar, color: 'text-secondary' },
        { label: 'Contacts Made', value: totalContacts, icon: DoorOpen, color: 'text-accent' },
        { label: 'Experience', value: totalHours > 50 ? 'Expert' : totalHours > 10 ? 'Intermediate' : 'New', icon: TrendingUp, color: 'text-success' },
    ];

    const recentActivities = activities.slice(0, 3);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-foreground font-display">Welcome Back, {volunteerData?.first_name || 'Volunteer'}!</h2>
                <p className="text-muted-foreground">Here's an overview of your impact in {volunteerData?.riding || 'your riding'}.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="stat-card animate-slide-up"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-muted rounded-xl">
                                    <Icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</p>
                                    <p className="text-2xl font-bold text-foreground capitalize">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Impact Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <ActivityIcon className="h-5 w-5 text-primary" />
                                Your Recent Impact
                            </h3>
                            <button className="text-sm text-primary hover:underline">View All</button>
                        </div>

                        <div className="space-y-4">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        {activity.activity_type === 'door_knock' ? <DoorOpen className="h-5 w-5 text-primary" /> : <Phone className="h-5 w-5 text-info" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground capitalize">{activity.activity_type.replace('_', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(activity.activity_date), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground">
                                            {activity.activity_type === 'door_knock' ? `${activity.doors_knocked} Doors` : `${activity.calls_made} Calls`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{activity.hours_spent} hours</p>
                                    </div>
                                </div>
                            ))}

                            {recentActivities.length === 0 && !loading && (
                                <p className="text-center text-muted-foreground py-8">No activities logged yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Next Event Sidebar */}
                <div className="space-y-6">
                    <div className="stat-card bg-gradient-hero border-none shadow-accent overflow-hidden relative">
                        <div className="relative z-10 text-white">
                            <h3 className="font-bold text-lg mb-4">Your Next Event</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span>Saturday, Jan 24</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="h-4 w-4" />
                                    <span>10:00 AM - 1:00 PM</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="h-4 w-4" />
                                    <span>Kitsilano Community Center</span>
                                </div>
                            </div>
                            <Button className="w-full mt-6 bg-white text-primary hover:bg-white/90">
                                View Event Info
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VolunteerDashboard;
