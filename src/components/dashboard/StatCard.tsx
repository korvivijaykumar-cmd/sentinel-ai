import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'text-primary cyber-glow',
  success: 'text-success success-glow',
  warning: 'text-warning warning-glow',
  danger: 'text-destructive threat-glow',
};

const iconBgStyles = {
  default: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  danger: 'bg-destructive/10',
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) => {
  return (
    <div className={cn('cyber-card group hover:border-primary/50 transition-all duration-300', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={cn('stat-value', variantStyles[variant])}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last hour
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-lg transition-all duration-300',
          iconBgStyles[variant],
          'group-hover:scale-110'
        )}>
          <Icon className={cn('w-6 h-6', variantStyles[variant].split(' ')[0])} />
        </div>
      </div>
    </div>
  );
};
