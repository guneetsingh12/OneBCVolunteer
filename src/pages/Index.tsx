import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { VolunteerTable } from '@/components/volunteers/VolunteerTable';
import { EventsGrid } from '@/components/events/EventsGrid';
import { RidingMap } from '@/components/map/RidingMap';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { TabType } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleAddNew = () => {
    console.log('Add new:', activeTab);
    // TODO: Open modal for adding new volunteer/event
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
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
      case 'settings':
        return <SettingsView />;
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
    </div>
  );
};

export default Index;
