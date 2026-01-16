import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

const variants = {
  default: 'bg-card',
  primary: 'bg-gradient-primary text-primary-foreground',
  secondary: 'bg-gradient-secondary text-secondary-foreground',
  accent: 'bg-gradient-accent text-accent-foreground',
};

export function StatCard({ title, value, change, icon: Icon, variant = 'default' }: StatCardProps) {
  const isColored = variant !== 'default';

  return (
    <div className={cn(
      "stat-card",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            isColored ? "opacity-80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold mt-2 font-display",
            !isColored && "text-foreground"
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm",
              isColored ? "opacity-80" : "text-muted-foreground"
            )}>
              <span className={cn(
                "font-medium",
                change.value >= 0 
                  ? (isColored ? "text-current" : "text-success") 
                  : "text-destructive"
              )}>
                {change.value >= 0 ? '+' : ''}{change.value}%
              </span>
              <span>{change.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          isColored ? "bg-white/20" : "bg-muted"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            isColored ? "text-current" : "text-primary"
          )} />
        </div>
      </div>
    </div>
  );
}
