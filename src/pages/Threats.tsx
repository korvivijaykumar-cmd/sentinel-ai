import { Shield, ShieldAlert, ShieldCheck, Filter, Search, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/dashboard/Header';
import { useNotifications } from '@/hooks/useNotifications';
import { useThreatData } from '@/hooks/useThreatData';

const Threats = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { settings, permissionStatus, notifyThreat, toggleSound, toggleBrowserNotifications, updateSettings, playAlertSound } = useNotifications();
  const { threats, stats, isMonitoring, toggleMonitoring, blockThreat } = useThreatData(notifyThreat);

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

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = threat.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         threat.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || threat.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'blocked' && threat.status === 'blocked') ||
                         (statusFilter === 'active' && threat.status === 'active');
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-destructive/80 text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex-1 bg-background flex flex-col min-w-0">
      <Header isMonitoring={isMonitoring} onToggleMonitoring={toggleMonitoring} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalThreats}</p>
                  <p className="text-xs text-muted-foreground">Total Threats</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{stats.blockedThreats}</p>
                  <p className="text-xs text-muted-foreground">Blocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeThreats}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.criticalThreats}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="cyber-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search threats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-background">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Threats List */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Threat Log ({filteredThreats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] sm:h-[500px]">
              <div className="space-y-3 pr-4">
                {filteredThreats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No threats found matching your filters</p>
                  </div>
                ) : (
                  filteredThreats.map((threat) => (
                    <div
                      key={threat.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-card/50 gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${threat.status === 'blocked' ? 'text-muted-foreground' : 'text-destructive'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium truncate">{threat.type}</span>
                            <Badge className={getSeverityColor(threat.severity)}>
                              {threat.severity}
                            </Badge>
                            {threat.status === 'blocked' && (
                              <Badge variant="outline" className="text-success border-success">
                                Blocked
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            Source: {threat.source}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(threat.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {threat.status !== 'blocked' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => blockThreat(threat.id)}
                          className="w-full sm:w-auto"
                        >
                          Block
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Threats;
