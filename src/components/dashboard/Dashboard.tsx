import { Users, Calendar, Clock, DoorOpen, Phone, UserPlus } from 'lucide-react';
import { StatCard } from './StatCard';
import { EngagementChart } from './EngagementChart';
import { RegionBreakdown } from './RegionBreakdown';
import { RecentActivity } from './RecentActivity';
import { RidingPerformance } from './RidingPerformance';
import { mockDashboardStats } from '@/data/mockData';

export function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Volunteers"
          value={mockDashboardStats.total_volunteers}
          change={{ value: 12, label: 'vs last month' }}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Active Volunteers"
          value={mockDashboardStats.active_volunteers}
          change={{ value: 8, label: 'vs last month' }}
          icon={Users}
        />
        <StatCard
          title="Upcoming Events"
          value={mockDashboardStats.upcoming_events}
          icon={Calendar}
          variant="secondary"
        />
        <StatCard
          title="Total Hours"
          value={mockDashboardStats.total_hours}
          change={{ value: 15, label: 'vs last month' }}
          icon={Clock}
        />
        <StatCard
          title="Doors Knocked"
          value={mockDashboardStats.total_doors}
          change={{ value: 22, label: 'vs last month' }}
          icon={DoorOpen}
          variant="accent"
        />
        <StatCard
          title="Calls Made"
          value={mockDashboardStats.total_calls}
          change={{ value: 18, label: 'vs last month' }}
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
        <RecentActivity />
      </div>
    </div>
  );
}
