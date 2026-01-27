import { Brain, Loader2, AlertTriangle, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NetworkPacket } from '@/hooks/useThreatData';
import { useAIThreatAnalysis, AnalysisResult } from '@/hooks/useAIThreatAnalysis';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIAnalysisPanelProps {
  packets: NetworkPacket[];
  onThreatDetected?: (threat: any) => void;
}

const severityColors = {
  critical: 'text-destructive bg-destructive/10',
  high: 'text-destructive/80 bg-destructive/5',
  medium: 'text-warning bg-warning/10',
  low: 'text-muted-foreground bg-muted',
};

export const AIAnalysisPanel = ({ packets, onThreatDetected }: AIAnalysisPanelProps) => {
  const { analyzePackets, isAnalyzing, lastAnalysis, analysisHistory } = useAIThreatAnalysis();

  const handleAnalyze = async () => {
    // Take the most recent packets for analysis
    const recentPackets = packets.slice(0, 20);
    const threat = await analyzePackets(recentPackets);
    if (threat && onThreatDetected) {
      onThreatDetected(threat);
    }
  };

  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Threat Analysis</h3>
        </div>
        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || packets.length === 0}
          size="sm"
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
              Analyze Packets
            </>
          )}
        </Button>
      </div>

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
