import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { useThreatData, Threat } from '@/hooks/useThreatData';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ThreatAlert } from '@/components/dashboard/ThreatAlert';
import { NetworkTrafficChart } from '@/components/dashboard/NetworkTrafficChart';
import { PacketStream } from '@/components/dashboard/PacketStream';
import { ThreatDistribution } from '@/components/dashboard/ThreatDistribution';
import { AIAnalysisPanel } from '@/components/dashboard/AIAnalysisPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useCallback } from 'react';

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
  const [aiThreats, setAiThreats] = useState<Threat[]>([]);

  const handleAIThreatDetected = useCallback((threat: Threat) => {
    setAiThreats(prev => [threat, ...prev].slice(0, 20));
  }, []);

  // Combine AI-detected threats with simulated threats
  const allThreats = [...aiThreats, ...threats];

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
    <div className="min-h-screen bg-background flex flex-col">
      <Header isMonitoring={isMonitoring} onToggleMonitoring={toggleMonitoring} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-16">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard
            title="Total Threats"
            value={stats.totalThreats}
            icon={ShieldAlert}
            variant="danger"
            trend={{ value: 12, isPositive: false }}
          />
          <StatCard
            title="Blocked"
            value={stats.blockedThreats}
            icon={ShieldCheck}
            variant="success"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Active"
            value={stats.activeThreats}
            icon={Shield}
            variant={stats.activeThreats > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Packets"
            value={packets.length.toLocaleString()}
            icon={Activity}
            variant="default"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Traffic & Threats */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <NetworkTrafficChart />
            
            <div className="cyber-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                  <span className="hidden sm:inline">Recent Threat Alerts</span>
                  <span className="sm:hidden">Threats</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  {stats.activeThreats} active
                </span>
              </div>
              <ScrollArea className="h-64 sm:h-80">
                <div className="space-y-2 sm:space-y-3 pr-4">
                  {allThreats.slice(0, 10).map(threat => (
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

          {/* Right Column - AI Analysis, Distribution & Stream */}
          <div className="space-y-4 sm:space-y-6">
            <AIAnalysisPanel 
              packets={packets} 
              isMonitoring={isMonitoring}
              onThreatDetected={handleAIThreatDetected} 
            />
            <ThreatDistribution stats={stats} />
            <PacketStream packets={packets} />
          </div>
        </div>
      </main>
      
      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border py-2 px-4 z-40">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="hidden sm:inline">System Status:</span> {isMonitoring ? 'Active' : 'Paused'}
            </span>
            <span className="hidden md:inline">ML Model: v2.4.1</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden lg:inline">Memory: 2.4GB / 8GB</span>
            <span className="hidden sm:inline">CPU: 34%</span>
            <span className="text-primary font-mono">SENTINEL v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
