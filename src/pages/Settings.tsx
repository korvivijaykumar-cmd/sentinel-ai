import { Settings as SettingsIcon, User, Shield, Bell, Palette, Database, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/dashboard/Header';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useNotifications } from '@/hooks/useNotifications';
import { useThreatData } from '@/hooks/useThreatData';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const Settings = () => {
  const [autoBlock, setAutoBlock] = useState(true);
  const [dataRetention, setDataRetention] = useState('30');
  
  const { settings, permissionStatus, notifyThreat, toggleSound, toggleBrowserNotifications, updateSettings, playAlertSound } = useNotifications();
  const { isMonitoring, toggleMonitoring } = useThreatData(notifyThreat);
  const { user, profile } = useAuth();

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
    <div className="flex-1 bg-background flex flex-col min-w-0">
      <Header isMonitoring={isMonitoring} onToggleMonitoring={toggleMonitoring} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-20">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your SENTINEL security platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-5 h-5 text-primary" />
                Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile?.full_name || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value="Viewer" disabled className="bg-muted" />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="w-5 h-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
                </div>
                <ThemeToggle />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">Reduce spacing in UI</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Animations</Label>
                  <p className="text-xs text-muted-foreground">Enable UI animations</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Threat detection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Block Critical Threats</Label>
                  <p className="text-xs text-muted-foreground">Automatically block critical threats</p>
                </div>
                <Switch checked={autoBlock} onCheckedChange={setAutoBlock} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Real-time Monitoring</Label>
                  <p className="text-xs text-muted-foreground">Enable live packet analysis</p>
                </div>
                <Switch checked={isMonitoring} onCheckedChange={toggleMonitoring} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI-Enhanced Detection</Label>
                  <p className="text-xs text-muted-foreground">Use ML models for threat detection</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Browser Notifications</Label>
                  <p className="text-xs text-muted-foreground">Show desktop alerts</p>
                </div>
                <Switch 
                  checked={settings.browserNotificationsEnabled} 
                  onCheckedChange={toggleBrowserNotifications} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sound Alerts</Label>
                  <p className="text-xs text-muted-foreground">Play audio on threats</p>
                </div>
                <Switch 
                  checked={settings.soundEnabled} 
                  onCheckedChange={toggleSound} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Critical Threats</Label>
                  <p className="text-xs text-muted-foreground">Alert on critical severity</p>
                </div>
                <Switch 
                  checked={settings.notifyOnCritical} 
                  onCheckedChange={(checked) => updateSettings({ notifyOnCritical: checked })} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>High Priority Threats</Label>
                  <p className="text-xs text-muted-foreground">Alert on high severity</p>
                </div>
                <Switch 
                  checked={settings.notifyOnHigh} 
                  onCheckedChange={(checked) => updateSettings({ notifyOnHigh: checked })} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Settings */}
          <Card className="cyber-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="w-5 h-5 text-primary" />
                Data Management
              </CardTitle>
              <CardDescription>Configure data retention and storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <Select value={dataRetention} onValueChange={setDataRetention}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="365">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">How long to keep threat data</p>
                </div>
                <div className="space-y-2">
                  <Label>Export Data</Label>
                  <Button variant="outline" className="w-full">
                    Export All Data
                  </Button>
                  <p className="text-xs text-muted-foreground">Download your security data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
