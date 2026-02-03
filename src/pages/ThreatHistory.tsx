import { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Filter, Search, AlertTriangle, History, Clock, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/dashboard/Header';
import { useNotifications } from '@/hooks/useNotifications';
import { useThreatHistory, StoredThreat } from '@/hooks/useThreatHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';

const ThreatHistoryCard = ({ 
  threat, 
  onUpdateStatus 
}: { 
  threat: StoredThreat; 
  onUpdateStatus: (id: string, status: string) => void;
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-destructive/20 text-destructive border-destructive';
      case 'blocked': return 'bg-success/20 text-success border-success';
      case 'resolved': return 'bg-muted text-muted-foreground border-muted';
      case 'investigating': return 'bg-warning/20 text-warning border-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-card/50 hover:bg-accent/30 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-full ${getSeverityColor(threat.severity)}`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-medium capitalize">
                {threat.threat_type.replace(/_/g, ' ')}
              </span>
              <Badge className={getSeverityColor(threat.severity)}>
                {threat.severity}
              </Badge>
              <Badge variant="outline" className={getStatusColor(threat.status)}>
                {threat.status || 'unknown'}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {threat.description}
            </p>
            
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {threat.source_ip && (
                <span className="flex items-center gap-1">
                  <span className="text-foreground font-medium">Source:</span>
                  <span className="font-mono">{threat.source_ip}</span>
                </span>
              )}
              {threat.destination_ip && (
                <span className="flex items-center gap-1">
                  <span className="text-foreground font-medium">Target:</span>
                  <span className="font-mono">{threat.destination_ip}</span>
                </span>
              )}
              {threat.protocol && (
                <span className="flex items-center gap-1">
                  <span className="text-foreground font-medium">Protocol:</span>
                  {threat.protocol}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(threat.created_at), { addSuffix: true })}
              </span>
              <span className="hidden sm:inline">
                {format(new Date(threat.created_at), 'PPpp')}
              </span>
              {threat.resolved_at && (
                <span className="text-success">
                  Resolved {formatDistanceToNow(new Date(threat.resolved_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          {threat.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(threat.id, 'investigating')}
              >
                Investigate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdateStatus(threat.id, 'blocked')}
              >
                Block
              </Button>
            </>
          )}
          {threat.status === 'investigating' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onUpdateStatus(threat.id, 'resolved')}
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ThreatHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { settings, permissionStatus, toggleSound, toggleBrowserNotifications, updateSettings, playAlertSound } = useNotifications();
  const { threats, stats, isLoading, fetchThreats, updateThreatStatus } = useThreatHistory();

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
    const matchesSearch = 
      threat.threat_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      threat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (threat.source_ip?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesSeverity = severityFilter === 'all' || threat.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || threat.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="flex-1 bg-background flex flex-col min-w-0">
      <Header isMonitoring={true} onToggleMonitoring={() => {}} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-20">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Threat History</h1>
              <p className="text-sm text-muted-foreground">Historical record of all detected threats stored in database</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchThreats} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Stored</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{stats.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{stats.blocked}</p>
                  <p className="text-xs text-muted-foreground">Blocked</p>
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
                  placeholder="Search by type, description, or source..."
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
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Threats List */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Threat Records ({filteredThreats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] sm:h-[600px]">
              <div className="space-y-3 pr-4">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))
                ) : filteredThreats.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-1">No threats in history</p>
                    <p className="text-sm">
                      {threats.length === 0 
                        ? 'Detected threats will be stored here automatically'
                        : 'No threats match your current filters'}
                    </p>
                  </div>
                ) : (
                  filteredThreats.map((threat) => (
                    <ThreatHistoryCard 
                      key={threat.id} 
                      threat={threat} 
                      onUpdateStatus={updateThreatStatus}
                    />
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

export default ThreatHistory;
