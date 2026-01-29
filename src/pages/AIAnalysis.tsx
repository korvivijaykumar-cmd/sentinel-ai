import { Brain, Zap, Target, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/dashboard/Header';
import { AIAnalysisPanel } from '@/components/dashboard/AIAnalysisPanel';
import { ThreatDistribution } from '@/components/dashboard/ThreatDistribution';
import { useNotifications } from '@/hooks/useNotifications';
import { useThreatData, Threat } from '@/hooks/useThreatData';
import { useState, useCallback } from 'react';

const AIAnalysis = () => {
  const { settings, permissionStatus, notifyThreat, toggleSound, toggleBrowserNotifications, updateSettings, playAlertSound } = useNotifications();
  const { packets, stats, isMonitoring, toggleMonitoring } = useThreatData(notifyThreat);
  const [aiThreats, setAiThreats] = useState<Threat[]>([]);

  const handleAIThreatDetected = useCallback((threat: Threat) => {
    setAiThreats(prev => [threat, ...prev].slice(0, 20));
  }, []);

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
        {/* AI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{aiThreats.length}</p>
                  <p className="text-xs text-muted-foreground">AI Detections</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{packets.length}</p>
                  <p className="text-xs text-muted-foreground">Packets Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">98.5%</p>
                  <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">v2.4</p>
                  <p className="text-xs text-muted-foreground">Model Version</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* AI Analysis Panel */}
          <AIAnalysisPanel 
            packets={packets} 
            isMonitoring={isMonitoring}
            onThreatDetected={handleAIThreatDetected}
          />

          {/* Threat Distribution */}
          <ThreatDistribution stats={stats} />
        </div>

        {/* AI Detection History */}
        <Card className="cyber-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-primary" />
              AI Detection History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiThreats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No AI detections yet. Start monitoring to see threats.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiThreats.slice(0, 10).map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <div className="flex items-center gap-3">
                      <Brain className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{threat.type}</p>
                        <p className="text-xs text-muted-foreground">{threat.source}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AIAnalysis;
