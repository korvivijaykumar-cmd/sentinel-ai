import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface TrafficData {
  time: string;
  inbound: number;
  outbound: number;
  blocked: number;
}

export const NetworkTrafficChart = () => {
  const [data, setData] = useState<TrafficData[]>([]);

  useEffect(() => {
    // Initialize with some data
    const initialData: TrafficData[] = Array.from({ length: 20 }, (_, i) => ({
      time: `${i * 3}s`,
      inbound: Math.floor(Math.random() * 500) + 200,
      outbound: Math.floor(Math.random() * 400) + 150,
      blocked: Math.floor(Math.random() * 50),
    }));
    setData(initialData);

    // Update data every 3 seconds
    const interval = setInterval(() => {
      setData(prev => {
        const newPoint: TrafficData = {
          time: `${prev.length * 3}s`,
          inbound: Math.floor(Math.random() * 500) + 200,
          outbound: Math.floor(Math.random() * 400) + 150,
          blocked: Math.floor(Math.random() * 50),
        };
        return [...prev.slice(-19), newPoint];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">Network Traffic</h3>
        </div>
        <div className="flex gap-3 sm:gap-4 text-xs sm:ml-auto">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary" />
            Inbound
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-success" />
            Outbound
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-destructive" />
            Blocked
          </span>
        </div>
      </div>
      
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(215, 20%, 55%)"
              fontSize={10}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(222, 47%, 18%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="inbound"
              stroke="hsl(187, 85%, 53%)"
              strokeWidth={2}
              fill="url(#inboundGradient)"
            />
            <Area
              type="monotone"
              dataKey="outbound"
              stroke="hsl(142, 76%, 45%)"
              strokeWidth={2}
              fill="url(#outboundGradient)"
            />
            <Area
              type="monotone"
              dataKey="blocked"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              fill="url(#blockedGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
