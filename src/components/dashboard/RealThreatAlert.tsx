import { RealThreat } from '@/hooks/useRealTrafficMonitor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Shield, ShieldAlert, ShieldCheck, Globe, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RealThreatAlertProps {
  threat: RealThreat;
  onBlock: (id: string) => void;
}

const severityConfig = {
  critical: {
    color: 'bg-destructive text-destructive-foreground',
    icon: ShieldAlert,
    border: 'border-l-destructive',
  },
  high: {
    color: 'bg-orange-500 text-white',
    icon: ShieldAlert,
    border: 'border-l-orange-500',
  },
  medium: {
    color: 'bg-warning text-warning-foreground',
    icon: AlertTriangle,
    border: 'border-l-warning',
  },
  low: {
    color: 'bg-muted text-muted-foreground',
    icon: Shield,
    border: 'border-l-muted',
  },
};

const typeLabels: Record<RealThreat['type'], string> = {
  suspicious_domain: 'Suspicious Domain',
  data_exfiltration: 'Data Exfiltration',
  unusual_port: 'Unusual Port',
  high_frequency: 'High Frequency',
  large_transfer: 'Large Transfer',
  unknown_origin: 'Unknown Origin',
};

export const RealThreatAlert = ({ threat, onBlock }: RealThreatAlertProps) => {
  const config = severityConfig[threat.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'p-3 sm:p-4 rounded-lg border bg-card transition-all hover:bg-accent/50',
        'border-l-4',
        config.border,
        threat.status === 'blocked' && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={cn('p-1.5 sm:p-2 rounded-full shrink-0', config.color)}>
          <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-[10px] sm:text-xs', config.color)}>
              {threat.severity.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              {typeLabels[threat.type]}
            </Badge>
            {threat.status === 'blocked' && (
              <Badge variant="outline" className="text-[10px] sm:text-xs bg-success/20 text-success">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Blocked
              </Badge>
            )}
          </div>
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="font-mono truncate">{threat.source}</span>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2">
              {threat.description}
            </p>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(threat.timestamp, { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {threat.status !== 'blocked' && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onBlock(threat.id)}
            className="shrink-0 text-xs h-7"
          >
            Block
          </Button>
        )}
      </div>
    </div>
  );
};
