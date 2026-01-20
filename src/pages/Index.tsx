import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { VolunteerDashboard } from '@/components/dashboard/VolunteerDashboard';
import { VolunteerTable } from '@/components/volunteers/VolunteerTable';
import { EventsGrid } from '@/components/events/EventsGrid';
import { RidingMap } from '@/components/map/RidingMap';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ActivityLogView } from '@/components/activity/ActivityLogView';
import { PersonalActivities } from '@/components/activity/PersonalActivities';
import { LogActivityModal } from '@/components/activity/LogActivityModal';
import RoleApprovals from './RoleApprovals';
import { TabType } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const { isVolunteer, volunteerData } = useUser();
  const { toast } = useToast();

  const handleAddNew = () => {
    if (isVolunteer) {
      setIsLogModalOpen(true);
    } else {
      console.log('Add new (Director):', activeTab);
      // Director level add new logic would go here
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isVolunteer ? <VolunteerDashboard /> : <Dashboard />;
      case 'my-activities':
        return isVolunteer ? <PersonalActivities /> : <ActivityLogView />;
      case 'volunteers':
        return <VolunteerTable />;
      case 'events':
        return <EventsGrid />;
      case 'map':
        return <RidingMap />;
      case 'calendar':
        return <CalendarView />;
      case 'reports':
        return <ReportsView />;
      case 'activity':
        return <ActivityLogView />;
      case 'settings':
        return <SettingsView />;
      case 'approvals':
        return <RoleApprovals />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="pl-20 lg:pl-64 transition-all duration-300">
        <Header activeTab={activeTab} onAddNew={handleAddNew} />

        <main className="p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>

      <LogActivityModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Index;
