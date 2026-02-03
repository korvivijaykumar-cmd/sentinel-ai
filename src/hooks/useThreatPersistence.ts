import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealThreat } from './useRealTrafficMonitor';

export const useThreatPersistence = () => {
  const saveThreatToDatabase = useCallback(async (threat: RealThreat) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      // Map RealThreat to detected_threats table schema
      const threatData = {
        agent_id: session?.session?.user?.id || 'browser-agent',
        threat_type: threat.type,
        severity: threat.severity,
        description: threat.description,
        source_ip: threat.source,
        destination_ip: threat.target,
        status: threat.status,
        protocol: 'HTTPS',
      };

      const { error } = await supabase
        .from('detected_threats')
        .insert(threatData);

      if (error) {
        console.error('[ThreatPersistence] Failed to save threat:', error);
        return false;
      }

      console.log('[ThreatPersistence] Threat saved to database:', threat.id);
      return true;
    } catch (err) {
      console.error('[ThreatPersistence] Error saving threat:', err);
      return false;
    }
  }, []);

  const updateThreatStatus = useCallback(async (threatId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('detected_threats')
        .update({ 
          status,
          resolved_at: status === 'blocked' ? new Date().toISOString() : null 
        })
        .eq('id', threatId);

      if (error) {
        console.error('[ThreatPersistence] Failed to update threat status:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[ThreatPersistence] Error updating threat:', err);
      return false;
    }
  }, []);

  return {
    saveThreatToDatabase,
    updateThreatStatus,
  };
};
