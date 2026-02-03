import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoredThreat {
  id: string;
  agent_id: string;
  threat_type: string;
  severity: string;
  description: string;
  source_ip: string | null;
  destination_ip: string | null;
  port: number | null;
  protocol: string | null;
  process_name: string | null;
  process_pid: number | null;
  status: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ThreatHistoryStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  active: number;
  blocked: number;
  resolved: number;
}

export const useThreatHistory = () => {
  const [threats, setThreats] = useState<StoredThreat[]>([]);
  const [stats, setStats] = useState<ThreatHistoryStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    active: 0,
    blocked: 0,
    resolved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchThreats = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('detected_threats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const threatData = data || [];
      setThreats(threatData);

      // Calculate stats
      const newStats: ThreatHistoryStats = {
        total: threatData.length,
        critical: threatData.filter(t => t.severity === 'critical').length,
        high: threatData.filter(t => t.severity === 'high').length,
        medium: threatData.filter(t => t.severity === 'medium').length,
        low: threatData.filter(t => t.severity === 'low').length,
        active: threatData.filter(t => t.status === 'active').length,
        blocked: threatData.filter(t => t.status === 'blocked').length,
        resolved: threatData.filter(t => t.resolved_at !== null).length,
      };
      setStats(newStats);
    } catch (err) {
      console.error('[ThreatHistory] Error fetching threats:', err);
      toast({
        title: 'Error',
        description: 'Failed to load threat history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateThreatStatus = useCallback(async (threatId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('detected_threats')
        .update({ 
          status,
          resolved_at: status === 'blocked' || status === 'resolved' ? new Date().toISOString() : null 
        })
        .eq('id', threatId);

      if (error) throw error;

      // Update local state
      setThreats(prev => 
        prev.map(t => 
          t.id === threatId 
            ? { ...t, status, resolved_at: status === 'blocked' || status === 'resolved' ? new Date().toISOString() : null }
            : t
        )
      );

      toast({
        title: 'Success',
        description: `Threat ${status === 'blocked' ? 'blocked' : 'updated'} successfully`,
      });

      return true;
    } catch (err) {
      console.error('[ThreatHistory] Error updating threat:', err);
      toast({
        title: 'Error',
        description: 'Failed to update threat status',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const deleteThreat = useCallback(async (threatId: string) => {
    try {
      // Note: DELETE is not allowed by RLS, so we'll mark as resolved instead
      await updateThreatStatus(threatId, 'resolved');
      return true;
    } catch (err) {
      console.error('[ThreatHistory] Error deleting threat:', err);
      return false;
    }
  }, [updateThreatStatus]);

  // Initial fetch
  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('threat-history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detected_threats',
        },
        (payload) => {
          console.log('[ThreatHistory] New threat detected:', payload);
          setThreats(prev => [payload.new as StoredThreat, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'detected_threats',
        },
        (payload) => {
          setThreats(prev => 
            prev.map(t => t.id === payload.new.id ? payload.new as StoredThreat : t)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    threats,
    stats,
    isLoading,
    fetchThreats,
    updateThreatStatus,
    deleteThreat,
  };
};
