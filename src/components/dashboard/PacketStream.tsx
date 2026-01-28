import { NetworkPacket } from '@/hooks/useThreatData';
import { cn } from '@/lib/utils';
import { Server, ArrowRight } from 'lucide-react';

interface PacketStreamProps {
  packets: NetworkPacket[];
}

const statusColors = {
  normal: 'text-success',
  suspicious: 'text-warning',
  blocked: 'text-destructive',
};

const protocolColors: Record<string, string> = {
  TCP: 'bg-primary/20 text-primary',
  UDP: 'bg-success/20 text-success',
  HTTP: 'bg-warning/20 text-warning',
  HTTPS: 'bg-success/20 text-success',
  DNS: 'bg-muted text-muted-foreground',
  SSH: 'bg-destructive/20 text-destructive',
};

export const PacketStream = ({ packets }: PacketStreamProps) => {
  const recentPackets = packets.slice(0, 10);

  return (
    <div className="cyber-card overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h3 className="text-base sm:text-lg font-semibold">
          <span className="hidden sm:inline">Live Packet Stream</span>
          <span className="sm:hidden">Packets</span>
        </h3>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground hidden sm:inline">Monitoring</span>
        </div>
      </div>
      
      <div className="space-y-1 overflow-x-auto">
        {recentPackets.map((packet, index) => (
          <div
            key={packet.id}
            className={cn(
              'flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono py-1 sm:py-1.5 px-1 sm:px-2 rounded transition-all min-w-0',
              'hover:bg-secondary/50',
              index === 0 && 'animate-fade-in bg-secondary/30'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className={cn('w-6 sm:w-10 text-center shrink-0', statusColors[packet.status])}>
              {packet.status === 'normal' ? '✓' : packet.status === 'suspicious' ? '⚠' : '✕'}
            </span>
            <span className={cn('px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shrink-0', protocolColors[packet.protocol])}>
              {packet.protocol}
            </span>
            <span className="text-muted-foreground flex-1 truncate min-w-0">{packet.source}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0 hidden sm:block" />
            <span className="text-foreground flex-1 truncate min-w-0 hidden sm:block">{packet.destination}</span>
            <span className="text-muted-foreground shrink-0">
              {(packet.size / 1024).toFixed(1)}KB
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
