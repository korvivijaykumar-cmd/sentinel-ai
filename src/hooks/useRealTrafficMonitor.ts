import { useState, useEffect, useCallback, useRef } from 'react';

export interface RealNetworkRequest {
  id: string;
  timestamp: Date;
  url: string;
  domain: string;
  protocol: 'HTTP' | 'HTTPS' | 'WS' | 'WSS' | 'OTHER';
  method: string;
  initiatorType: string;
  duration: number;
  transferSize: number;
  status: 'normal' | 'suspicious' | 'blocked';
  riskScore: number;
  riskReasons: string[];
}

export interface RealThreat {
  id: string;
  type: 'suspicious_domain' | 'data_exfiltration' | 'unusual_port' | 'high_frequency' | 'large_transfer' | 'unknown_origin';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  target: string;
  timestamp: Date;
  status: 'active' | 'blocked' | 'investigating';
  description: string;
  requestId: string;
}

export interface TrafficStats {
  totalRequests: number;
  suspiciousRequests: number;
  blockedRequests: number;
  totalDataTransferred: number;
  requestsByDomain: Record<string, number>;
  requestsByType: Record<string, number>;
  threatsDetected: number;
}

// Known suspicious patterns and domains
const SUSPICIOUS_PATTERNS = [
  /tracking/i,
  /analytics/i,
  /pixel/i,
  /beacon/i,
  /collect/i,
  /telemetry/i,
];

const TRUSTED_DOMAINS = [
  'supabase.co',
  'lovable.app',
  'localhost',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

const analyzeRequest = (entry: PerformanceResourceTiming): { riskScore: number; riskReasons: string[] } => {
  const riskReasons: string[] = [];
  let riskScore = 0;

  const url = entry.name;
  const domain = new URL(url).hostname;

  // Check for suspicious URL patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      riskScore += 20;
      riskReasons.push(`URL matches suspicious pattern: ${pattern.source}`);
    }
  }

  // Check if domain is not in trusted list
  const isTrusted = TRUSTED_DOMAINS.some(trusted => domain.includes(trusted));
  if (!isTrusted && !domain.includes(window.location.hostname)) {
    riskScore += 15;
    riskReasons.push('External domain not in trusted list');
  }

  // Large data transfers (potential exfiltration)
  if (entry.transferSize > 100000) {
    riskScore += 25;
    riskReasons.push(`Large data transfer: ${(entry.transferSize / 1024).toFixed(1)}KB`);
  }

  // Slow requests (potential C&C communication)
  if (entry.duration > 5000) {
    riskScore += 10;
    riskReasons.push(`Slow request: ${(entry.duration / 1000).toFixed(1)}s`);
  }

  // Third-party scripts
  if (entry.initiatorType === 'script' && !isTrusted) {
    riskScore += 15;
    riskReasons.push('Third-party script execution');
  }

  // XHR/Fetch to unknown domains
  if ((entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') && !isTrusted) {
    riskScore += 20;
    riskReasons.push('API call to external domain');
  }

  return { riskScore: Math.min(riskScore, 100), riskReasons };
};

const getProtocol = (url: string): RealNetworkRequest['protocol'] => {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'https:') return 'HTTPS';
    if (urlObj.protocol === 'http:') return 'HTTP';
    if (urlObj.protocol === 'wss:') return 'WSS';
    if (urlObj.protocol === 'ws:') return 'WS';
    return 'OTHER';
  } catch {
    return 'OTHER';
  }
};

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
};

const createThreatFromRequest = (request: RealNetworkRequest): RealThreat | null => {
  if (request.riskScore < 30) return null;

  let type: RealThreat['type'] = 'unknown_origin';
  let severity: RealThreat['severity'] = 'low';

  if (request.riskReasons.some(r => r.includes('Large data'))) {
    type = 'data_exfiltration';
    severity = request.riskScore > 70 ? 'critical' : 'high';
  } else if (request.riskReasons.some(r => r.includes('Third-party script'))) {
    type = 'unknown_origin';
    severity = request.riskScore > 50 ? 'high' : 'medium';
  } else if (request.riskReasons.some(r => r.includes('tracking') || r.includes('analytics'))) {
    type = 'suspicious_domain';
    severity = 'medium';
  } else if (request.riskReasons.some(r => r.includes('API call'))) {
    type = 'data_exfiltration';
    severity = request.riskScore > 60 ? 'high' : 'medium';
  }

  return {
    id: crypto.randomUUID(),
    type,
    severity,
    source: request.domain,
    target: window.location.hostname,
    timestamp: request.timestamp,
    status: 'active',
    description: request.riskReasons.join('; '),
    requestId: request.id,
  };
};

