import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AlertChannelSettings {
  emailEnabled: boolean;
  emailAddress: string;
  smsEnabled: boolean;
  phoneNumber: string;
  alertOnCritical: boolean;
  alertOnHigh: boolean;
  cooldownMinutes: number; // Prevent alert spam
}

const DEFAULT_SETTINGS: AlertChannelSettings = {
  emailEnabled: false,
  emailAddress: '',
  smsEnabled: false,
  phoneNumber: '',
  alertOnCritical: true,
  alertOnHigh: false,
  cooldownMinutes: 5,
};

const STORAGE_KEY = 'sentinel-alert-channel-settings';

export interface ThreatPayload {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
  target: string;
  timestamp: string;
}

export const useAlertChannels = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AlertChannelSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [lastAlertTime, setLastAlertTime] = useState<Record<string, number>>({});
  const [isSending, setIsSending] = useState(false);

  const updateSettings = useCallback((newSettings: Partial<AlertChannelSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const shouldSendAlert = useCallback((threat: ThreatPayload): boolean => {
    // Check severity thresholds
    if (threat.severity === 'critical' && !settings.alertOnCritical) return false;
    if (threat.severity === 'high' && !settings.alertOnHigh) return false;
    if (threat.severity !== 'critical' && threat.severity !== 'high') return false;

    // Check if any channel is enabled
    if (!settings.emailEnabled && !settings.smsEnabled) return false;

    // Check cooldown to prevent spam
    const now = Date.now();
    const lastTime = lastAlertTime[threat.severity] || 0;
    const cooldownMs = settings.cooldownMinutes * 60 * 1000;
    
    if (now - lastTime < cooldownMs) {
      console.log(`[AlertChannels] Cooldown active for ${threat.severity} alerts`);
      return false;
    }

    return true;
  }, [settings, lastAlertTime]);

  const sendThreatAlert = useCallback(async (threat: ThreatPayload) => {
    if (!shouldSendAlert(threat)) {
      return { sent: false, reason: 'Alert conditions not met' };
    }

    setIsSending(true);

    try {
      const channels: Record<string, { to: string }> = {};
      
      if (settings.emailEnabled && settings.emailAddress) {
        channels.email = { to: settings.emailAddress };
      }
      
      if (settings.smsEnabled && settings.phoneNumber) {
        channels.sms = { to: settings.phoneNumber };
      }

      const payload = {
        threatType: threat.type,
        severity: threat.severity,
        description: threat.description,
        source: threat.source,
        target: threat.target,
        timestamp: threat.timestamp,
        channels,
      };

      console.log('[AlertChannels] Sending alert:', payload);

      const { data, error } = await supabase.functions.invoke('send-threat-alert', {
        body: payload,
      });

      if (error) {
        throw error;
      }

      // Update last alert time for cooldown
      setLastAlertTime(prev => ({
        ...prev,
        [threat.severity]: Date.now(),
      }));

      toast({
        title: 'Alert Sent',
        description: `${threat.severity.toUpperCase()} threat alert sent via ${Object.keys(channels).join(' & ')}`,
      });

      return { sent: true, data };
    } catch (error) {
      console.error('[AlertChannels] Failed to send alert:', error);
      
      toast({
        title: 'Alert Failed',
        description: error instanceof Error ? error.message : 'Failed to send alert',
        variant: 'destructive',
      });

      return { sent: false, error };
    } finally {
      setIsSending(false);
    }
  }, [settings, shouldSendAlert, toast]);

  const testAlertChannels = useCallback(async () => {
    const testThreat: ThreatPayload = {
      id: 'test-' + Date.now(),
      type: 'Test Alert',
      severity: 'critical',
      description: 'This is a test alert to verify your notification channels are working correctly.',
      source: '192.168.1.100',
      target: 'sentinel-dashboard',
      timestamp: new Date().toISOString(),
    };

    // Temporarily bypass cooldown for test
    const originalCheck = shouldSendAlert;
    const result = await (async () => {
      if (!settings.emailEnabled && !settings.smsEnabled) {
        toast({
          title: 'No Channels Enabled',
          description: 'Please enable at least one alert channel (email or SMS)',
          variant: 'destructive',
        });
        return { sent: false, reason: 'No channels enabled' };
      }

      setIsSending(true);

      try {
        const channels: Record<string, { to: string }> = {};
        
        if (settings.emailEnabled && settings.emailAddress) {
          channels.email = { to: settings.emailAddress };
        }
        
        if (settings.smsEnabled && settings.phoneNumber) {
          channels.sms = { to: settings.phoneNumber };
        }

        const payload = {
          threatType: testThreat.type,
          severity: testThreat.severity,
          description: testThreat.description,
          source: testThreat.source,
          target: testThreat.target,
          timestamp: testThreat.timestamp,
          channels,
        };

        const { data, error } = await supabase.functions.invoke('send-threat-alert', {
          body: payload,
        });

        if (error) {
          throw error;
        }

        toast({
          title: 'Test Alert Sent!',
          description: `Check your ${Object.keys(channels).join(' and ')} for the test notification`,
        });

        return { sent: true, data };
      } catch (error) {
        console.error('[AlertChannels] Test alert failed:', error);
        
        toast({
          title: 'Test Failed',
          description: error instanceof Error ? error.message : 'Failed to send test alert',
          variant: 'destructive',
        });

        return { sent: false, error };
      } finally {
        setIsSending(false);
      }
    })();

    return result;
  }, [settings, toast]);

  return {
    settings,
    updateSettings,
    sendThreatAlert,
    testAlertChannels,
    isSending,
    shouldSendAlert,
  };
};
