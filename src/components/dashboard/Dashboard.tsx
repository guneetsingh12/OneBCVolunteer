import { Users, Calendar, Clock, DoorOpen, Phone, TrendingUp, Loader2 } from 'lucide-react';
import { StatCard } from './StatCard';
import { EngagementChart } from './EngagementChart';
import { RegionBreakdown } from './RegionBreakdown';
import { RidingPerformance } from './RidingPerformance';
import { RecentActivity } from './RecentActivity';
import { useDashboardData } from '@/hooks/useDashboardData';

export function Dashboard() {
  const { stats, recentVolunteers, upcomingEvents, recentActivities, loading, error } = useDashboardData();

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
    </div>
  );
}
