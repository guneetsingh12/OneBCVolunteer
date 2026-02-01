import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DoorOpen,
  Car,
  Languages,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Edit2,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volunteer } from '@/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VolunteerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer: Volunteer | null;
}

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border', icon: Clock },
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
  on_leave: { label: 'On Leave', className: 'bg-info/10 text-info border-info/20', icon: Clock },
};

export function VolunteerProfileModal({ isOpen, onClose, volunteer }: VolunteerProfileModalProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    if (isOpen && volunteer?.id) {
      fetchTasks();
    }
  }, [isOpen, volunteer?.id]);

  const fetchTasks = async () => {
    if (!volunteer?.id) return;
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`
        id,
        target,
        completed_count,
        status,
        task:tasks (
          title,
          category,
          due_date
        )
      `)
      .eq('volunteer_id', volunteer.id);

    if (!error && data) {
      setTasks(data);
    }
    setLoadingTasks(false);
  };

  if (!isOpen || !volunteer) return null;

  /* Safe status config lookup */
  const statusKey = (volunteer.status || 'active').toLowerCase();
  const config = statusConfig[statusKey as keyof typeof statusConfig] || statusConfig.active;
  const StatusIcon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
        {/* Header with gradient */}
        <div className="relative h-32 bg-gradient-hero rounded-t-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-accent flex items-center justify-center text-accent-foreground text-2xl font-bold shadow-lg border-4 border-card">
              {volunteer.first_name[0]}{volunteer.last_name[0]}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 px-6 pb-6">
          {/* Name & Status */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {volunteer.first_name} {volunteer.last_name}
              </h2>
              <p className="text-muted-foreground">{volunteer.riding}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("gap-1", config.className)}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-6">
            <Button variant="outline" size="sm" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Text
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{volunteer.total_hours}</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
            <div className="bg-secondary/5 rounded-xl p-4 text-center">
              <Calendar className="h-5 w-5 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{volunteer.total_shifts}</p>
              <p className="text-xs text-muted-foreground">Shifts</p>
            </div>
            <div className="bg-accent/5 rounded-xl p-4 text-center">
              <DoorOpen className="h-5 w-5 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{volunteer.total_doors_or_dials.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact Info</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{volunteer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{volunteer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{volunteer.city}, {volunteer.postal_code}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Availability</h4>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {(volunteer.availability_days || []).map(day => (
                      <span key={day} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(volunteer.availability_times || []).map(time => (
                      <span key={time} className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded-full">
                        {time}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {volunteer.hours_per_week || 0} hours/week
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Tasks Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Assigned Tasks
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tasks.length > 0 ? tasks.map(assignment => (
                  <div key={assignment.id} className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground line-clamp-1">{assignment.task?.title}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">{assignment.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-semibold">
                      <span>{assignment.task?.category}</span>
                      <span>{assignment.completed_count} / {assignment.target}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((assignment.completed_count / (assignment.target || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic col-span-2">No tasks assigned yet.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Skills & Interests</h4>
                <div className="flex flex-wrap gap-1">
                  {(volunteer.role_interest || []).map(role => (
                    <span key={role} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-lg">
                      {role}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{(volunteer.languages || []).join(', ')}</span>
                </div>
                {volunteer.has_vehicle && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <Car className="h-4 w-4" />
                    <span>Has vehicle access</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Activity</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Joined: <span className="text-foreground">{new Date(volunteer.date_signed_up).toLocaleDateString()}</span>
                  </p>
                  {volunteer.last_active_date && (
                    <p className="text-muted-foreground">
                      Last Active: <span className="text-foreground">{new Date(volunteer.last_active_date).toLocaleDateString()}</span>
                    </p>
                  )}
                  {volunteer.last_contacted_date && (
                    <p className="text-muted-foreground">
                      Last Contacted: <span className="text-foreground">{new Date(volunteer.last_contacted_date).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes - Always render */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Notes</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {volunteer.notes || "No notes provided."}
              </p>
            </div>

            {/* Risk Flags */}
            {(volunteer.risk_flags || []).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Flags</h4>
                <div className="flex flex-wrap gap-2">
                  {(volunteer.risk_flags || []).map(flag => (
                    <Badge key={flag} variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {flag.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Riding Verification */}
            {!volunteer.riding_confirmed && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning">Riding Needs Verification</p>
                  <p className="text-xs text-warning/80">
                    The electoral riding for this volunteer could not be confidently determined from their postal code.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                  Verify
                </Button>
              </div>
            )}

            {/* Property Intelligence - Always render */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Property Intelligence</h4>
              <div className="flex gap-4 text-sm">
                <div className="px-3 py-2 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Est. Value Range</p>
                  <p className="font-medium text-foreground">{volunteer.property_value || "N/A"}</p>
                </div>
                <div className="px-3 py-2 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Housing Type</p>
                  <p className="font-medium text-foreground capitalize">{volunteer.housing_type || "Unknown"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                * Property data is for strategic planning purposes only. Source: BC Assessment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}