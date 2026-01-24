import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { useThreatData } from '@/hooks/useThreatData';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ThreatAlert } from '@/components/dashboard/ThreatAlert';
import { NetworkTrafficChart } from '@/components/dashboard/NetworkTrafficChart';
import { PacketStream } from '@/components/dashboard/PacketStream';
import { ThreatDistribution } from '@/components/dashboard/ThreatDistribution';
import { ThreatMap } from '@/components/dashboard/ThreatMap';
import { ScrollArea } from '@/components/ui/scroll-area';

const Index = () => {
  const {
    settings,
    permissionStatus,
    notifyThreat,
    toggleSound,
    toggleBrowserNotifications,
    updateSettings,
    playAlertSound,
  } = useNotifications();

  const { threats, packets, stats, isMonitoring, toggleMonitoring, blockThreat } = useThreatData(notifyThreat);

  const notificationProps = {
    soundEnabled: settings.soundEnabled,
    browserNotificationsEnabled: settings.browserNotificationsEnabled,
    notifyOnCritical: settings.notifyOnCritical,
    notifyOnHigh: settings.notifyOnHigh,
    permissionStatus,
    onToggleSound: toggleSound,
    onToggleBrowserNotifications: toggleBrowserNotifications,
    onUpdateSettings: updateSettings,
    onTestSound: () => playAlertSound('critical'),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isMonitoring={isMonitoring} onToggleMonitoring={toggleMonitoring} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Threats Detected"
            value={stats.totalThreats}
            icon={ShieldAlert}
            variant="danger"
            trend={{ value: 12, isPositive: false }}
          />
          <StatCard
            title="Threats Blocked"
            value={stats.blockedThreats}
            icon={ShieldCheck}
            variant="success"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Active Threats"
            value={stats.activeThreats}
            icon={Shield}
            variant={stats.activeThreats > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Packets Analyzed"
            value={packets.length.toLocaleString()}
            icon={Activity}
            variant="default"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Traffic & Threats */}
          <div className="lg:col-span-2 space-y-6">
            <NetworkTrafficChart />
            
            <div className="cyber-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                  Recent Threat Alerts
                </h3>
                <span className="text-xs text-muted-foreground">
                  {stats.activeThreats} active, {stats.blockedThreats} blocked
                </span>
              </div>
              <ScrollArea className="h-80">
                <div className="space-y-3 pr-4">
                  {threats.slice(0, 10).map(threat => (
                    <ThreatAlert
                      key={threat.id}
                      threat={threat}
                      onBlock={blockThreat}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Column - Map, Distribution & Stream */}
          <div className="space-y-6">
            <ThreatMap threats={threats} />
            <ThreatDistribution stats={stats} />
            <PacketStream packets={packets} />
          </div>
        </div>
      </main>
      
      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border py-2 px-4">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              System Status: {isMonitoring ? 'Active' : 'Paused'}
            </span>
            <span>ML Model: v2.4.1</span>
            <span>Last Scan: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Memory: 2.4GB / 8GB</span>
            <span>CPU: 34%</span>
            <span className="text-primary font-mono">SENTINEL v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
