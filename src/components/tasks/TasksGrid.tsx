import { useState, useEffect } from 'react';
import {
    Search,
    ClipboardList,
    Target,
    Users,
    Clock,
    MoreHorizontal,
    Phone,
    Share2,
    Truck,
    Loader2,
    Plus,
    Trash2,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { TaskModal } from './TaskModal';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

const taskCategoryConfig: any = {
    'Phone Calls': { icon: Phone, color: 'bg-info/10 text-info' },
    'Media': { icon: Share2, color: 'bg-primary/10 text-primary' },
    'Event Logistics': { icon: Truck, color: 'bg-accent/10 text-accent' },
    'Others': { icon: ClipboardList, color: 'bg-muted text-muted-foreground' },
};

const statusConfig: any = {
    pending: { label: 'Pending', className: 'bg-info/10 text-info border-info/20' },
    in_progress: { label: 'In Progress', className: 'bg-warning/10 text-warning border-warning/20' },
    completed: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
};

export function TasksGrid() {
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const { isDirector } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
          *,
          task_assignments (
            completed_count,
            target,
            status
          )
        `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching tasks:', error);
            } else {
                const formattedTasks = (data || []).map((task: any) => {
                    const assignments = task.task_assignments || [];
                    const current_progress = assignments.reduce((sum: number, a: any) => sum + (a.completed_count || 0), 0);
                    const total_target_calc = assignments.reduce((sum: number, a: any) => sum + (a.target || 0), 0);
                    const final_target = task.total_target || total_target_calc || 0;

                    let calculatedStatus = task.status;

                    // 1. Auto-detect 'in_progress' if work has started
                    if (calculatedStatus === 'pending') {
                        const hasProgress = current_progress > 0;
                        const hasActiveAssignments = assignments.some((a: any) => a.status === 'in_progress' || a.status === 'completed');

                        // If any progress made OR any volunteer is active -> In Progress
                        if (hasProgress || hasActiveAssignments) {
                            calculatedStatus = 'in_progress';
                        }
                    }

                    // 2. Auto-detect 'completed' if target reached
                    if (calculatedStatus !== 'completed' && final_target > 0 && current_progress >= final_target) {
                        calculatedStatus = 'completed';
                    }

                    return {
                        ...task,
                        status: calculatedStatus, // Use the dynamic status
                        current_progress,
                        total_target: final_target,
                        volunteer_count: assignments.length
                    };
                });
                setTasks(formattedTasks as any);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
        setLoading(false);
    };

    const handleDeleteTask = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to delete the task "${title}"?`)) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Task deleted",
                description: `"${title}" has been successfully removed.`,
            });
            fetchTasks();
        } catch (err: any) {
            console.error('Error deleting task:', err);
            toast({
                title: "Delete failed",
                description: err.message,
                variant: "destructive"
            });
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = filter === 'all' || task.status === filter;
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.region || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleCreateTask = () => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading tasks...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Scorecard (Director Only) */}
            {isDirector && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="stat-card p-4 bg-muted/20">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Tasks</p>
                        <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
                    </div>
                    <div className="stat-card p-4 bg-info/10 border-info/20">
                        <p className="text-xs font-semibold text-info uppercase tracking-wider mb-1">Pending</p>
                        <p className="text-2xl font-bold text-info">{tasks.filter(t => t.status === 'pending').length}</p>
                    </div>
                    <div className="stat-card p-4 bg-warning/10 border-warning/20">
                        <p className="text-xs font-semibold text-warning uppercase tracking-wider mb-1">In Progress</p>
                        <p className="text-2xl font-bold text-warning">{tasks.filter(t => t.status === 'in_progress').length}</p>
                    </div>
                    <div className="stat-card p-4 bg-success/10 border-success/20">
                        <p className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Completed</p>
                        <p className="text-2xl font-bold text-success">{tasks.filter(t => t.status === 'completed').length}</p>
                    </div>
                </div>
            )}

            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                        {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status as typeof filter)}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                    filter === status
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {status === 'all' ? 'All Tasks' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-card border-border/50 focus-visible:ring-1"
                        />
                    </div>
                </div>

                {isDirector && (
                    <Button
                        onClick={handleCreateTask}
                        className="bg-gradient-primary gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Task
                    </Button>
                )}
            </div>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTasks.map((task, index) => {
                    const config = taskCategoryConfig[task.category] || taskCategoryConfig['Others'];
                    const Icon = config.icon;
                    const progressPercentage = task.total_target > 0
                        ? Math.min((task.current_progress / task.total_target) * 100, 100)
                        : 0;

                    return (
                        <div
                            key={task.id}
                            className={cn(
                                "stat-card group animate-slide-up hover:border-primary/50 transition-all",
                                isDirector ? "cursor-pointer" : "cursor-default"
                            )}
                            style={{ animationDelay: `${index * 0.1}s` }}
                            onClick={() => isDirector && handleEditTask(task)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("p-3 rounded-xl", config.color)}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={statusConfig[task.status]?.className || ''}>
                                        {statusConfig[task.status]?.label || task.status}
                                    </Badge>
                                    {isDirector && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTask(task.id, task.title);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Title & Category */}
                            <div className="mb-2">
                                <h3 className="font-semibold text-foreground font-display text-lg line-clamp-1">
                                    {task.title}
                                </h3>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {task.category}
                                </p>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {task.description}
                            </p>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                                {task.due_date && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                                    </div>
                                )}
                                {task.region && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Target className="h-4 w-4" />
                                        <span>{task.region}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>{(task as any).volunteer_count || 0} volunteers assigned</span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Progress</span>
                                    <span className="text-sm font-medium text-foreground">
                                        {task.current_progress || 0} / {task.total_target || 0}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            progressPercentage >= 100 ? "bg-success" : "bg-primary"
                                        )}
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
                    <p className="text-muted-foreground mb-4">
                        {tasks.length === 0
                            ? "Get started by creating your first task."
                            : "Try adjusting your filters or create a new task."}
                    </p>
                    {isDirector && (
                        <Button onClick={handleCreateTask} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Task
                        </Button>
                    )}
                </div>
            )}

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTask(null);
                }}
                onSuccess={fetchTasks}
                task={selectedTask}
            />
        </div>
    );
}
