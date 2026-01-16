import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { regionData } from '@/data/mockData';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--info))',
];

export function RegionBreakdown() {
  const total = regionData.reduce((sum, r) => sum + r.volunteers, 0);

  return (
    <div className="stat-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground font-display">Volunteers by Region</h3>
        <p className="text-sm text-muted-foreground">Distribution across BC</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="volunteers"
              >
                {regionData.map((_, index) => (
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

        <div className="flex-1 space-y-3">
          {regionData.map((region, index) => (
            <div key={region.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-foreground">{region.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground">{region.volunteers}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({Math.round((region.volunteers / total) * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
