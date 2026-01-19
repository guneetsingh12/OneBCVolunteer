import { useEffect, useState } from 'react';
import {
    DoorOpen,
    Phone,
    Clock,
    Calendar,
    MoreVertical,
    Activity as ActivityIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface Activity {
    id: string;
    activity_type: string;
    hours_spent: number;
    doors_knocked: number;
    calls_made: number;
    notes: string;
    activity_date: string;
    created_at: string;
}

export function PersonalActivities() {
    const { volunteerData } = useUser();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (volunteerData) {
            fetchActivities();
        }
    }, [volunteerData]);

    const fetchActivities = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('volunteer_id', volunteerData?.id)
            .order('activity_date', { ascending: false });

        if (data) {
            setActivities(data as unknown as Activity[]);
        }
        setLoading(false);
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'door_knock': return DoorOpen;
            case 'phone_bank': return Phone;
            default: return ActivityIcon;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'door_knock': return 'text-primary bg-primary/10';
            case 'phone_bank': return 'text-info bg-info/10';
            default: return 'text-muted-foreground bg-muted';
        }
    };

    if (loading) return <div>Loading activities...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="stat-card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground font-display">My Activity History</h3>
                    <p className="text-sm text-muted-foreground">Total records: {activities.length}</p>
                </div>

                <div className="space-y-4">
                    {activities.map((activity) => {
                        const Icon = getActivityIcon(activity.activity_type);
                        const colorClass = getActivityColor(activity.activity_type);

                        return (
                            <div
                                key={activity.id}
                                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group"
                            >
                                <div className={`p-3 rounded-xl shrink-0 ${colorClass}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-foreground capitalize">
                                            {activity.activity_type.replace('_', ' ')}
                                        </p>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(activity.activity_date), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                        {activity.notes || 'No notes added'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 px-4 border-r border-border">
                                    <p className="text-sm font-bold text-foreground">
                                        {activity.activity_type === 'door_knock' ? activity.doors_knocked : activity.calls_made}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.activity_type === 'door_knock' ? 'Doors' : 'Calls'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 px-4 min-w-[80px]">
                                    <p className="text-sm font-bold text-foreground">{activity.hours_spent}h</p>
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                </div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}

                    {activities.length === 0 && (
                        <div className="text-center py-12">
                            <ActivityIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">You haven't logged any activities yet.</p>
                            <Button variant="link" color="primary">Start your first activity</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
