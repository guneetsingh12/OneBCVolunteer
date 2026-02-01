import { Users, Calendar, Clock, DoorOpen, Phone, TrendingUp, Loader2 } from 'lucide-react';
import { StatCard } from './StatCard';
import { EngagementChart } from './EngagementChart';
import { RegionBreakdown } from './RegionBreakdown';
import { RidingPerformance } from './RidingPerformance';
import { RecentActivity } from './RecentActivity';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList } from 'lucide-react';
import { TabType } from '@/types';

interface DashboardProps {
  onNavigate?: (tab: TabType) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { stats, recentVolunteers, upcomingEvents, recentActivities, loading, error } = useDashboardData();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, task_assignments(completed_count, target)')
      .limit(4)
      .order('created_at', { ascending: false });

    if (data) setTasks(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Volunteers"
          value={stats.total_volunteers}
          change={{ value: stats.volunteers_this_month, label: 'this month' }}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Active Volunteers"
          value={stats.active_volunteers}
          change={{ value: stats.engagement_rate, label: '% active' }}
          icon={Users}
        />
        <StatCard
          title="Upcoming Events"
          value={stats.upcoming_events}
          icon={Calendar}
          variant="secondary"
        />
        <StatCard
          title="Total Hours"
          value={stats.total_hours}
          icon={Clock}
        />
        <StatCard
          title="Doors Knocked"
          value={stats.total_doors}
          icon={DoorOpen}
          variant="accent"
        />
        <StatCard
          title="Calls Made"
          value={stats.total_calls}
          icon={Phone}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EngagementChart />
        </div>
        <RegionBreakdown />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RidingPerformance />
        <RecentActivity
          recentVolunteers={recentVolunteers}
          upcomingEvents={upcomingEvents}
          recentActivities={recentActivities}
        />
      </div>

      {/* Campaign Tasks Status (Requested) */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2 font-display">
            <ClipboardList className="h-6 w-6 text-primary" />
            Active Campaign Tasks Status
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tasks.map(task => {
            const totalProgress = task.task_assignments?.reduce((sum: number, a: any) => sum + (a.completed_count || 0), 0) || 0;
            const totalTarget = task.total_target || task.task_assignments?.reduce((sum: number, a: any) => sum + (a.target || 1), 0) || 1;
            const percentage = Math.min((totalProgress / totalTarget) * 100, 100);

            return (
              <div
                key={task.id}
                className="p-4 bg-muted/20 border border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => onNavigate?.('tasks')}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-foreground line-clamp-1">{task.title}</h4>
                  <Badge variant="outline" className="text-[10px] uppercase">{task.category}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Overall Goal</span>
                    <span>{totalProgress} / {totalTarget}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase pt-1">
                    <span>{task.task_assignments?.length || 0} Volunteers Assigned</span>
                    <span className={percentage >= 100 ? "text-success" : ""}>{Math.round(percentage)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">No tasks created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
