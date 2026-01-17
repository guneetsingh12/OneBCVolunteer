import { 
  Activity, 
  User, 
  Calendar, 
  Users, 
  Upload, 
  Download, 
  LogIn, 
  LogOut,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';
import { mockActivityLog } from '@/data/mockData';
import { ActivityLog } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const actionConfig = {
  create: { icon: Plus, className: 'bg-success/10 text-success' },
  update: { icon: Edit2, className: 'bg-info/10 text-info' },
  delete: { icon: Trash2, className: 'bg-destructive/10 text-destructive' },
  import: { icon: Upload, className: 'bg-primary/10 text-primary' },
  export: { icon: Download, className: 'bg-secondary/10 text-secondary' },
  login: { icon: LogIn, className: 'bg-success/10 text-success' },
  logout: { icon: LogOut, className: 'bg-muted text-muted-foreground' },
};

export function ActivityLogView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {mockActivityLog.map((log) => {
            const config = actionConfig[log.action];
            const Icon = config.icon;
            
            return (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={cn("p-2 rounded-lg shrink-0", config.className)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{log.user_name}</span>
                    {' '}{log.action === 'create' && 'created'}
                    {log.action === 'update' && 'updated'}
                    {log.action === 'delete' && 'deleted'}
                    {log.action === 'import' && 'imported'}
                    {log.action === 'export' && 'exported'}{' '}
                    <span className="font-medium">{log.entity_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}