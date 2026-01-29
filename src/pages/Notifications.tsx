import { Bell, BellOff, Volume2, VolumeX, Shield, AlertTriangle, Info, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/dashboard/Header';
import { useNotifications } from '@/hooks/useNotifications';
import { useThreatData } from '@/hooks/useThreatData';

const Notifications = () => {
  const { settings, permissionStatus, notifyThreat, toggleSound, toggleBrowserNotifications, updateSettings, playAlertSound } = useNotifications();
  const { threats, isMonitoring, toggleMonitoring } = useThreatData(notifyThreat);

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

  // Mock notification history
  const notificationHistory = threats.slice(0, 15).map((threat, idx) => ({
    id: threat.id,
    type: threat.severity === 'critical' ? 'critical' : threat.severity === 'high' ? 'warning' : 'info',
    title: `${threat.type} Detected`,
    message: `Threat from ${threat.source}`,
    timestamp: threat.timestamp,
    read: idx > 3,
  }));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning': return <Shield className="w-4 h-4 text-warning" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="flex-1 bg-background flex flex-col min-w-0">
      <Header isMonitoring={isMonitoring} onToggleMonitoring={toggleMonitoring} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notification Settings */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="w-5 h-5 text-primary" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Browser Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.browserNotificationsEnabled ? (
                      <Bell className="w-5 h-5 text-primary" />
                    ) : (
                      <BellOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label>Browser Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        {permissionStatus === 'granted' ? 'Enabled' : 'Permission required'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.browserNotificationsEnabled}
                    onCheckedChange={toggleBrowserNotifications}
                  />
                </div>

                {/* Sound Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label>Sound Alerts</Label>
                      <p className="text-xs text-muted-foreground">Play sound on threats</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={toggleSound}
                  />
                </div>

                {/* Critical Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div>
                      <Label>Critical Alerts</Label>
                      <p className="text-xs text-muted-foreground">Notify on critical threats</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifyOnCritical}
                    onCheckedChange={(checked) => updateSettings({ notifyOnCritical: checked })}
                  />
                </div>

                {/* High Priority Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-warning" />
                    <div>
                      <Label>High Priority Alerts</Label>
                      <p className="text-xs text-muted-foreground">Notify on high severity</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifyOnHigh}
                    onCheckedChange={(checked) => updateSettings({ notifyOnHigh: checked })}
                  />
                </div>

                <Button onClick={() => playAlertSound('critical')} variant="outline" className="w-full gap-2">
                  <Volume2 className="w-4 h-4" />
                  Test Sound
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notification History */}
          <Card className="cyber-card lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification History
                  </CardTitle>
                  <CardDescription>Recent alerts and notifications</CardDescription>
                </div>
                <Badge variant="outline">{notificationHistory.filter(n => !n.read).length} unread</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {notificationHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notificationHistory.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          notification.read 
                            ? 'border-border bg-card/30' 
                            : 'border-primary/30 bg-primary/5'
                        }`}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {notification.read && (
                          <Check className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
