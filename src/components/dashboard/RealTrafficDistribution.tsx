import { TrafficStats } from '@/hooks/useRealTrafficMonitor';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity } from 'lucide-react';

interface RealTrafficDistributionProps {
  stats: TrafficStats;
}

const DOMAIN_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--muted))',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

const TYPE_COLORS: Record<string, string> = {
  fetch: '#3b82f6',
  xmlhttprequest: '#6366f1',
  script: '#f59e0b',
  css: '#a855f7',
  img: '#22c55e',
  link: '#06b6d4',
  other: 'hsl(var(--muted))',
};

export const RealTrafficDistribution = ({ stats }: RealTrafficDistributionProps) => {
  const domainData = Object.entries(stats.requestsByDomain)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, value }));

  const typeData = Object.entries(stats.requestsByType)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  return (
    <div className="cyber-card">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h3 className="text-base sm:text-lg font-semibold">Traffic Analysis</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Domain Distribution */}
        <div>
          <h4 className="text-xs text-muted-foreground mb-2 text-center">By Domain</h4>
          {domainData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={domainData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                  stroke="none"
                >
                  {domainData.map((_, index) => (
                    <Cell key={`domain-${index}`} fill={DOMAIN_COLORS[index % DOMAIN_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '10px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-xs">
              No data yet
            </div>
          )}
        </div>

        {/* Type Distribution */}
        <div>
          <h4 className="text-xs text-muted-foreground mb-2 text-center">By Type</h4>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                  stroke="none"
                >
                  {typeData.map((entry) => (
                    <Cell key={`type-${entry.name}`} fill={TYPE_COLORS[entry.name] || TYPE_COLORS.other} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '10px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-xs">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <div className="bg-secondary/50 p-2 rounded">
          <span className="text-muted-foreground">Total Data:</span>
          <span className="ml-2 font-mono">{(stats.totalDataTransferred / 1024).toFixed(1)}KB</span>
        </div>
        <div className="bg-secondary/50 p-2 rounded">
          <span className="text-muted-foreground">Suspicious:</span>
          <span className="ml-2 font-mono text-warning">{stats.suspiciousRequests}</span>
        </div>
      </div>
    </div>
  );
};
