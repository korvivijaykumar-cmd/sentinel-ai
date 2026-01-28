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
    <div className={cn('cyber-card group hover:border-primary/50 transition-all duration-300 p-3 sm:p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className={cn('text-xl sm:text-3xl font-bold font-mono tracking-tight', variantStyles[variant])}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={cn(
              'text-[10px] sm:text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn(
          'p-2 sm:p-3 rounded-lg transition-all duration-300 shrink-0',
          iconBgStyles[variant],
          'group-hover:scale-110'
        )}>
          <Icon className={cn('w-4 h-4 sm:w-6 sm:h-6', variantStyles[variant].split(' ')[0])} />
        </div>
      </div>
    </div>
  );
};
