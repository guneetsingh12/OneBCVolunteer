import { useState } from 'react';
import {
    X,
    Clock,
    DoorOpen,
    Phone,
    MessageSquare,
    Calendar,
    CheckCircle2,
    ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface LogActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: {
        taskId?: string;
        assignmentId?: string;
        category?: string;
        title?: string;
    };
}

export function LogActivityModal({ isOpen, onClose, onSuccess, initialData }: LogActivityModalProps) {
    const { volunteerData, refreshVolunteerData } = useUser();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [activityType, setActivityType] = useState('door_knock');
    const [hoursSpent, setHoursSpent] = useState('0');
    const [doorsKnocked, setDoorsKnocked] = useState('0');
    const [callsMade, setCallsMade] = useState('0');
    const [notes, setNotes] = useState('');

    // Reset or set initial data when modal opens
    useState(() => {
        if (initialData?.category) {
            const cat = initialData.category.toLowerCase();
            if (cat.includes('phone')) setActivityType('phone_bank');
            else if (cat.includes('logistics')) setActivityType('office');
            else if (cat.includes('media')) setActivityType('other');
        }
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!volunteerData) {
            toast({ title: "Error", description: "Volunteer data not found. Please log in again.", variant: "destructive" });
            return;
        }

        if (parseFloat(hoursSpent) <= 0) {
            toast({ title: "Validation Error", description: "Please enter a valid number of hours spent.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            console.log('[Activity] Attempting to log activity for:', volunteerData.id);
            const { data: activityData, error: insertError } = await supabase
                .from('activities')
                .insert({
                    volunteer_id: volunteerData.id,
                    activity_type: activityType,
                    hours_spent: parseFloat(hoursSpent),
                    doors_knocked: parseInt(doorsKnocked),
                    calls_made: parseInt(callsMade),
                    notes: initialData?.taskId ? `[Task: ${initialData.title}] ${notes}` : notes,
                    activity_date: new Date().toISOString().split('T')[0]
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // If this activity is linked to a task, update the task progress
            if (initialData?.assignmentId) {
                const increment = activityType === 'door_knock' ? parseInt(doorsKnocked) :
                    activityType === 'phone_bank' ? parseInt(callsMade) : 1;

                // Fetch current completed count
                const { data: currentAssign } = await supabase
                    .from('task_assignments')
                    .select('completed_count')
                    .eq('id', initialData.assignmentId)
                    .single();

                const newCount = (currentAssign?.completed_count || 0) + increment;

                await supabase
                    .from('task_assignments')
                    .update({
                        completed_count: newCount,
                        status: 'in_progress'
                    })
                    .eq('id', initialData.assignmentId);
            }

            // Update volunteer aggregates
            // Using parseFloat/parseInt to ensure types are correct for the DB
            const { error: updateError } = await supabase
                .from('volunteers')
                .update({
                    total_hours: Number((volunteerData.total_hours || 0) + parseFloat(hoursSpent)),
                    total_doors_or_dials: Number((volunteerData.total_doors_or_dials || 0) + parseInt(doorsKnocked) + parseInt(callsMade)),
                    total_shifts: Number((volunteerData.total_shifts || 0) + 1)
                })
                .eq('id', volunteerData.id);

            if (updateError) {
                console.error('[Activity] Aggregate update failed:', updateError);
                // We don't throw here because the activity was already inserted
            }

            toast({
                title: "Activity Logged",
                description: "Your impact has been recorded. Thank you for your work!",
            });

            await refreshVolunteerData(); // Refresh the context data
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('[Activity] Error detail:', err);
            let errorMessage = "Failed to log activity. Please try again.";

            if (err.message?.includes('relation "activities" does not exist')) {
                errorMessage = "Database table 'activities' is missing. Please run the SQL migration.";
            } else if (err.code === '42501') {
                errorMessage = "Permission denied (RLS). Please check database policies.";
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const activityTypes = [
        { id: 'door_knock', label: 'Door Knocking', icon: DoorOpen },
        { id: 'phone_bank', label: 'Phone Banking', icon: Phone },
        { id: 'rally', label: 'Rally/Event', icon: CheckCircle2 },
        { id: 'office', label: 'Office Work', icon: Clock },
        { id: 'other', label: 'Other', icon: MessageSquare },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Log Your Activity</h2>
                        {initialData?.title && (
                            <p className="text-xs text-primary font-semibold flex items-center gap-1 mt-1">
                                <ClipboardList className="h-3 w-3" />
                                Linking to: {initialData.title}
                            </p>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Activity Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground uppercase tracking-wider">What did you do today?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {activityTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = activityType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setActivityType(type.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:bg-muted/50'
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs font-medium text-center ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                            {type.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Hours Spent</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={hoursSpent}
                                    onChange={(e) => setHoursSpent(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {(activityType === 'door_knock' || activityType === 'phone_bank') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    {activityType === 'door_knock' ? 'Doors Knocked' : 'Calls Made'}
                                </label>
                                <div className="relative">
                                    {activityType === 'door_knock' ? (
                                        <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    )}
                                    <Input
                                        type="number"
                                        value={activityType === 'door_knock' ? doorsKnocked : callsMade}
                                        onChange={(e) => activityType === 'door_knock' ? setDoorsKnocked(e.target.value) : setCallsMade(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Notes/Details</label>
                        <Textarea
                            placeholder="What did you talk about? Any follow-ups needed?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none h-24"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-gradient-primary shadow-lg hover:translate-y-[-1px] transition-all"
                    >
                        {loading ? 'Recording...' : 'Record Activity'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
