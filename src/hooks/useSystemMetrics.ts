import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface SystemMetric {
  id: string;
  agent_id: string;
  hostname: string;
  cpu_usage: number;
  memory_usage: number;
  memory_total: number | null;
  memory_used: number | null;
  disk_usage: number | null;
  network_in: number;
  network_out: number;
  created_at: string;
}

export interface SystemProcess {
  id: string;
  agent_id: string;
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  status: string;
  user_name: string | null;
  created_at: string;
}

export interface DetectedThreat {
  id: string;
  agent_id: string;
  threat_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  process_name: string | null;
  process_pid: number | null;
  description: string;
  source_ip: string | null;
  destination_ip: string | null;
  port: number | null;
  protocol: string | null;
  status: 'active' | 'blocked' | 'investigating' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface AgentStatus {
  agent_id: string;
  hostname: string;
  isOnline: boolean;
  lastSeen: Date;
  latestMetrics: SystemMetric | null;
}

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [processes, setProcesses] = useState<SystemProcess[]>([]);
  const [threats, setThreats] = useState<DetectedThreat[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch latest metrics (last 100)
      const { data: metricsData, error: metricsError } = await supabase
        .from('system_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (metricsError) throw metricsError;

      // Fetch current processes
      const { data: processData, error: processError } = await supabase
        .from('system_processes')
        .select('*')
        .order('cpu_percent', { ascending: false });

      if (processError) throw processError;

      // Fetch active threats
      const { data: threatData, error: threatError } = await supabase
        .from('detected_threats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (threatError) throw threatError;

      setMetrics(metricsData || []);
      setProcesses(processData || []);
      setThreats((threatData || []) as DetectedThreat[]);

      // Build agent status from metrics
      const agentMap = new Map<string, AgentStatus>();
      (metricsData || []).forEach((m: SystemMetric) => {
        if (!agentMap.has(m.agent_id)) {
          const lastSeenDate = new Date(m.created_at);
          const isOnline = Date.now() - lastSeenDate.getTime() < 60000; // 1 minute threshold
          agentMap.set(m.agent_id, {
            agent_id: m.agent_id,
            hostname: m.hostname,
            isOnline,
            lastSeen: lastSeenDate,
            latestMetrics: m,
          });
        }
      });
      setAgents(Array.from(agentMap.values()));

    } catch (err) {
      console.error('Error fetching system data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchData();

    const metricsChannel = supabase
      .channel('system_metrics_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_metrics' },
        (payload: RealtimePostgresChangesPayload<SystemMetric>) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            const newMetric = payload.new as SystemMetric;
            setMetrics(prev => [newMetric, ...prev].slice(0, 100));
            
            // Update agent status
            setAgents(prev => {
              const existing = prev.find(a => a.agent_id === newMetric.agent_id);
              if (existing) {
                return prev.map(a => 
                  a.agent_id === newMetric.agent_id
                    ? { ...a, isOnline: true, lastSeen: new Date(newMetric.created_at), latestMetrics: newMetric }
                    : a
                );
              } else {
                return [...prev, {
                  agent_id: newMetric.agent_id,
                  hostname: newMetric.hostname,
                  isOnline: true,
                  lastSeen: new Date(newMetric.created_at),
                  latestMetrics: newMetric,
                }];
              }
            });
          }
        }
      )
      .subscribe();

    const processChannel = supabase
      .channel('system_processes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_processes' },
        () => {
          // Refetch processes on any change
          supabase
            .from('system_processes')
            .select('*')
            .order('cpu_percent', { ascending: false })
            .then(({ data }) => {
              if (data) setProcesses(data);
            });
        }
      )
      .subscribe();

    const threatChannel = supabase
      .channel('detected_threats_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'detected_threats' },
        (payload: RealtimePostgresChangesPayload<DetectedThreat>) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            setThreats(prev => [payload.new as DetectedThreat, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    // Check for offline agents every 30 seconds
    const offlineCheck = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        isOnline: Date.now() - agent.lastSeen.getTime() < 60000,
      })));
    }, 30000);

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(processChannel);
      supabase.removeChannel(threatChannel);
      clearInterval(offlineCheck);
    };
  }, [fetchData]);

  const updateThreatStatus = useCallback(async (
    threatId: string, 
    status: 'active' | 'blocked' | 'investigating' | 'resolved'
  ) => {
    const updateData: { status: string; resolved_at?: string } = { status };
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('detected_threats')
      .update(updateData)
      .eq('id', threatId);

    if (error) {
      console.error('Error updating threat:', error);
      return false;
    }

    setThreats(prev => prev.map(t => 
      t.id === threatId ? { ...t, status, resolved_at: updateData.resolved_at || null } : t
    ));
    return true;
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    metrics,
    processes,
    threats,
    agents,
    isLoading,
    error,
    updateThreatStatus,
    refetch,
  };
};
