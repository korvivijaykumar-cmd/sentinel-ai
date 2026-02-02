import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { useRealTrafficMonitor, RealThreat } from '@/hooks/useRealTrafficMonitor';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RealThreatAlert } from '@/components/dashboard/RealThreatAlert';
import { NetworkTrafficChart } from '@/components/dashboard/NetworkTrafficChart';
import { RealPacketStream } from '@/components/dashboard/RealPacketStream';
import { RealTrafficDistribution } from '@/components/dashboard/RealTrafficDistribution';
import { AIAnalysisPanel } from '@/components/dashboard/AIAnalysisPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

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

  // Convert RealThreat to the format expected by notifyThreat
  const handleNewThreat = useCallback((threat: RealThreat) => {
    notifyThreat({
      id: threat.id,
      type: threat.type as any,
      severity: threat.severity,
      source: threat.source,
      sourceCountry: 'Unknown',
      target: threat.target,
      timestamp: threat.timestamp,
      status: threat.status,
      description: threat.description,
    });
  }, [notifyThreat]);

  const { 
    requests, 
    threats, 
    stats, 
    isMonitoring, 
    toggleMonitoring, 
    blockThreat,
    clearHistory 
  } = useRealTrafficMonitor(handleNewThreat);

  const [aiThreats, setAiThreats] = useState<RealThreat[]>([]);

  const handleAIThreatDetected = useCallback((threat: any) => {
    // Convert the AI threat to RealThreat format
    const realThreat: RealThreat = {
      id: threat.id,
      type: 'suspicious_domain',
      severity: threat.severity,
      source: threat.source,
      target: threat.target,
      timestamp: threat.timestamp,
      status: threat.status,
      description: threat.description,
      requestId: '',
    };
    setAiThreats(prev => [realThreat, ...prev].slice(0, 20));
  }, []);

  // Combine AI-detected threats with real traffic threats
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

  // Create a compatible packets array for AIAnalysisPanel
  const compatiblePackets = requests.map(req => ({
    id: req.id,
    timestamp: req.timestamp,
    source: req.domain,
    destination: window.location.hostname,
    protocol: req.protocol as any,
    size: req.transferSize,
    status: req.status,
  }));

  return (
    <div className="flex-1 bg-background flex flex-col min-w-0">
      <Header isMonitoring={isMonitoring} onToggleMonitoring={toggleMonitoring} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-16">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            icon={Activity}
            variant="default"
          />
          <StatCard
            title="Suspicious"
            value={stats.suspiciousRequests}
            icon={ShieldAlert}
            variant={stats.suspiciousRequests > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Threats"
            value={stats.threatsDetected}
            icon={Shield}
            variant={stats.threatsDetected > 0 ? 'danger' : 'default'}
          />
          <StatCard
            title="Data Transfer"
            value={`${(stats.totalDataTransferred / 1024).toFixed(1)}KB`}
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
                  <span className="hidden sm:inline">Real-time Threat Detection</span>
                  <span className="sm:hidden">Threats</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {allThreats.filter(t => t.status === 'active').length} active
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-7 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-64 sm:h-80">
                <div className="space-y-2 sm:space-y-3 pr-4">
                  {allThreats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-success opacity-50" />
                      <p className="text-sm">No threats detected</p>
                      <p className="text-xs mt-1">Your traffic is being monitored in real-time</p>
                    </div>
                  ) : (
                    allThreats.slice(0, 10).map(threat => (
                      <RealThreatAlert
                        key={threat.id}
                        threat={threat}
                        onBlock={blockThreat}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Column - AI Analysis, Distribution & Stream */}
          <div className="space-y-4 sm:space-y-6">
            <AIAnalysisPanel 
              packets={compatiblePackets} 
              isMonitoring={isMonitoring}
              onThreatDetected={handleAIThreatDetected} 
            />
            <RealTrafficDistribution stats={stats} />
            <RealPacketStream requests={requests} />
          </div>
        </div>
      </main>
      
      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border py-2 px-4 z-40">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="hidden sm:inline">Real Traffic Monitor:</span> {isMonitoring ? 'Active' : 'Paused'}
            </span>
            <span className="hidden md:inline">Performance API v1</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden lg:inline">Requests: {stats.totalRequests}</span>
            <span className="hidden sm:inline">Threats: {stats.threatsDetected}</span>
            <span className="text-primary font-mono">SENTINEL v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
