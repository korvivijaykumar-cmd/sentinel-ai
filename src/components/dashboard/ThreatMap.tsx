import { Globe, AlertTriangle } from 'lucide-react';
import { Threat } from '@/hooks/useThreatData';
import { cn } from '@/lib/utils';

interface ThreatMapProps {
  threats: Threat[];
}

const countryPositions: Record<string, { top: string; left: string }> = {
  'Russia': { top: '25%', left: '65%' },
  'China': { top: '40%', left: '75%' },
  'North Korea': { top: '38%', left: '82%' },
  'Iran': { top: '42%', left: '55%' },
  'Brazil': { top: '65%', left: '30%' },
  'Unknown': { top: '50%', left: '50%' },
};

export const ThreatMap = ({ threats }: ThreatMapProps) => {
  const threatsByCountry = threats.reduce((acc, threat) => {
    acc[threat.sourceCountry] = (acc[threat.sourceCountry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeThreats = threats.filter(t => t.status === 'active').length;

  return (
    <div className="cyber-card h-full">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Global Threat Map</h3>
        {activeThreats > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-destructive animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            {activeThreats} Active
          </span>
        )}
      </div>
      
      <div className="relative h-64 bg-secondary/30 rounded-lg overflow-hidden">
        {/* Simplified world map background */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Simplified continent shapes */}
            <ellipse cx="25" cy="22" rx="12" ry="10" fill="currentColor" className="text-primary" />
            <ellipse cx="45" cy="18" rx="15" ry="12" fill="currentColor" className="text-primary" />
            <ellipse cx="75" cy="25" rx="18" ry="15" fill="currentColor" className="text-primary" />
            <ellipse cx="28" cy="38" rx="8" ry="10" fill="currentColor" className="text-primary" />
            <ellipse cx="85" cy="42" rx="10" ry="8" fill="currentColor" className="text-primary" />
          </svg>
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full border-t border-primary/10"
              style={{ top: `${(i + 1) * 12.5}%` }}
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full border-l border-primary/10"
              style={{ left: `${(i + 1) * 8.33}%` }}
            />
          ))}
        </div>
        
        {/* Threat markers */}
        {Object.entries(threatsByCountry).map(([country, count]) => {
          const pos = countryPositions[country] || countryPositions['Unknown'];
          const isActive = threats.some(t => t.sourceCountry === country && t.status === 'active');
          
          return (
            <div
              key={country}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center',
                isActive 
                  ? 'bg-destructive animate-threat-pulse' 
                  : 'bg-warning/80',
              )}>
                <span className="text-[8px] font-bold text-white">{count}</span>
              </div>
              
              {/* Ripple effect for active threats */}
              {isActive && (
                <>
                  <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
                  <span className="absolute -inset-2 rounded-full border border-destructive/50 animate-pulse" />
                </>
              )}
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {country}: {count} threats
              </div>
            </div>
          );
        })}
        
        {/* Target (our network) */}
        <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 rounded-full bg-primary cyber-glow" />
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-primary font-medium whitespace-nowrap">
            Your Network
          </span>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {Object.entries(threatsByCountry)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([country, count]) => (
            <div key={country} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{country}</span>: {count}
            </div>
          ))}
      </div>
    </div>
  );
};
