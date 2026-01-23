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
  const recentPackets = packets.slice(0, 15);

  return (
    <div className="cyber-card h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Live Packet Stream</h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Monitoring</span>
        </div>
      </div>
      
      <div className="space-y-1 overflow-hidden">
        {recentPackets.map((packet, index) => (
          <div
            key={packet.id}
            className={cn(
              'flex items-center gap-2 text-xs font-mono py-1.5 px-2 rounded transition-all',
              'hover:bg-secondary/50',
              index === 0 && 'animate-fade-in bg-secondary/30'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className={cn('w-16 text-center', statusColors[packet.status])}>
              {packet.status === 'normal' ? '✓' : packet.status === 'suspicious' ? '⚠' : '✕'}
            </span>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', protocolColors[packet.protocol])}>
              {packet.protocol}
            </span>
            <span className="text-muted-foreground w-28 truncate">{packet.source}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-foreground w-28 truncate">{packet.destination}</span>
            <span className="text-muted-foreground ml-auto">
              {(packet.size / 1024).toFixed(1)}KB
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
