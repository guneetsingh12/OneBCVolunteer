import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, Calendar, DoorOpen, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--info))',
];

export function ReportsView() {
  const [stats, setStats] = useState({
    total_volunteers: 0,
    total_events: 0,
    total_doors: 0,
    total_calls: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [regionStats, setRegionStats] = useState<any[]>([]);
  const [ridingStats, setRidingStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Key Metrics
      const { count: volCount } = await supabase.from('volunteers').select('*', { count: 'exact', head: true });
      const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });

      const { data: activities } = await supabase.from('activities').select('activity_type, doors_knocked, calls_made, activity_date');

      const totalDoors = activities?.reduce((sum, a) => sum + (a.doors_knocked || 0), 0) || 0;
      const totalCalls = activities?.reduce((sum, a) => sum + (a.calls_made || 0), 0) || 0;

      setStats({
        total_volunteers: volCount || 0,
        total_events: eventCount || 0,
        total_doors: totalDoors,
        total_calls: totalCalls
      });

      // 2. Monthly Trends (Last 6 Months)
      const end = new Date();
      const start = subMonths(end, 5);
      const months = eachMonthOfInterval({ start, end });

      const trends = months.map(date => {
        const monthLabel = format(date, 'MMM');
        const monthStart = startOfMonth(date).toISOString();
        const monthEnd = endOfMonth(date).toISOString();

        // Filter activities for this month
        const monthActs = activities?.filter(a => a.activity_date >= monthStart && a.activity_date <= monthEnd) || [];
        const doors = monthActs.reduce((sum, a) => sum + (Number(a.doors_knocked) || 0), 0);
        // Note: Counting unique volunteers would require fetching volunteer_id in activities
        // For now using simple activity count as proxy for engagement or we can fetch volunteer ids if needed. 
        // Let's assume 'volunteers' in the chart meant 'active volunteers' or 'shifts'. 
        // Using activity count as proxy for specific data points if not available easily without heavy grouping.
        // Actually, let's just count total activities for simplicity or refine if requested.
        // Mock data had 'volunteers' and 'doors'.
        const activeVolunteers = 0; // Placeholder if not calculating unique IDs

        return {
          month: monthLabel,
          doors: doors,
          volunteers: monthActs.length // Using shift/activity count for now as a trend indicator
        };
      });
      setMonthlyData(trends);

      // 3. Regional Distribution
      const { data: volunteers } = await supabase.from('volunteers').select('region, riding');

      if (volunteers) {
        // Region Stats
        const regionMap = volunteers.reduce((acc: any, curr) => {
          const region = curr.region || 'Unknown';
          acc[region] = (acc[region] || 0) + 1;
          return acc;
        }, {});

        const rData = Object.entries(regionMap).map(([name, value]) => ({ name, volunteers: value }));
        setRegionStats(rData);

        // Riding Stats (Top 5 by volunteer count)
        const ridingMap = volunteers.reduce((acc: any, curr) => {
          const riding = curr.riding || 'Unknown';
          acc[riding] = (acc[riding] || 0) + 1;
          return acc;
        }, {});

        const ridingData = Object.entries(ridingMap)
          .map(([name, value]) => ({ name, count: value, engagement_score: (value as number) * 5 })) // Mock score based on count
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 8);

        setRidingStats(ridingData);
      }

    } catch (error) {
      console.error('Error fetching report data:', error);
    }
    setLoading(false);
  };

  const handleExport = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Volunteers', stats.total_volunteers],
      ['Total Events', stats.total_events],
      ['Total Doors Knocked', stats.total_doors],
      ['Total Calls Made', stats.total_calls],
      [],
      ['Region', 'Volunteers'],
      ...regionStats.map(r => [r.name, r.volunteers]),
      [],
      ['Riding', 'Volunteers'],
      ...ridingStats.map(r => [r.name, r.count])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `campaign_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Analytics Overview</h2>
          <p className="text-sm text-muted-foreground">Comprehensive campaign performance metrics</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={loading}>
          <Download className="h-4 w-4" />
          {loading ? 'Loading...' : 'Export Report'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-display">
                {stats.total_volunteers}
              </p>
              <p className="text-sm text-muted-foreground">Total Volunteers</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary/10">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-display">
                {stats.total_events}
              </p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/10">
              <DoorOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-display">
                {stats.total_doors.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Doors Knocked</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-info/10">
              <Phone className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-display">
                {stats.total_calls.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Calls Made</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-foreground font-display mb-4">Monthly Activity Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="volunteers" name="Activities" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                <Line type="monotone" dataKey="doors" name="Doors" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Activities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Doors</span>
            </div>
          </div>
        </div>

        {/* Region Distribution */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-foreground font-display mb-4">Regional Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="volunteers"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {regionStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Riding Performance */}
        <div className="stat-card lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground font-display mb-4">Top Ridings (By Volunteer Count)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ridingStats} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar
                  dataKey="count"
                  name="Volunteers"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
