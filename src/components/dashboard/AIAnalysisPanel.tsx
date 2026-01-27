import { Brain, Loader2, AlertTriangle, Shield, Activity, Settings, Timer, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NetworkPacket, Threat } from '@/hooks/useThreatData';
import { useAIThreatAnalysis, AnalysisResult } from '@/hooks/useAIThreatAnalysis';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface AIAnalysisPanelProps {
  packets: NetworkPacket[];
  isMonitoring: boolean;
  onThreatDetected?: (threat: Threat) => void;
}

const severityColors = {
  critical: 'text-destructive bg-destructive/10',
  high: 'text-destructive/80 bg-destructive/5',
  medium: 'text-warning bg-warning/10',
  low: 'text-muted-foreground bg-muted',
};

const frequencyOptions = [
  { value: '15', label: '15 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
  { value: '300', label: '5 minutes' },
];

export const AIAnalysisPanel = ({ packets, isMonitoring, onThreatDetected }: AIAnalysisPanelProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { 
    analyzePackets, 
    isAnalyzing, 
    lastAnalysis, 
    analysisHistory,
    settings,
    updateSettings,
    toggleAutoAnalysis,
    nextAnalysisIn,
  } = useAIThreatAnalysis(packets, isMonitoring, onThreatDetected);

  const handleManualAnalyze = async () => {
    await analyzePackets();
  };

  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Threat Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleManualAnalyze} 
            disabled={isAnalyzing || packets.length === 0}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Auto-analysis status bar */}
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg mb-4 border',
        settings.autoAnalysisEnabled && isMonitoring
          ? 'bg-primary/10 border-primary/30'
          : 'bg-muted/50 border-border'
      )}>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAutoAnalysis}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
              settings.autoAnalysisEnabled && isMonitoring
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {settings.autoAnalysisEnabled && isMonitoring ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          <div>
            <p className="text-sm font-medium">
              {settings.autoAnalysisEnabled && isMonitoring ? 'Auto-Analysis Active' : 'Auto-Analysis Paused'}
            </p>
            <p className="text-xs text-muted-foreground">
              {settings.autoAnalysisEnabled && isMonitoring 
                ? `Next scan in ${formatCountdown(nextAnalysisIn)}`
                : `Interval: ${settings.frequencySeconds}s`
              }
            </p>
          </div>
        </div>
        {settings.autoAnalysisEnabled && isMonitoring && nextAnalysisIn !== null && (
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ 
                  width: `${((settings.frequencySeconds - nextAnalysisIn) / settings.frequencySeconds) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings collapsible */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Analysis Settings
            </span>
            <span className="text-xs text-muted-foreground">
              {settingsOpen ? 'Hide' : 'Show'}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-analysis" className="text-sm">Enable Auto-Analysis</Label>
            <Switch
              id="auto-analysis"
              checked={settings.autoAnalysisEnabled}
              onCheckedChange={toggleAutoAnalysis}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Scan Frequency</Label>
            <Select
              value={settings.frequencySeconds.toString()}
              onValueChange={(value) => updateSettings({ frequencySeconds: parseInt(value) })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                {frequencyOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Min Packets for Analysis</Label>
            <Select
              value={settings.minPacketsForAnalysis.toString()}
              onValueChange={(value) => updateSettings({ minPacketsForAnalysis: parseInt(value) })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="3">3 packets</SelectItem>
                <SelectItem value="5">5 packets</SelectItem>
                <SelectItem value="10">10 packets</SelectItem>
                <SelectItem value="20">20 packets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="text-xs text-muted-foreground mb-4">
        Powered by SENTINEL ML • {packets.length} packets available
      </div>

      {lastAnalysis && (
        <div className={cn(
          'p-4 rounded-lg border mb-4',
          lastAnalysis.analysis.isThreat 
            ? severityColors[lastAnalysis.analysis.severity || 'low']
            : 'bg-success/10 border-success/30'
        )}>
          <div className="flex items-start gap-3">
            {lastAnalysis.analysis.isThreat ? (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <Shield className="w-5 h-5 text-success shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">
                  {lastAnalysis.analysis.isThreat 
                    ? `${lastAnalysis.analysis.threatType?.toUpperCase()} DETECTED`
                    : 'No Threat Detected'
                  }
                </span>
                {lastAnalysis.analysis.isThreat && (
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-bold uppercase',
                    severityColors[lastAnalysis.analysis.severity || 'low']
                  )}>
                    {lastAnalysis.analysis.severity}
                  </span>
                )}
              </div>
              
              <p className="text-sm mb-2">{lastAnalysis.analysis.description}</p>
              
              {lastAnalysis.analysis.isThreat && (
                <>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Confidence:</strong> {(lastAnalysis.analysis.confidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs mb-2">
                    <strong>Recommendation:</strong> {lastAnalysis.analysis.recommendation}
                  </p>
                  
                  {lastAnalysis.analysis.indicators.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">Indicators:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {lastAnalysis.analysis.indicators.slice(0, 5).map((indicator, i) => (
                          <li key={i}>{indicator}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                Analyzed {lastAnalysis.packetsAnalyzed} packets at {new Date(lastAnalysis.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {analysisHistory.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Analysis History</p>
          <ScrollArea className="h-32">
            <div className="space-y-2 pr-4">
              {analysisHistory.slice(1, 10).map((result, index) => (
                <HistoryItem key={index} result={result} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

const HistoryItem = ({ result }: { result: AnalysisResult }) => (
  <div className={cn(
    'p-2 rounded text-xs flex items-center justify-between',
    result.analysis.isThreat 
      ? 'bg-destructive/5 border border-destructive/20'
      : 'bg-muted/50'
  )}>
    <div className="flex items-center gap-2">
      {result.analysis.isThreat ? (
        <AlertTriangle className="w-3 h-3 text-destructive" />
      ) : (
        <Shield className="w-3 h-3 text-success" />
      )}
      <span>
        {result.analysis.isThreat 
          ? `${result.analysis.threatType} (${result.analysis.severity})`
          : 'Clear'
        }
      </span>
    </div>
    <span className="text-muted-foreground">
      {new Date(result.timestamp).toLocaleTimeString()}
    </span>
  </div>
);
