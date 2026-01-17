import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload,
  MoreHorizontal, 
  Mail, 
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockVolunteers } from '@/data/mockData';
import { Volunteer } from '@/types';
import { cn } from '@/lib/utils';
import { VolunteerModal } from './VolunteerModal';
import { VolunteerProfileModal } from './VolunteerProfileModal';
import { CSVImportModal } from './CSVImportModal';

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border', icon: Clock },
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20', icon: AlertCircle },
  on_leave: { label: 'On Leave', className: 'bg-info/10 text-info border-info/20', icon: Clock },
};

const experienceConfig = {
  new: { label: 'New', className: 'bg-info/10 text-info' },
  some: { label: 'Some Experience', className: 'bg-muted text-muted-foreground' },
  experienced: { label: 'Experienced', className: 'bg-success/10 text-success' },
  veteran: { label: 'Veteran', className: 'bg-primary/10 text-primary' },
};

export function VolunteerTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const filteredVolunteers = mockVolunteers.filter((v) => {
    const matchesSearch = 
      v.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.riding.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || v.status === selectedStatus;
    const matchesRegion = selectedRegion === 'all' || v.region === selectedRegion;
    
    return matchesSearch && matchesStatus && matchesRegion;
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

  const openProfile = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsProfileModalOpen(true);
    setActionMenuId(null);
  };

  const openEdit = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsAddModalOpen(true);
    setActionMenuId(null);
  };

  const regions = [...new Set(mockVolunteers.map(v => v.region))];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
          
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-4 pr-10 rounded-lg border border-input bg-card text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="h-10 px-4 pr-10 rounded-lg border border-input bg-card text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {selectedVolunteers.length > 0 && (
            <span className="text-sm text-muted-foreground px-2">
              {selectedVolunteers.length} selected
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-gradient-primary"
            onClick={() => {
              setSelectedVolunteer(null);
              setIsAddModalOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Volunteer</span>
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">{mockVolunteers.length}</p>
        </div>
        <div className="bg-success/5 rounded-lg p-4 border border-success/20">
          <p className="text-sm text-success">Active</p>
          <p className="text-2xl font-bold text-success">{mockVolunteers.filter(v => v.status === 'active').length}</p>
        </div>
        <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
          <p className="text-sm text-warning">Pending Review</p>
          <p className="text-2xl font-bold text-warning">{mockVolunteers.filter(v => v.status === 'pending').length}</p>
        </div>
        <div className="bg-info/5 rounded-lg p-4 border border-info/20">
          <p className="text-sm text-info">Needs Verification</p>
          <p className="text-2xl font-bold text-info">{mockVolunteers.filter(v => !v.riding_confirmed).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
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
                  className="hover:bg-muted/30 transition-colors group"
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
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => openProfile(volunteer)}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        {volunteer.first_name[0]}{volunteer.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
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
                        <span className="truncate max-w-[180px]">{volunteer.email}</span>
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
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge 
                      variant="outline" 
                      className={cn("gap-1", statusConfig[volunteer.status].className)}
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
                      <p className="text-muted-foreground">{volunteer.total_doors_or_dials.toLocaleString()} contacts</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setActionMenuId(actionMenuId === volunteer.id ? null : volunteer.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      
                      {actionMenuId === volunteer.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-lg shadow-xl border border-border py-1 z-50 animate-scale-in">
                          <button
                            onClick={() => openProfile(volunteer)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View Profile
                          </button>
                          <button
                            onClick={() => openEdit(volunteer)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
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
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VolunteerModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedVolunteer(null);
        }}
        volunteer={selectedVolunteer}
      />
      
      <VolunteerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedVolunteer(null);
        }}
        volunteer={selectedVolunteer}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}