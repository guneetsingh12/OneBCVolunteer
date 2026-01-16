import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockRidings } from '@/data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function RidingPerformance() {
  const topRidings = [...mockRidings]
    .sort((a, b) => b.engagement_score - a.engagement_score)
    .slice(0, 6);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground font-display">Riding Performance</h3>
          <p className="text-sm text-muted-foreground">Top performing electoral districts</p>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topRidings} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              dataKey="name" 
              type="category"
              width={140}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value}%`, 'Engagement Score']}
            />
            <Bar 
              dataKey="engagement_score" 
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground font-display">
            {mockRidings.reduce((sum, r) => sum + r.total_doors_knocked, 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total Doors</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground font-display">
            {mockRidings.reduce((sum, r) => sum + r.total_calls_made, 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total Calls</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-success font-display">76%</p>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-xs text-muted-foreground">Avg. Engagement</p>
        </div>
      </div>
    </div>
  );
}
