import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabType } from '@/types';

interface HeaderProps {
  activeTab: TabType;
  onAddNew: () => void;
}

const tabTitles: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your impact' },
  volunteers: { title: 'Volunteers', subtitle: 'Manage your volunteer network' },
  events: { title: 'Events', subtitle: 'Campaign activities and engagements' },
  map: { title: 'Riding Map', subtitle: 'Geographic view of electoral districts' },
  calendar: { title: 'Calendar', subtitle: 'Schedule and upcoming activities' },
  reports: { title: 'Reports', subtitle: 'Analytics and insights' },
  settings: { title: 'Settings', subtitle: 'Configure your platform' },
  activity: { title: 'Activity Log', subtitle: 'System-wide audit trail' },
  'my-activities': { title: 'My Activities', subtitle: 'View and track your contributions' },
  approvals: { title: 'Role Requests', subtitle: 'Manage pending access requests' },
};

const addButtonLabels: Partial<Record<TabType, string>> = {
  volunteers: 'Add Volunteer',
  events: 'Create Event',
  dashboard: 'Log Activity',
  'my-activities': 'Log Activity',
};

import { useUser } from '@/contexts/UserContext';

export function Header({ activeTab, onAddNew }: HeaderProps) {
  const { title, subtitle } = tabTitles[activeTab] || { title: activeTab, subtitle: '' };
  const { isVolunteer } = useUser();

  let addLabel = addButtonLabels[activeTab];

  // Volunteers should see 'Log Activity' on dashboard
  if (activeTab === 'dashboard' && !isVolunteer) {
    addLabel = undefined;
  }

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-64 pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </button>

          {/* Add New Button */}
          {addLabel && (
            <Button onClick={onAddNew} variant="accent" className="gap-2">
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
