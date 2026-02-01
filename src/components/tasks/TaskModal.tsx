import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Target, Users, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Volunteer, Task } from '@/types';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    category: z.enum(['Phone Calls', 'Media', 'Event Logistics', 'Others']),
    region: z.string().optional(),
    total_target: z.number().min(0).optional(),
    due_date: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    task?: Task | null;
}

const categories = ['Phone Calls', 'Media', 'Event Logistics', 'Others'];

export function TaskModal({ isOpen, onClose, onSuccess, task }: TaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [regionalVolunteers, setRegionalVolunteers] = useState<Volunteer[]>([]);
    const [assignments, setAssignments] = useState<Record<string, { selected: boolean, target: number, completed_count?: number, status?: string, volunteer?: any }>>({});
    const [view, setView] = useState<'settings' | 'status'>('settings');
    const { toast } = useToast();

    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            category: 'Phone Calls',
            total_target: 0,
        }
    });

    useEffect(() => {
        if (task) {
            setValue('title', task.title);
            setValue('description', task.description || '');
            setValue('category', task.category);
            setValue('region', task.region || '');
            setValue('total_target', task.total_target || 0);
            setValue('due_date', task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '');

            // Fetch existing assignments if editing
            fetchExistingAssignments(task.id);
            setView('status'); // Default to status view when clicking an existing task
        } else {
            reset({
                category: 'Phone Calls',
                total_target: 0,
            });
            setAssignments({});
            setView('settings');
        }
    }, [task, setValue, reset]);

    const fetchExistingAssignments = async (taskId: string) => {
        const { data, error } = await supabase
            .from('task_assignments')
            .select('*, volunteer:volunteers(first_name, last_name, email)')
            .eq('task_id', taskId);

        if (!error && data) {
            const initialAssignments: Record<string, any> = {};
            data.forEach((a: any) => {
                initialAssignments[a.volunteer_id] = {
                    selected: true,
                    target: a.target || 0,
                    completed_count: a.completed_count || 0,
                    status: a.status || 'assigned',
                    volunteer: a.volunteer
                };
            });
            setAssignments(initialAssignments);
        }
    };

    const watchedRegion = watch('region');

    useEffect(() => {
        const fetchRegionalVolunteers = async () => {
            if (!watchedRegion || watchedRegion.trim().length < 2) {
                setRegionalVolunteers([]);
                return;
            }

            const { data, error } = await supabase
                .from('volunteers')
                .select('*')
                .ilike('region', `%${watchedRegion.trim()}%`);

            if (!error && data) {
                setRegionalVolunteers(data as unknown as Volunteer[]);
            }
        };

        const timer = setTimeout(fetchRegionalVolunteers, 500);
        return () => clearTimeout(timer);
    }, [watchedRegion]);

    const toggleVolunteer = (id: string) => {
        setAssignments(prev => ({
            ...prev,
            [id]: {
                selected: !prev[id]?.selected,
                target: prev[id]?.target || watch('total_target') || 0
            }
        }));
    };

    const updateVolunteerTarget = (id: string, target: number) => {
        setAssignments(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                target: target
            }
        }));
    };

    const onSubmit = async (data: TaskFormData) => {
        setLoading(true);
        try {
            const taskData = {
                title: data.title,
                description: data.description || '',
                category: data.category,
                region: data.region || '',
                total_target: data.total_target || 0,
                due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
                updated_at: new Date().toISOString(),
            };

            let taskId = task?.id;

            if (task) {
                const { error } = await supabase
                    .from('tasks')
                    .update(taskData)
                    .eq('id', task.id);
                if (error) throw error;
            } else {
                const { data: insertData, error } = await supabase
                    .from('tasks')
                    .insert({
                        ...taskData,
                        status: 'pending',
                        created_at: new Date().toISOString(),
                    })
                    .select()
                    .single();
                if (error) throw error;
                taskId = insertData.id;
            }

            // Handle assignments
            if (taskId) {
                // Determine which assignments to upsert (update or insert)
                const upsertAssignments = Object.entries(assignments)
                    .filter(([_, value]) => value.selected)
                    .map(([vId, value]) => ({
                        task_id: taskId,
                        volunteer_id: vId,
                        target: value.target, // Always update target to latest value
                        status: value.status || 'assigned',
                        // IMPORTANT: We do NOT overwrite completed_count here if it exists in DB, 
                        // but Supabase upsert will overwrite unless we handle conflict carefully.
                        // However, since we are doing a bulk upsert, we need to be careful.
                        // Better strategy: 
                        // 1. Fetch existing again (already done in assignments state? likely yes if editing)
                        // 2. We can trust 'assignments' state has preserving completed_count if we loaded it correctly.
                        // yes, fetchExistingAssignments loaded completed_count into state.
                        completed_count: value.completed_count || 0,
                        assigned_at: new Date().toISOString()
                    }));

                if (upsertAssignments.length > 0) {
                    const { error: upsertError } = await supabase
                        .from('task_assignments')
                        .upsert(upsertAssignments, { onConflict: 'task_id,volunteer_id' });

                    if (upsertError) throw upsertError;
                }

                // Identify removed volunteers to delete
                // We need to know who was assigned before. 
                // A simple way is to delete anyone for this task_id NOT in the current selection list.
                const currentVolunteerIds = upsertAssignments.map(a => a.volunteer_id);

                if (currentVolunteerIds.length > 0) {
                    await supabase
                        .from('task_assignments')
                        .delete()
                        .eq('task_id', taskId)
                        .not('volunteer_id', 'in', `(${currentVolunteerIds.join(',')})`);
                } else {
                    // If no one is selected, clear all assignments
                    await supabase
                        .from('task_assignments')
                        .delete()
                        .eq('task_id', taskId);
                }
            }

            toast({
                title: task ? "Task Updated" : "Task Created",
                description: `"${data.title}" has been ${task ? 'updated' : 'created'} successfully.`,
            });

            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Error saving task:', err);
            toast({
                title: "Error",
                description: err.message || "Failed to save task.",
                variant: "destructive"
            });
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold">{task ? 'Task Details' : 'Create New Task'}</h2>
                        {task && (
                            <div className="flex bg-muted rounded-lg p-1 scale-90 origin-left">
                                <button
                                    onClick={() => setView('status')}
                                    className={cn("px-3 py-1 rounded-md text-sm font-medium transition-all", view === 'status' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                                >
                                    Status
                                </button>
                                <button
                                    onClick={() => setView('settings')}
                                    className={cn("px-3 py-1 rounded-md text-sm font-medium transition-all", view === 'settings' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                                >
                                    Settings
                                </button>
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {view === 'settings' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Task Title *</label>
                                        <Input {...register('title')} placeholder="e.g., Phone bank for Vancouver-Kingsway" />
                                        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Category *</label>
                                        <select {...register('category')} className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Description</label>
                                        <Textarea {...register('description')} rows={3} placeholder="Describe the task..." />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <Target className="inline h-4 w-4 mr-1" /> Region
                                        </label>
                                        <Input {...register('region')} placeholder="e.g., Metro Vancouver" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Global Target</label>
                                        <Input type="number" {...register('total_target', { valueAsNumber: true })} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <Calendar className="inline h-4 w-4 mr-1" /> Due Date
                                        </label>
                                        <Input type="datetime-local" {...register('due_date')} />
                                    </div>
                                </div>
                            </div>

                            {/* Volunteer Assignment Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Assign Volunteers {watchedRegion ? `in ${watchedRegion}` : ''}
                                </h3>

                                {regionalVolunteers.length > 0 ? (
                                    <div className="border border-border rounded-xl divide-y divide-border max-h-60 overflow-y-auto">
                                        {regionalVolunteers.map(volunteer => (
                                            <div key={volunteer.id} className="flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={!!assignments[volunteer.id]?.selected}
                                                    onChange={() => toggleVolunteer(volunteer.id)}
                                                    className="h-4 w-4 rounded border-input"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{volunteer.first_name} {volunteer.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{volunteer.email}</p>
                                                </div>
                                                {assignments[volunteer.id]?.selected && (
                                                    <div className="w-24">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Target</label>
                                                        <Input
                                                            type="number"
                                                            size={1}
                                                            className="h-8 text-sm"
                                                            value={assignments[volunteer.id]?.target || 0}
                                                            onChange={(e) => updateVolunteerTarget(volunteer.id, parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : watchedRegion ? (
                                    <p className="text-sm text-muted-foreground italic">No volunteers found in this region.</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Enter a region to see available volunteers.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-primary/5 rounded-xl p-4 text-center">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Volunteers</p>
                                    <p className="text-2xl font-bold text-foreground">{Object.keys(assignments).length}</p>
                                </div>
                                <div className="bg-success/5 rounded-xl p-4 text-center">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Progress</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {Object.values(assignments).reduce((sum, a) => sum + (a.completed_count || 0), 0)}
                                    </p>
                                </div>
                                <div className="bg-secondary/5 rounded-xl p-4 text-center">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Overall Goal</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {Object.values(assignments).reduce((sum, a) => sum + (a.target || 0), 0) || task?.total_target || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Volunteer Progress Breakdown
                                </h3>
                                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                                    {Object.entries(assignments).map(([id, data]) => (
                                        <div key={id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div className="flex-1">
                                                <p className="font-semibold text-foreground">{data.volunteer?.first_name} {data.volunteer?.last_name}</p>
                                                <p className="text-xs text-muted-foreground">{data.volunteer?.email}</p>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-foreground">
                                                            {data.completed_count} / {data.target || task?.total_target || 0}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Target</span>
                                                    </div>
                                                    <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all"
                                                            style={{ width: `${Math.min(((data.completed_count || 0) / (data.target || 1)) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="capitalize">{data.status?.replace('_', ' ')}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(assignments).length === 0 && (
                                        <p className="p-8 text-center text-muted-foreground italic">No volunteers assigned to this task yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-gradient-primary" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (task ? 'Update Task' : 'Create Task')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
