import { useState, useCallback, useEffect, useRef } from 'react';
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

export interface AnalysisSettings {
  autoAnalysisEnabled: boolean;
  frequencySeconds: number;
  minPacketsForAnalysis: number;
}

const DEFAULT_SETTINGS: AnalysisSettings = {
  autoAnalysisEnabled: false,
  frequencySeconds: 30,
  minPacketsForAnalysis: 5,
};

export const useAIThreatAnalysis = (
  packets: NetworkPacket[] = [],
  isMonitoring: boolean = false,
  onThreatDetected?: (threat: Threat) => void
) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [settings, setSettings] = useState<AnalysisSettings>(DEFAULT_SETTINGS);
  const [nextAnalysisIn, setNextAnalysisIn] = useState<number | null>(null);
  const packetsRef = useRef(packets);
  const onThreatDetectedRef = useRef(onThreatDetected);

  // Keep refs updated
  useEffect(() => {
    packetsRef.current = packets;
  }, [packets]);

  useEffect(() => {
    onThreatDetectedRef.current = onThreatDetected;
  }, [onThreatDetected]);

  const analyzePackets = useCallback(async (packetsToAnalyze?: NetworkPacket[]): Promise<Threat | null> => {
    const targetPackets = packetsToAnalyze || packetsRef.current;
    
    if (targetPackets.length === 0) {
      console.log('No packets to analyze');
      return null;
    }

    setIsAnalyzing(true);

    try {
      // Prepare packets for analysis - serialize dates
      const serializedPackets = targetPackets.slice(0, 20).map(p => ({
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
          source: targetPackets[0]?.source || 'Unknown',
          sourceCountry: 'AI Detected',
          target: targetPackets[0]?.destination || 'Unknown',
          timestamp: new Date(),
          status: 'active',
          description: `[AI] ${result.analysis.description}`,
          port: 0,
          protocol: targetPackets[0]?.protocol || 'Unknown',
        };

        toast.warning('AI Threat Detected', {
          description: `${result.analysis.severity.toUpperCase()} ${result.analysis.threatType} - ${result.analysis.confidence * 100}% confidence`,
          duration: 8000,
        });

        onThreatDetectedRef.current?.(detectedThreat);
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

  // Auto-analysis effect
  useEffect(() => {
    if (!settings.autoAnalysisEnabled || !isMonitoring) {
      setNextAnalysisIn(null);
      return;
    }

    let countdown = settings.frequencySeconds;
    setNextAnalysisIn(countdown);

    const countdownInterval = setInterval(() => {
      countdown -= 1;
      setNextAnalysisIn(countdown);

      if (countdown <= 0) {
        countdown = settings.frequencySeconds;
        setNextAnalysisIn(countdown);
        
        // Only analyze if we have enough packets
        if (packetsRef.current.length >= settings.minPacketsForAnalysis && !isAnalyzing) {
          analyzePackets();
        }
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [settings.autoAnalysisEnabled, settings.frequencySeconds, settings.minPacketsForAnalysis, isMonitoring, isAnalyzing, analyzePackets]);

  const updateSettings = useCallback((updates: Partial<AnalysisSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleAutoAnalysis = useCallback(() => {
    setSettings(prev => ({ ...prev, autoAnalysisEnabled: !prev.autoAnalysisEnabled }));
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
    settings,
    updateSettings,
    toggleAutoAnalysis,
    nextAnalysisIn,
  };
};
