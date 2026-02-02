import { RealNetworkRequest } from '@/hooks/useRealTrafficMonitor';
import { cn } from '@/lib/utils';
import { Server, ArrowRight, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface RealPacketStreamProps {
  requests: RealNetworkRequest[];
}

const statusColors = {
  normal: 'text-success',
  suspicious: 'text-warning',
  blocked: 'text-destructive',
};

const statusIcons = {
  normal: '✓',
  suspicious: '⚠',
  blocked: '✕',
};

const protocolColors: Record<string, string> = {
  HTTPS: 'bg-success/20 text-success',
  HTTP: 'bg-warning/20 text-warning',
  WS: 'bg-primary/20 text-primary',
  WSS: 'bg-primary/20 text-primary',
  OTHER: 'bg-muted text-muted-foreground',
};

const initiatorColors: Record<string, string> = {
  fetch: 'bg-blue-500/20 text-blue-400',
  xmlhttprequest: 'bg-blue-500/20 text-blue-400',
  script: 'bg-yellow-500/20 text-yellow-400',
  css: 'bg-purple-500/20 text-purple-400',
  img: 'bg-green-500/20 text-green-400',
  link: 'bg-cyan-500/20 text-cyan-400',
  other: 'bg-muted text-muted-foreground',
};

export const RealPacketStream = ({ requests }: RealPacketStreamProps) => {
  const recentRequests = requests.slice(0, 15);

  return (
    <div className="cyber-card overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h3 className="text-base sm:text-lg font-semibold">
          <span className="hidden sm:inline">Live Network Traffic</span>
          <span className="sm:hidden">Traffic</span>
        </h3>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground hidden sm:inline">Real-time</span>
        </div>
      </div>
      
      <ScrollArea className="h-80">
        <div className="space-y-1">
          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Monitoring network traffic...</p>
              <p className="text-xs mt-1">Requests will appear here as they occur</p>
            </div>
          ) : (
            recentRequests.map((request, index) => (
              <div
                key={request.id}
                className={cn(
                  'flex flex-col gap-1 text-xs font-mono py-2 px-2 rounded transition-all',
                  'hover:bg-secondary/50 border-l-2',
                  request.status === 'suspicious' && 'border-l-warning bg-warning/5',
                  request.status === 'blocked' && 'border-l-destructive bg-destructive/5',
                  request.status === 'normal' && 'border-l-transparent',
                  index === 0 && 'animate-fade-in'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('w-4 text-center shrink-0', statusColors[request.status])}>
                    {statusIcons[request.status]}
                  </span>
                  <Badge variant="outline" className={cn('text-[9px] px-1 py-0 shrink-0', protocolColors[request.protocol])}>
                    {request.protocol}
                  </Badge>
                  <Badge variant="outline" className={cn('text-[9px] px-1 py-0 shrink-0', initiatorColors[request.initiatorType] || initiatorColors.other)}>
                    {request.initiatorType}
                  </Badge>
                  <span className="text-muted-foreground shrink-0 ml-auto">
                    {request.transferSize > 0 ? `${(request.transferSize / 1024).toFixed(1)}KB` : '-'}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {request.duration.toFixed(0)}ms
                  </span>
                </div>
                
                <div className="flex items-center gap-1 pl-6">
                  <span className="text-foreground truncate flex-1" title={request.url}>
                    {request.domain}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate max-w-[150px]" title={request.url}>
                    {new URL(request.url).pathname.slice(0, 30)}
                  </span>
                </div>

                {request.riskScore > 0 && (
                  <div className="flex items-center gap-1 pl-6 mt-1">
                    <AlertTriangle className={cn(
                      'w-3 h-3 shrink-0',
                      request.riskScore > 50 ? 'text-destructive' : 'text-warning'
                    )} />
                    <span className={cn(
                      'text-[10px]',
                      request.riskScore > 50 ? 'text-destructive' : 'text-warning'
                    )}>
                      Risk: {request.riskScore}% - {request.riskReasons[0]}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
