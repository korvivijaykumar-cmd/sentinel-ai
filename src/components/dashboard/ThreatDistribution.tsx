import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ThreatStats } from '@/hooks/useThreatData';

interface ThreatDistributionProps {
  stats: ThreatStats;
}

const threatTypeColors: Record<string, string> = {
  malware: 'hsl(0, 84%, 60%)',
  intrusion: 'hsl(38, 92%, 50%)',
  ddos: 'hsl(280, 85%, 60%)',
  phishing: 'hsl(187, 85%, 53%)',
  ransomware: 'hsl(330, 85%, 60%)',
  botnet: 'hsl(142, 76%, 45%)',
};

const severityColors: Record<string, string> = {
  critical: 'hsl(0, 84%, 60%)',
  high: 'hsl(0, 60%, 50%)',
  medium: 'hsl(38, 92%, 50%)',
  low: 'hsl(215, 20%, 55%)',
};

export const ThreatDistribution = ({ stats }: ThreatDistributionProps) => {
  const typeData = Object.entries(stats.threatsByType).map(([name, value]) => ({
    name,
    value,
  }));

  const severityData = Object.entries(stats.threatsBySeverity).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="cyber-card h-full">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Threat Distribution</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 h-64">
        <div>
          <p className="text-xs text-muted-foreground text-center mb-2">By Type</p>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={threatTypeColors[entry.name] || 'hsl(215, 20%, 55%)'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 10%)',
                  border: '1px solid hsl(222, 47%, 18%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground text-center mb-2">By Severity</p>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={severityColors[entry.name] || 'hsl(215, 20%, 55%)'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 10%)',
                  border: '1px solid hsl(222, 47%, 18%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {Object.entries(threatTypeColors).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
};
