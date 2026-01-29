import { BarChart3, Download, Calendar, FileText, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/dashboard/Header';
import { NetworkTrafficChart } from '@/components/dashboard/NetworkTrafficChart';
import { ThreatDistribution } from '@/components/dashboard/ThreatDistribution';
import { useNotifications } from '@/hooks/useNotifications';
import { useThreatData } from '@/hooks/useThreatData';
import { useState } from 'react';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const { settings, permissionStatus, notifyThreat, toggleSound, toggleBrowserNotifications, updateSettings, playAlertSound } = useNotifications();
  const { stats, isMonitoring, toggleMonitoring } = useThreatData(notifyThreat);

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

  const reportTemplates = [
    { id: 1, name: 'Executive Summary', description: 'High-level threat overview for stakeholders', icon: FileText },
    { id: 2, name: 'Technical Analysis', description: 'Detailed packet and threat analysis', icon: BarChart3 },
    { id: 3, name: 'Compliance Report', description: 'Security compliance and audit trail', icon: Shield },
    { id: 4, name: 'Trend Analysis', description: 'Historical threat patterns and predictions', icon: TrendingUp },
  ];

  return (
    <div className="flex-1 bg-background flex flex-col min-w-0">
      <Header isMonitoring={isMonitoring} onToggleMonitoring={toggleMonitoring} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-20">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Security Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate and view security analysis reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-background">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Report Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {reportTemplates.map((template) => (
            <Card key={template.id} className="cyber-card hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <template.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <NetworkTrafficChart />
          <ThreatDistribution stats={stats} />
        </div>

        {/* Summary Stats */}
        <Card className="cyber-card mt-6">
          <CardHeader>
            <CardTitle className="text-base">Period Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-2xl font-bold text-primary">{stats.totalThreats}</p>
                <p className="text-xs text-muted-foreground">Total Threats</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-2xl font-bold text-success">{stats.blockedThreats}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-2xl font-bold text-destructive">{stats.criticalThreats}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border">
                <p className="text-2xl font-bold text-warning">{stats.activeThreats}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
