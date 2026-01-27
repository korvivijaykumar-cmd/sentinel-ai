import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NetworkPacket, Threat } from './useThreatData';
import { toast } from 'sonner';

export interface ThreatAnalysis {
  isThreat: boolean;
  threatType: 'malware' | 'intrusion' | 'ddos' | 'phishing' | 'ransomware' | 'botnet' | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | null;
  confidence: number;
  description: string;
  recommendation: string;
  indicators: string[];
}

export interface AnalysisResult {
  success: boolean;
  analysis: ThreatAnalysis;
  packetsAnalyzed: number;
  timestamp: string;
}

export const useAIThreatAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);

  const analyzePackets = useCallback(async (packets: NetworkPacket[]): Promise<Threat | null> => {
    if (packets.length === 0) {
      console.log('No packets to analyze');
      return null;
    }

    setIsAnalyzing(true);

    try {
      // Prepare packets for analysis - serialize dates
      const serializedPackets = packets.map(p => ({
        ...p,
        timestamp: p.timestamp instanceof Date ? p.timestamp.toISOString() : p.timestamp,
      }));

      const { data, error } = await supabase.functions.invoke('analyze-threat', {
        body: { packets: serializedPackets },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Threat analysis failed', {
          description: error.message,
        });
        return null;
      }

      const result = data as AnalysisResult;
      setLastAnalysis(result);
      setAnalysisHistory(prev => [result, ...prev].slice(0, 50));

      if (result.analysis.isThreat && result.analysis.threatType && result.analysis.severity) {
        // Create a threat object from the AI analysis
        const detectedThreat: Threat = {
          id: crypto.randomUUID(),
          type: result.analysis.threatType,
          severity: result.analysis.severity,
          source: packets[0]?.source || 'Unknown',
          sourceCountry: 'AI Detected',
          target: packets[0]?.destination || 'Unknown',
          timestamp: new Date(),
          status: 'active',
          description: `[AI] ${result.analysis.description}`,
          port: 0,
          protocol: packets[0]?.protocol || 'Unknown',
        };

        toast.warning('AI Threat Detected', {
          description: `${result.analysis.severity.toUpperCase()} ${result.analysis.threatType} - ${result.analysis.confidence * 100}% confidence`,
          duration: 8000,
        });

        return detectedThreat;
      }

      return null;
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Analysis failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setAnalysisHistory([]);
    setLastAnalysis(null);
  }, []);

  return {
    analyzePackets,
    isAnalyzing,
    lastAnalysis,
    analysisHistory,
    clearHistory,
  };
};
