import { AlertTriangle, Shield, ShieldOff, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Threat } from '@/hooks/useThreatData';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ThreatAlertProps {
  threat: Threat;
  onBlock?: (id: string) => void;
}

const severityStyles = {
  critical: {
    bg: 'bg-destructive/10 border-destructive/30',
    text: 'text-destructive',
    badge: 'bg-destructive text-destructive-foreground',
    glow: 'threat-glow',
  },
  high: {
    bg: 'bg-destructive/5 border-destructive/20',
    text: 'text-destructive',
    badge: 'bg-destructive/80 text-destructive-foreground',
    glow: '',
  },
  medium: {
    bg: 'bg-warning/10 border-warning/30',
    text: 'text-warning',
    badge: 'bg-warning text-warning-foreground',
    glow: 'warning-glow',
  },
  low: {
    bg: 'bg-muted border-border',
    text: 'text-muted-foreground',
    badge: 'bg-muted-foreground text-background',
    glow: '',
  },
};

const statusStyles = {
  active: 'bg-destructive text-destructive-foreground',
  blocked: 'bg-success text-success-foreground',
  investigating: 'bg-warning text-warning-foreground',
};

const typeIcons = {
  malware: '🦠',
  intrusion: '🔓',
  ddos: '💥',
  phishing: '🎣',
  ransomware: '🔐',
  botnet: '🤖',
};

export const ThreatAlert = ({ threat, onBlock }: ThreatAlertProps) => {
  const styles = severityStyles[threat.severity];
  
  return (
    <div className={cn(
      'p-4 rounded-lg border transition-all duration-300 animate-slide-in-right',
      styles.bg,
      styles.glow,
      'hover:border-opacity-50'
    )}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{typeIcons[threat.type]}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('px-2 py-0.5 rounded text-xs font-bold uppercase', styles.badge)}>
              {threat.severity}
            </span>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusStyles[threat.status])}>
              {threat.status}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {threat.type}
            </span>
          </div>
          
          <p className={cn('text-sm font-medium mb-2', styles.text)}>
            {threat.description}
          </p>
          
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {threat.sourceCountry}
            </span>
            <span className="font-mono">{threat.source}</span>
            <span>→</span>
            <span className="font-mono">{threat.target}:{threat.port}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(threat.timestamp, { addSuffix: true })}
            </span>
          </div>
        </div>
        
        {threat.status === 'active' && onBlock && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onBlock(threat.id)}
            className="shrink-0"
          >
            <ShieldOff className="w-4 h-4 mr-1" />
            Block
          </Button>
        )}
        
        {threat.status === 'blocked' && (
          <Shield className="w-5 h-5 text-success shrink-0" />
        )}
      </div>
    </div>
  );
};
