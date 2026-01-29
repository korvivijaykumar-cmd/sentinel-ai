import { Activity, Wifi, Server, Globe, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/dashboard/Header';
import { NetworkTrafficChart } from '@/components/dashboard/NetworkTrafficChart';
import { PacketStream } from '@/components/dashboard/PacketStream';
import { useNotifications } from '@/hooks/useNotifications';
import { useThreatData } from '@/hooks/useThreatData';

const Network = () => {
  const { settings, permissionStatus, notifyThreat, toggleSound, toggleBrowserNotifications, updateSettings, playAlertSound } = useNotifications();
  const { packets, isMonitoring, toggleMonitoring } = useThreatData(notifyThreat);

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

  // Calculate network stats
  const protocolCounts = packets.reduce((acc, packet) => {
    acc[packet.protocol] = (acc[packet.protocol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalBytes = packets.reduce((sum, p) => sum + p.size, 0);
  const avgPacketSize = packets.length > 0 ? Math.round(totalBytes / packets.length) : 0;

  return (
    <div className="flex-1 bg-background flex flex-col min-w-0">
      <Header isMonitoring={isMonitoring} onToggleMonitoring={toggleMonitoring} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-20">
        {/* Network Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{packets.length}</p>
                  <p className="text-xs text-muted-foreground">Total Packets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-8 h-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{(totalBytes / 1024).toFixed(1)}KB</p>
                  <p className="text-xs text-muted-foreground">Data Transferred</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Server className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{avgPacketSize}B</p>
                  <p className="text-xs text-muted-foreground">Avg Packet Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wifi className={`w-8 h-8 ${isMonitoring ? 'text-success' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-2xl font-bold">{isMonitoring ? 'Active' : 'Paused'}</p>
                  <p className="text-xs text-muted-foreground">Monitor Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Traffic Chart */}
          <div className="xl:col-span-2">
            <NetworkTrafficChart />
          </div>

          {/* Protocol Distribution */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="w-5 h-5 text-primary" />
                Protocol Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {Object.entries(protocolCounts).map(([protocol, count]) => (
                    <div key={protocol} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{protocol}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${(count / packets.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {((count / packets.length) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Packet Stream */}
        <div className="mt-6">
          <PacketStream packets={packets} />
        </div>
      </main>
    </div>
  );
};

export default Network;
