import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Mail, 
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockVolunteers } from '@/data/mockData';
import { Volunteer } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border' },
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  on_leave: { label: 'On Leave', className: 'bg-info/10 text-info border-info/20' },
};

const experienceConfig = {
  new: { label: 'New', className: 'bg-info/10 text-info' },
  some: { label: 'Some', className: 'bg-muted text-muted-foreground' },
  experienced: { label: 'Experienced', className: 'bg-success/10 text-success' },
  veteran: { label: 'Veteran', className: 'bg-primary/10 text-primary' },
};

export function VolunteerTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);

  const filteredVolunteers = mockVolunteers.filter((v) => {
    const matchesSearch = 
      v.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.riding.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || v.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedVolunteers.length === filteredVolunteers.length) {
      setSelectedVolunteers([]);
    } else {
      setSelectedVolunteers(filteredVolunteers.map(v => v.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedVolunteers(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-4 pr-10 rounded-lg border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedVolunteers.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedVolunteers.length} selected
            </span>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedVolunteers.length === filteredVolunteers.length && filteredVolunteers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-input"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Volunteer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Riding
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVolunteers.map((volunteer) => (
                <tr 
                  key={volunteer.id} 
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedVolunteers.includes(volunteer.id)}
                      onChange={() => toggleSelect(volunteer.id)}
                      className="rounded border-input"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {volunteer.first_name[0]}{volunteer.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {volunteer.first_name} {volunteer.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(volunteer.date_signed_up).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {volunteer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {volunteer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{volunteer.riding}</p>
                        <p className="text-xs text-muted-foreground">{volunteer.city}</p>
                      </div>
                      {!volunteer.riding_confirmed && (
                        <AlertCircle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge 
                      variant="outline" 
                      className={statusConfig[volunteer.status].className}
                    >
                      {statusConfig[volunteer.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      experienceConfig[volunteer.experience_level].className
                    )}>
                      {experienceConfig[volunteer.experience_level].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{volunteer.total_hours}h / {volunteer.total_shifts} shifts</p>
                      <p className="text-muted-foreground">{volunteer.total_doors_or_dials} contacts</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Showing {filteredVolunteers.length} of {mockVolunteers.length} volunteers
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
