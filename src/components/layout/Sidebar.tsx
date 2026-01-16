import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Map, 
  CalendarDays, 
  BarChart3, 
  Settings,
  LogOut,
  Vote,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TabType } from '@/types';
import { useState } from 'react';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const navItems = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'volunteers' as TabType, label: 'Volunteers', icon: Users },
  { id: 'events' as TabType, label: 'Events', icon: Calendar },
  { id: 'map' as TabType, label: 'Riding Map', icon: Map },
  { id: 'calendar' as TabType, label: 'Calendar', icon: CalendarDays },
  { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
  { id: 'settings' as TabType, label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Vote className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-sidebar-foreground font-display">EngageBC</h1>
            <p className="text-xs text-sidebar-foreground/60">Political Operations</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "nav-link w-full",
                isActive && "nav-link-active"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shadow-lg hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* User Section */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-medium">
            DR
          </div>
          {!collapsed && (
            <div className="flex-1 animate-fade-in">
              <p className="text-sm font-medium text-sidebar-foreground">Director</p>
              <p className="text-xs text-sidebar-foreground/60">Operations Lead</p>
            </div>
          )}
          {!collapsed && (
            <button className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
