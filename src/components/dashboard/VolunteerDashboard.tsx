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
    MapPin,
    ClipboardList
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Activity {
    id: string;
    activity_type: string;
    hours_spent: number;
    doors_knocked: number;
    calls_made: number;
    notes: string;
    activity_date: string;
}

interface TaggedEvent {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    event_type: string;
}

interface TaggedTask {
    id: string;
    task_id: string;
    target: number;
    completed_count: number;
    status: string;
    task: {
        title: string;
        category: string;
        due_date: string;
    };
}

interface VolunteerDashboardProps {
    onAddActivity?: (data?: any) => void;
}

export function VolunteerDashboard({ onAddActivity }: VolunteerDashboardProps) {
    const { volunteerData } = useUser();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [taggedEvents, setTaggedEvents] = useState<TaggedEvent[]>([]);
    const [taggedTasks, setTaggedTasks] = useState<TaggedTask[]>([]);

    useEffect(() => {
        if (volunteerData?.id) {
            fetchActivities();
            fetchTaggedEvents();
            fetchTaggedTasks();
        }
    }, [volunteerData?.id]);

    const fetchTaggedTasks = async () => {
        if (!volunteerData?.id) return;

        const { data, error } = await supabase
            .from('task_assignments')
            .select(`
                id,
                task_id,
                target,
                completed_count,
                status,
                task:tasks (
                    title,
                    category,
                    due_date,
                    total_target,
                    task_assignments (
                        completed_count,
                        target
                    )
                )
            `)
            .eq('volunteer_id', volunteerData.id);

        if (!error && data) {
            // Calculate global progress for each task row
            const formatted = data.map((assignment: any) => {
                const subAssignments = assignment.task?.task_assignments || [];
                const globalProgress = subAssignments.reduce((sum: number, a: any) => sum + (a.completed_count || 0), 0);
                const calculatedGlobalTarget = subAssignments.reduce((sum: number, a: any) => sum + (a.target || 0), 0);

                return {
                    ...assignment,
                    global_progress: globalProgress,
                    global_target: assignment.task?.total_target || calculatedGlobalTarget || 0
                };
            });
            setTaggedTasks(formatted as any);
        }
    };

    const fetchTaggedEvents = async () => {
        if (!volunteerData?.id) return;

        const { data, error } = await supabase
            .from('event_volunteers')
            .select(`
                event_id,
                events (
                    id,
                    title,
                    description,
                    start_date,
                    end_date,
                    location,
                    event_type
                )
            `)
            .eq('volunteer_id', volunteerData.id);

        if (!error && data) {
            const extractedEvents = data
                .map((item: any) => item.events)
                .filter(Boolean)
                .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
            setTaggedEvents(extractedEvents);
        }
    };

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
                    {taggedEvents.length > 0 ? (
                        <div className="stat-card bg-gradient-hero border-none shadow-accent overflow-hidden relative">
                            <div className="relative z-10 text-white">
                                <h3 className="font-bold text-lg mb-4">Your Next Event</h3>
                                <div className="space-y-3">
                                    <div className="font-semibold text-xl mb-2">
                                        {taggedEvents[0].title}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm opacity-90">
                                        <Calendar className="h-4 w-4" />
                                        <span>{format(new Date(taggedEvents[0].start_date), 'EEEE, MMM d')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm opacity-90">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            {format(new Date(taggedEvents[0].start_date), 'h:mm a')} - {format(new Date(taggedEvents[0].end_date), 'h:mm a')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm opacity-90">
                                        <MapPin className="h-4 w-4" />
                                        <span className="line-clamp-2">{taggedEvents[0].location}</span>
                                    </div>
                                </div>
                                <Button className="w-full mt-6 bg-white text-primary hover:bg-white/90">
                                    View Event Info
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="stat-card bg-muted/30 border-dashed border-2 flex flex-col items-center justify-center p-8 text-center">
                            <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
                            <h3 className="font-bold text-lg text-foreground mb-1">No Upcoming Events</h3>
                            <p className="text-sm text-muted-foreground">You don't have any events tagged yet.</p>
                        </div>
                    )}

                    {taggedEvents.length > 1 && (
                        <div className="stat-card">
                            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Other Tagged Events</h4>
                            <div className="space-y-4">
                                {taggedEvents.slice(1, 3).map(event => (
                                    <div key={event.id} className="border-l-2 border-primary pl-3">
                                        <p className="font-medium text-sm text-foreground line-clamp-1">{event.title}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(event.start_date), 'MMM d, h:mm a')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tagged Tasks Sidebar Section */}
                    <div className="stat-card">
                        <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            Your Assigned Tasks
                            <Badge variant="outline" className="text-[10px] h-4 px-1">{taggedTasks.length}</Badge>
                        </h4>
                        <div className="space-y-4">
                            {taggedTasks.length > 0 ? (
                                taggedTasks.map(assignment => (
                                    <div key={assignment.id} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-sm text-foreground line-clamp-1">{assignment.task?.title}</p>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                                                {assignment.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                            <span>{assignment.task?.category}</span>
                                            {assignment.task?.due_date && (
                                                <span>Due {format(new Date(assignment.task.due_date), 'MMM d')}</span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{assignment.completed_count} / {assignment.target}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${Math.min((assignment.completed_count / (assignment.target || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">No tasks assigned yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Tasks Section (Requested) */}
            <div className="stat-card mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2 font-display">
                        <ClipboardList className="h-6 w-6 text-primary" />
                        Campaign Priority Tasks
                    </h3>
                    <Button variant="outline" onClick={() => onAddActivity?.()}>Log Generic Activity</Button>
                </div>

                {/* Status Scorecard */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted/20 rounded-xl text-center border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Assigned</p>
                        <p className="text-xl font-bold text-foreground">{taggedTasks.length}</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-xl text-center border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">In Progress</p>
                        <p className="text-xl font-bold text-warning">{taggedTasks.filter(t => t.status === 'in_progress').length}</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-xl text-center border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
                        <p className="text-xl font-bold text-success">{taggedTasks.filter(t => t.status === 'completed').length}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {taggedTasks.map(assignment => (
                        <div key={assignment.id} className="p-4 bg-muted/20 border border-border rounded-2xl hover:border-primary/30 transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h4 className="font-bold text-foreground line-clamp-1">{assignment.task?.title}</h4>
                                    <p className="text-xs text-muted-foreground">{assignment.task?.category}</p>
                                </div>
                                <Badge className="capitalize shrink-0">{assignment.status.replace('_', ' ')}</Badge>
                            </div>
                            <div className="space-y-2 mb-4 flex-1">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-foreground">Your Progress</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">{Math.round((assignment.completed_count / (assignment.target || (assignment as any).global_target || 1)) * 100)}%</span>
                                        <span className="text-muted-foreground">{assignment.completed_count} / {assignment.target || (assignment as any).global_target || '—'}</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${Math.min((assignment.completed_count / (assignment.target || (assignment as any).global_target || 1)) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                                    <span className="uppercase tracking-tight">Overall Campaign Progress</span>
                                    <span className="font-bold">{(assignment as any).global_progress || 0} / {(assignment as any).global_target || 0}</span>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-none"
                                onClick={() => onAddActivity?.({
                                    taskId: assignment.task_id,
                                    assignmentId: assignment.id,
                                    category: assignment.task?.category,
                                    title: assignment.task?.title
                                })}
                            >
                                Log This Milestone
                            </Button>
                        </div>
                    ))}
                    {taggedTasks.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-muted/10 rounded-2xl border border-dashed">
                            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No tasks currently assigned to you.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VolunteerDashboard;
