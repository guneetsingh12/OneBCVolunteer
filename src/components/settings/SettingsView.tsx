import { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Upload, 
  Download,
  Key,
  Globe,
  Mail,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'data' | 'integrations';

const settingsTabs = [
  { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
  { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
  { id: 'security' as SettingsTab, label: 'Security & Access', icon: Shield },
  { id: 'data' as SettingsTab, label: 'Data Management', icon: Database },
  { id: 'integrations' as SettingsTab, label: 'Integrations', icon: Globe },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="stat-card p-2">
          <nav className="space-y-1">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="lg:col-span-3 space-y-6">
        {activeTab === 'profile' && (
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground font-display mb-6">Profile Settings</h3>
            
            <div className="flex items-start gap-6 mb-8">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                DR
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">Profile Photo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a photo to personalize your account
                </p>
                <Button variant="outline" size="sm">
                  Upload Photo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <Input defaultValue="Director Operations" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <Input defaultValue="director@engagebc.ca" type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <Input defaultValue="604-555-0100" type="tel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                <Input defaultValue="Director" disabled />
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-border">
              <Button variant="accent">Save Changes</Button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground font-display mb-6">Notification Preferences</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Summary of weekly activity</p>
                  </div>
                </div>
                <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground font-display mb-6">Data Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-border">
                <Upload className="h-8 w-8 text-primary mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Import Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload CSV files to import volunteers, events, or other data
                </p>
                <Button variant="outline" className="w-full">
                  Upload CSV
                </Button>
              </div>

              <div className="p-6 rounded-xl border border-border">
                <Download className="h-8 w-8 text-secondary mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Export Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download your data in various formats for analysis
                </p>
                <Button variant="outline" className="w-full">
                  Export All Data
                </Button>
              </div>
            </div>

            <div className="mt-6 p-6 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-6 w-6 text-info" />
                <h4 className="font-semibold text-foreground">Google Sheets Integration</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect to Google Sheets for live data synchronization
              </p>
              <Button variant="secondary">
                Connect Google Sheets
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground font-display mb-6">Security & Access</h3>
            
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Key className="h-6 w-6 text-primary" />
                  <h4 className="font-semibold text-foreground">Change Password</h4>
                </div>
                <div className="space-y-4">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                  <Input type="password" placeholder="Confirm new password" />
                </div>
                <Button className="mt-4">Update Password</Button>
              </div>

              <div className="p-6 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6 text-secondary" />
                  <h4 className="font-semibold text-foreground">Two-Factor Authentication</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground font-display mb-6">External Integrations</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Globe className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Elections BC API</p>
                    <p className="text-sm text-muted-foreground">Riding lookup and verification</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Database className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">BC Assessment</p>
                    <p className="text-sm text-muted-foreground">Property intelligence data</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email Service</p>
                    <p className="text-sm text-muted-foreground">Campaign email integration</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
