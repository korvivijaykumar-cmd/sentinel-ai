import { useEffect, useRef } from 'react';
import { useAlertChannels, ThreatPayload } from './useAlertChannels';
import { RealThreat } from './useRealTrafficMonitor';

/**
 * Hook that connects threat detection to external alert channels.
 * Use this in the main dashboard or monitoring components to automatically
 * trigger email/SMS alerts when critical threats are detected.
 */
export const useThreatAlertIntegration = () => {
  const { sendThreatAlert, settings, shouldSendAlert } = useAlertChannels();
  const pendingAlerts = useRef<Set<string>>(new Set());

  const handleNewThreat = async (threat: RealThreat) => {
    // Convert RealThreat to ThreatPayload format
    const payload: ThreatPayload = {
      id: threat.id,
      type: threat.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      severity: threat.severity,
      description: threat.description,
      source: threat.source,
      target: threat.target,
      timestamp: threat.timestamp.toISOString(),
    };

    // Check if we should send an alert and if it's not already pending
    if (!pendingAlerts.current.has(threat.id) && shouldSendAlert(payload)) {
      pendingAlerts.current.add(threat.id);
      
      try {
        await sendThreatAlert(payload);
      } finally {
        // Remove from pending after a delay to prevent duplicate alerts
        setTimeout(() => {
          pendingAlerts.current.delete(threat.id);
        }, 60000); // Keep in pending for 1 minute
      }
    }
  };

  return {
    handleNewThreat,
    alertsEnabled: settings.emailEnabled || settings.smsEnabled,
    settings,
  };
};
