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
  ChevronRight,
  Activity,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TabType } from '@/types';
import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isVolunteer } = useUser();

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'volunteers' as TabType, label: 'Volunteers', icon: Users, hidden: isVolunteer },
    { id: 'my-activities' as TabType, label: 'My Activities', icon: ClipboardList, show: isVolunteer },
    { id: 'events' as TabType, label: 'Events', icon: Calendar },
    { id: 'map' as TabType, label: 'Riding Map', icon: Map, hidden: isVolunteer },
    { id: 'calendar' as TabType, label: 'Calendar', icon: CalendarDays },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3, hidden: isVolunteer },
    { id: 'activity' as TabType, label: 'Activity Log', icon: Activity, hidden: isVolunteer },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ].filter(item => {
    if (item.hidden) return false;
    if (item.show !== undefined) return item.show;
    return true;
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-accent shadow-accent">
          <Vote className="h-5 w-5 text-sidebar-primary-foreground" />
          <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-sidebar-primary animate-pulse-slow" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-sidebar-foreground">BC Connect</h1>
            <p className="text-xs text-sidebar-foreground/50">Political Operations</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "nav-link w-full group relative",
                isActive && "nav-link-active"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0 transition-transform",
                isActive && "scale-110"
              )} />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-accent text-sidebar-primary-foreground shadow-lg hover:scale-110 transition-all duration-200 z-50"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* User Section */}
      <div className="border-t border-sidebar-border px-3 py-4">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {user?.name?.[0].toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-sidebar" />
          </div>
          {!collapsed && (
            <div className="flex-1 animate-fade-in min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate capitalize">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}