export const useRealTrafficMonitor = (onNewThreat?: (threat: RealThreat) => void) => {
  const [requests, setRequests] = useState<RealNetworkRequest[]>([]);
  const [threats, setThreats] = useState<RealThreat[]>([]);
  const [stats, setStats] = useState<TrafficStats>({
    totalRequests: 0,
    suspiciousRequests: 0,
    blockedRequests: 0,
    totalDataTransferred: 0,
    requestsByDomain: {},
    requestsByType: {},
    threatsDetected: 0,
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const processedEntries = useRef(new Set<string>());
  const onNewThreatRef = useRef(onNewThreat);

  useEffect(() => {
    onNewThreatRef.current = onNewThreat;
  }, [onNewThreat]);

  const processEntry = useCallback((entry: PerformanceResourceTiming) => {
    // Create unique key for deduplication
    const entryKey = `${entry.name}-${entry.startTime}`;
    if (processedEntries.current.has(entryKey)) return null;
    processedEntries.current.add(entryKey);

    const { riskScore, riskReasons } = analyzeRequest(entry);
    
    const request: RealNetworkRequest = {
      id: crypto.randomUUID(),
      timestamp: new Date(performance.timeOrigin + entry.startTime),
      url: entry.name,
      domain: getDomain(entry.name),
      protocol: getProtocol(entry.name),
      method: 'GET', // Performance API doesn't expose method
      initiatorType: entry.initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize || 0,
      status: riskScore > 50 ? 'suspicious' : riskScore > 70 ? 'blocked' : 'normal',
      riskScore,
      riskReasons,
    };

    return request;
  }, []);

  const updateStats = useCallback((currentRequests: RealNetworkRequest[], currentThreats: RealThreat[]) => {
    const requestsByDomain: Record<string, number> = {};
    const requestsByType: Record<string, number> = {};
    let totalDataTransferred = 0;
    let suspiciousRequests = 0;
    let blockedRequests = 0;

    currentRequests.forEach(req => {
      requestsByDomain[req.domain] = (requestsByDomain[req.domain] || 0) + 1;
      requestsByType[req.initiatorType] = (requestsByType[req.initiatorType] || 0) + 1;
      totalDataTransferred += req.transferSize;
      if (req.status === 'suspicious') suspiciousRequests++;
      if (req.status === 'blocked') blockedRequests++;
    });

    setStats({
      totalRequests: currentRequests.length,
      suspiciousRequests,
      blockedRequests,
      totalDataTransferred,
      requestsByDomain,
      requestsByType,
      threatsDetected: currentThreats.length,
    });
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;

    // Process existing entries
    const existingEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const initialRequests: RealNetworkRequest[] = [];
    const initialThreats: RealThreat[] = [];

    existingEntries.forEach(entry => {
      const request = processEntry(entry);
      if (request) {
        initialRequests.push(request);
        const threat = createThreatFromRequest(request);
        if (threat) {
          initialThreats.push(threat);
        }
      }
    });

    if (initialRequests.length > 0) {
      setRequests(initialRequests);
      setThreats(initialThreats);
      updateStats(initialRequests, initialThreats);
    }

    // Set up observer for new requests
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      
      entries.forEach(entry => {
        const request = processEntry(entry);
        if (request) {
          setRequests(prev => {
            const updated = [request, ...prev].slice(0, 200);
            return updated;
          });

          const threat = createThreatFromRequest(request);
          if (threat) {
            setThreats(prev => {
              const updated = [threat, ...prev].slice(0, 100);
              updateStats(
                [...requests, request],
                updated
              );
              return updated;
            });
            onNewThreatRef.current?.(threat);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('PerformanceObserver not supported:', e);
    }

    // Also monitor navigation timing
    const navObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        console.log('[Traffic Monitor] Navigation:', entry.name, entry.entryType);
      });
    });

    try {
      navObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      // Navigation observer not supported in all browsers
    }

    return () => {
      observer.disconnect();
      navObserver.disconnect();
    };
  }, [isMonitoring, processEntry, updateStats]);

  // Periodically update stats
  useEffect(() => {
    const interval = setInterval(() => {
      updateStats(requests, threats);
    }, 2000);

    return () => clearInterval(interval);
  }, [requests, threats, updateStats]);

  const toggleMonitoring = () => setIsMonitoring(prev => !prev);

  const blockThreat = (threatId: string) => {
    setThreats(prev =>
      prev.map(t => t.id === threatId ? { ...t, status: 'blocked' } : t)
    );
  };

  const clearHistory = () => {
    setRequests([]);
    setThreats([]);
    processedEntries.current.clear();
    performance.clearResourceTimings();
  };

  return {
    requests,
    threats,
    stats,
    isMonitoring,
    toggleMonitoring,
    blockThreat,
    clearHistory,
  };
};
