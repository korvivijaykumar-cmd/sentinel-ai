import { useState, useEffect, useCallback, useRef } from 'react';

export interface Threat {
  id: string;
  type: 'malware' | 'intrusion' | 'ddos' | 'phishing' | 'ransomware' | 'botnet';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  sourceCountry: string;
  target: string;
  timestamp: Date;
  status: 'active' | 'blocked' | 'investigating';
  description: string;
  port?: number;
  protocol?: string;
}

export interface NetworkPacket {
  id: string;
  timestamp: Date;
  source: string;
  destination: string;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH';
  size: number;
  status: 'normal' | 'suspicious' | 'blocked';
}

export interface ThreatStats {
  totalThreats: number;
  blockedThreats: number;
  activeThreats: number;
  criticalThreats: number;
  packetsAnalyzed: number;
  threatsByType: Record<string, number>;
  threatsBySeverity: Record<string, number>;
}

const threatTypes: Threat['type'][] = ['malware', 'intrusion', 'ddos', 'phishing', 'ransomware', 'botnet'];
const severities: Threat['severity'][] = ['critical', 'high', 'medium', 'low'];
const countries = ['Russia', 'China', 'North Korea', 'Iran', 'Brazil', 'Unknown'];
const protocols: NetworkPacket['protocol'][] = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'SSH'];

const generateRandomIP = () => 
  `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

const generateThreat = (): Threat => ({
  id: crypto.randomUUID(),
  type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
  severity: severities[Math.floor(Math.random() * severities.length)],
  source: generateRandomIP(),
  sourceCountry: countries[Math.floor(Math.random() * countries.length)],
  target: `192.168.1.${Math.floor(Math.random() * 255)}`,
  timestamp: new Date(),
  status: Math.random() > 0.3 ? 'blocked' : Math.random() > 0.5 ? 'active' : 'investigating',
  description: `Detected ${threatTypes[Math.floor(Math.random() * threatTypes.length)]} attempt from external source`,
  port: Math.floor(Math.random() * 65535),
  protocol: protocols[Math.floor(Math.random() * protocols.length)],
});

const generatePacket = (): NetworkPacket => ({
  id: crypto.randomUUID(),
  timestamp: new Date(),
  source: generateRandomIP(),
  destination: `192.168.1.${Math.floor(Math.random() * 255)}`,
  protocol: protocols[Math.floor(Math.random() * protocols.length)],
  size: Math.floor(Math.random() * 10000) + 100,
  status: Math.random() > 0.95 ? 'blocked' : Math.random() > 0.85 ? 'suspicious' : 'normal',
});

export const useThreatData = (onNewThreat?: (threat: Threat) => void) => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [stats, setStats] = useState<ThreatStats>({
    totalThreats: 0,
    blockedThreats: 0,
    activeThreats: 0,
    criticalThreats: 0,
    packetsAnalyzed: 0,
    threatsByType: {},
    threatsBySeverity: {},
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const onNewThreatRef = useRef(onNewThreat);
  
  // Keep callback ref updated
  useEffect(() => {
    onNewThreatRef.current = onNewThreat;
  }, [onNewThreat]);

  const calculateStats = useCallback((currentThreats: Threat[], packetsCount: number) => {
    const threatsByType: Record<string, number> = {};
    const threatsBySeverity: Record<string, number> = {};
    
    currentThreats.forEach(threat => {
      threatsByType[threat.type] = (threatsByType[threat.type] || 0) + 1;
      threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1;
    });

    setStats({
      totalThreats: currentThreats.length,
      blockedThreats: currentThreats.filter(t => t.status === 'blocked').length,
      activeThreats: currentThreats.filter(t => t.status === 'active').length,
      criticalThreats: currentThreats.filter(t => t.severity === 'critical').length,
      packetsAnalyzed: packetsCount,
      threatsByType,
      threatsBySeverity,
    });
  }, []);

  useEffect(() => {
    // Initialize with some data
    const initialThreats = Array.from({ length: 15 }, generateThreat);
    const initialPackets = Array.from({ length: 50 }, generatePacket);
    setThreats(initialThreats);
    setPackets(initialPackets);
    calculateStats(initialThreats, initialPackets.length);
  }, [calculateStats]);

  useEffect(() => {
    if (!isMonitoring) return;

    // Simulate real-time threat detection
    const threatInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newThreat = generateThreat();
        setThreats(prev => {
          const updated = [newThreat, ...prev].slice(0, 100);
          calculateStats(updated, packets.length);
          return updated;
        });
        // Notify about new threat
        onNewThreatRef.current?.(newThreat);
      }
    }, 3000);

    // Simulate network packet analysis
    const packetInterval = setInterval(() => {
      const newPackets = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, generatePacket);
      setPackets(prev => [...newPackets, ...prev].slice(0, 200));
    }, 500);

    return () => {
      clearInterval(threatInterval);
      clearInterval(packetInterval);
    };
  }, [isMonitoring, packets.length, calculateStats]);

  const toggleMonitoring = () => setIsMonitoring(prev => !prev);

  const blockThreat = (threatId: string) => {
    setThreats(prev => 
      prev.map(t => t.id === threatId ? { ...t, status: 'blocked' } : t)
    );
  };

  return {
    threats,
    packets,
    stats,
    isMonitoring,
    toggleMonitoring,
    blockThreat,
  };
};
