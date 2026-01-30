import { useState } from 'react';
import { Cpu, HardDrive, MemoryStick, Wifi, WifiOff, Activity, Server, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Header } from '@/components/dashboard/Header';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

const SystemMonitor = () => {
  const { metrics, processes, threats, agents, isLoading, updateThreatStatus, refetch } = useSystemMetrics();
  const { settings, permissionStatus, toggleSound, toggleBrowserNotifications, updateSettings, playAlertSound } = useNotifications();
  const [showAgentScript, setShowAgentScript] = useState(false);

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

  const latestMetrics = agents.length > 0 ? agents[0].latestMetrics : null;

  const handleBlockThreat = async (threatId: string) => {
    const success = await updateThreatStatus(threatId, 'blocked');
    if (success) {
      toast.success('Threat blocked successfully');
    } else {
      toast.error('Failed to block threat');
    }
  };

  const handleResolveThreat = async (threatId: string) => {
    const success = await updateThreatStatus(threatId, 'resolved');
    if (success) {
      toast.success('Threat marked as resolved');
    } else {
      toast.error('Failed to resolve threat');
    }
  };

  const agentScript = `#!/usr/bin/env python3
"""
SENTINEL System Monitoring Agent
Run this script on your machine to send real-time metrics to the dashboard.

Requirements:
  pip install psutil requests

Usage:
  python sentinel_agent.py
"""

import psutil
import requests
import socket
import uuid
import time
import json
from datetime import datetime

# Configuration
API_URL = "${window.location.origin.includes('localhost') ? 'https://fhksyktakysfhegrilfd.supabase.co' : 'https://fhksyktakysfhegrilfd.supabase.co'}/functions/v1/system-metrics"
AGENT_ID = str(uuid.uuid4())[:8]
HOSTNAME = socket.gethostname()
INTERVAL = 5  # seconds between reports

# Threat detection patterns (customize as needed)
SUSPICIOUS_PROCESSES = ['cryptominer', 'keylogger', 'backdoor', 'rootkit']
SUSPICIOUS_PORTS = [4444, 5555, 6666, 31337]  # Common backdoor ports

def get_system_metrics():
    """Collect system metrics."""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    net_io = psutil.net_io_counters()
    
    return {
        "cpu_usage": cpu_percent,
        "memory_usage": memory.percent,
        "memory_total": memory.total,
        "memory_used": memory.used,
        "disk_usage": disk.percent,
        "network_in": net_io.bytes_recv,
        "network_out": net_io.bytes_sent,
    }

def get_running_processes(limit=50):
    """Get top processes by CPU usage."""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status', 'username']):
        try:
            info = proc.info
            processes.append({
                "pid": info['pid'],
                "name": info['name'] or 'Unknown',
                "cpu_percent": info['cpu_percent'] or 0,
                "memory_percent": info['memory_percent'] or 0,
                "status": info['status'] or 'unknown',
                "user_name": info['username'],
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    # Sort by CPU usage and return top processes
    processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
    return processes[:limit]

def detect_threats():
    """Basic threat detection based on process names and network connections."""
    threats = []
    
    # Check for suspicious processes
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            name = proc.info['name'].lower() if proc.info['name'] else ''
            for suspicious in SUSPICIOUS_PROCESSES:
                if suspicious in name:
                    threats.append({
                        "threat_type": "malware",
                        "severity": "high",
                        "process_name": proc.info['name'],
                        "process_pid": proc.info['pid'],
                        "description": f"Suspicious process detected: {proc.info['name']}",
                    })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    # Check for suspicious network connections
    try:
        connections = psutil.net_connections(kind='inet')
        for conn in connections:
            if conn.status == 'LISTEN' and conn.laddr.port in SUSPICIOUS_PORTS:
                threats.append({
                    "threat_type": "intrusion",
                    "severity": "critical",
                    "port": conn.laddr.port,
                    "protocol": "TCP",
                    "description": f"Suspicious listening port detected: {conn.laddr.port}",
                })
            if conn.status == 'ESTABLISHED' and conn.raddr:
                # Check for connections to suspicious ports
                if conn.raddr.port in SUSPICIOUS_PORTS:
                    threats.append({
                        "threat_type": "botnet",
                        "severity": "critical",
                        "source_ip": conn.laddr.ip if conn.laddr else None,
                        "destination_ip": conn.raddr.ip,
                        "port": conn.raddr.port,
                        "protocol": "TCP",
                        "description": f"Connection to suspicious port: {conn.raddr.ip}:{conn.raddr.port}",
                    })
    except (psutil.AccessDenied, OSError):
        pass
    
    # High CPU usage detection
    cpu = psutil.cpu_percent(interval=0.1)
    if cpu > 90:
        threats.append({
            "threat_type": "ddos",
            "severity": "medium",
            "description": f"Abnormally high CPU usage detected: {cpu}%",
        })
    
    return threats

def send_metrics():
    """Send metrics to the API."""
    payload = {
        "agent_id": AGENT_ID,
        "hostname": HOSTNAME,
        "metrics": get_system_metrics(),
        "processes": get_running_processes(),
        "threats": detect_threats(),
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Metrics sent - CPU: {payload['metrics']['cpu_usage']}%, MEM: {payload['metrics']['memory_usage']}%, Threats: {len(payload['threats'])}")
        else:
            print(f"Error sending metrics: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error connecting to API: {e}")

def main():
    print(f"SENTINEL Agent Started")
    print(f"Agent ID: {AGENT_ID}")
    print(f"Hostname: {HOSTNAME}")
    print(f"Reporting to: {API_URL}")
    print(f"Interval: {INTERVAL}s")
    print("-" * 50)
    
    while True:
        send_metrics()
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
`;

  const downloadScript = () => {
    const blob = new Blob([agentScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentinel_agent.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Agent script downloaded');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 bg-background flex flex-col min-w-0">
      <Header isMonitoring={agents.some(a => a.isOnline)} onToggleMonitoring={() => {}} notificationProps={notificationProps} />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 flex-1 pb-20">
        {/* Agent Status & Download */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Card className="cyber-card flex-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold">Connected Agents</p>
                    <div className="flex items-center gap-2 mt-1">
                      {agents.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No agents connected</span>
                      ) : (
                        agents.map(agent => (
                          <Badge key={agent.agent_id} variant={agent.isOnline ? 'default' : 'secondary'}>
                            {agent.isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                            {agent.hostname}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refetch}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Dialog open={showAgentScript} onOpenChange={setShowAgentScript}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Get Agent
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>SENTINEL Monitoring Agent</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Download and run this Python script on your machine to send real-time system metrics to the dashboard.
                        </p>
                        <div className="bg-muted p-2 rounded text-xs font-mono">
                          <p>Requirements: <code>pip install psutil requests</code></p>
                          <p>Run: <code>python sentinel_agent.py</code></p>
                        </div>
                        <ScrollArea className="h-64 border rounded p-3">
                          <pre className="text-xs">{agentScript}</pre>
                        </ScrollArea>
                        <Button onClick={downloadScript} className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download sentinel_agent.py
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Metrics Cards */}
        {latestMetrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Cpu className="w-6 h-6 text-primary" />
                  <span className="font-medium">CPU</span>
                </div>
                <p className="text-2xl font-bold">{Number(latestMetrics.cpu_usage).toFixed(1)}%</p>
                <Progress value={Number(latestMetrics.cpu_usage)} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <MemoryStick className="w-6 h-6 text-success" />
                  <span className="font-medium">Memory</span>
                </div>
                <p className="text-2xl font-bold">{Number(latestMetrics.memory_usage).toFixed(1)}%</p>
                <Progress value={Number(latestMetrics.memory_usage)} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <HardDrive className="w-6 h-6 text-warning" />
                  <span className="font-medium">Disk</span>
                </div>
                <p className="text-2xl font-bold">{latestMetrics.disk_usage ? Number(latestMetrics.disk_usage).toFixed(1) : 0}%</p>
                <Progress value={Number(latestMetrics.disk_usage || 0)} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-6 h-6 text-info" />
                  <span className="font-medium">Network</span>
                </div>
                <p className="text-lg font-bold">
                  ↓{((latestMetrics.network_in || 0) / 1024 / 1024).toFixed(1)}MB
                </p>
                <p className="text-sm text-muted-foreground">
                  ↑{((latestMetrics.network_out || 0) / 1024 / 1024).toFixed(1)}MB
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="threats" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="threats" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Threats ({threats.filter(t => t.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="processes" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Processes ({processes.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="threats">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Detected Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {threats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No threats detected. Connect an agent to start monitoring.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {threats.map(threat => (
                        <div key={threat.id} className="border rounded-lg p-4 bg-card/50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <span className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(threat.severity)}`} />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{threat.threat_type.toUpperCase()}</Badge>
                                  <Badge className={getSeverityColor(threat.severity)}>{threat.severity}</Badge>
                                  <Badge variant={threat.status === 'active' ? 'destructive' : 'secondary'}>
                                    {threat.status}
                                  </Badge>
                                </div>
                                <p className="text-sm">{threat.description}</p>
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  {threat.process_name && <span>Process: {threat.process_name}</span>}
                                  {threat.port && <span>Port: {threat.port}</span>}
                                  {threat.source_ip && <span>Source: {threat.source_ip}</span>}
                                </div>
                              </div>
                            </div>
                            {threat.status === 'active' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="destructive" onClick={() => handleBlockThreat(threat.id)}>
                                  Block
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleResolveThreat(threat.id)}>
                                  Resolve
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processes">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Running Processes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No process data. Connect an agent to view running processes.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">PID</th>
                            <th className="text-left p-2">Name</th>
                            <th className="text-right p-2">CPU %</th>
                            <th className="text-right p-2">Memory %</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processes.map(proc => (
                            <tr key={proc.id} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-mono">{proc.pid}</td>
                              <td className="p-2 max-w-48 truncate">{proc.name}</td>
                              <td className="p-2 text-right">
                                <span className={Number(proc.cpu_percent) > 50 ? 'text-destructive font-bold' : ''}>
                                  {Number(proc.cpu_percent).toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-2 text-right">{Number(proc.memory_percent).toFixed(1)}%</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs">{proc.status}</Badge>
                              </td>
                              <td className="p-2 text-muted-foreground">{proc.user_name || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  Metrics History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No metrics history. Connect an agent to start collecting data.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {metrics.slice(0, 50).map(m => (
                        <div key={m.id} className="flex items-center justify-between p-2 border-b text-sm">
                          <span className="text-muted-foreground font-mono text-xs">
                            {new Date(m.created_at).toLocaleTimeString()}
                          </span>
                          <div className="flex gap-4">
                            <span>CPU: {Number(m.cpu_usage).toFixed(1)}%</span>
                            <span>MEM: {Number(m.memory_usage).toFixed(1)}%</span>
                            <span>Disk: {m.disk_usage ? Number(m.disk_usage).toFixed(1) : 0}%</span>
                          </div>
                          <Badge variant="outline">{m.hostname}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SystemMonitor;
