import { useState } from 'react';
import { MapPin, Users, TrendingUp, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { mockRidings } from '@/data/mockData';
import { Riding } from '@/types';
import { cn } from '@/lib/utils';

export function RidingMap() {
  const [selectedRiding, setSelectedRiding] = useState<Riding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRidings = mockRidings.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-accent';
    if (score >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2 stat-card min-h-[500px] relative overflow-hidden">
          {/* BC Map Placeholder - In production, integrate with Mapbox or Google Maps */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5">
            <svg viewBox="0 0 800 600" className="w-full h-full opacity-20">
              {/* Simplified BC outline */}
              <path
                d="M100,50 L200,30 L350,50 L450,100 L550,80 L650,120 L750,100 L780,200 L750,350 L700,450 L600,500 L450,520 L300,500 L150,450 L80,350 L50,200 Z"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Riding Dots */}
          <div className="absolute inset-0 p-8">
            {mockRidings.map((riding, index) => {
              // Position dots in a realistic pattern for BC regions
              const positions = [
                { top: '65%', left: '25%' },  // Vancouver
                { top: '60%', left: '30%' },  // Burnaby
                { top: '75%', left: '15%' },  // Victoria
                { top: '55%', left: '35%' },  // Surrey
                { top: '50%', left: '28%' },  // Richmond
                { top: '40%', left: '55%' },  // Kelowna
                { top: '25%', left: '45%' },  // Prince George
                { top: '70%', left: '20%' },  // Nanaimo
              ];
              
              const pos = positions[index] || { top: '50%', left: '50%' };

              return (
                <button
                  key={riding.id}
                  onClick={() => setSelectedRiding(riding)}
                  className={cn(
                    "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
                    "hover:scale-150 focus:scale-150 focus:outline-none",
                    selectedRiding?.id === riding.id && "scale-150"
                  )}
                  style={{ top: pos.top, left: pos.left }}
                >
                  <div className={cn(
                    "h-4 w-4 rounded-full shadow-lg animate-pulse",
                    getEngagementColor(riding.engagement_score)
                  )} />
                  {(selectedRiding?.id === riding.id) && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card px-2 py-1 rounded-md shadow-lg text-xs font-medium text-foreground border border-border">
                      {riding.name}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Engagement Score</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">80+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <span className="text-xs text-muted-foreground">60-79</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-warning" />
                <span className="text-xs text-muted-foreground">40-59</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span className="text-xs text-muted-foreground">&lt;40</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ridings List */}
        <div className="stat-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground font-display mb-1">Electoral Ridings</h3>
            <p className="text-sm text-muted-foreground">Select a riding for details</p>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ridings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {filteredRidings.map((riding) => (
              <button
                key={riding.id}
                onClick={() => setSelectedRiding(riding)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all",
                  selectedRiding?.id === riding.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted text-foreground"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{riding.name}</span>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    selectedRiding?.id === riding.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : getEngagementColor(riding.engagement_score) + " text-white"
                  )}>
                    {riding.engagement_score}%
                  </span>
                </div>
                <p className={cn(
                  "text-xs",
                  selectedRiding?.id === riding.id
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                )}>
                  {riding.region} • {riding.active_volunteers} active volunteers
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Riding Details */}
      {selectedRiding && (
        <div className="stat-card animate-slide-up">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-foreground font-display">{selectedRiding.name}</h3>
              <p className="text-muted-foreground">{selectedRiding.region} Region</p>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-lg font-bold text-lg",
              getEngagementColor(selectedRiding.engagement_score),
              "text-white"
            )}>
              {selectedRiding.engagement_score}%
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Total Volunteers</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-display">{selectedRiding.total_volunteers}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Active Now</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-display">{selectedRiding.active_volunteers}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">Doors Knocked</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-display">{selectedRiding.total_doors_knocked.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Total Events</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-display">{selectedRiding.total_events}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
