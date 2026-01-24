import { useCallback, useRef, useState } from 'react';
import { Threat } from './useThreatData';

interface NotificationSettings {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  notifyOnCritical: boolean;
  notifyOnHigh: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  browserNotificationsEnabled: true,
  notifyOnCritical: true,
  notifyOnHigh: true,
};

// Create an oscillator-based alert sound
const createAlertSound = (audioContext: AudioContext, frequency: number, duration: number, type: OscillatorType = 'sine') => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

export const useNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('sentinel-notification-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastNotificationRef = useRef<number>(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playAlertSound = useCallback((severity: 'critical' | 'high') => {
    if (!settings.soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      
      if (severity === 'critical') {
        // Urgent alarm: rapid beeps
        createAlertSound(ctx, 880, 0.15, 'square');
        setTimeout(() => createAlertSound(ctx, 880, 0.15, 'square'), 200);
        setTimeout(() => createAlertSound(ctx, 1100, 0.2, 'square'), 400);
      } else {
        // Warning: single tone
        createAlertSound(ctx, 660, 0.3, 'triangle');
      }
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  }, [settings.soundEnabled, getAudioContext]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      console.warn('Browser notifications not supported');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      setPermissionStatus('granted');
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    }
    
    return false;
  }, []);

  const sendBrowserNotification = useCallback((threat: Threat) => {
    if (!settings.browserNotificationsEnabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    
    // Throttle notifications (max 1 every 3 seconds)
    const now = Date.now();
    if (now - lastNotificationRef.current < 3000) return;
    lastNotificationRef.current = now;

    const title = threat.severity === 'critical' 
      ? '🚨 CRITICAL THREAT DETECTED' 
      : '⚠️ High Severity Threat';
    
    const body = `${threat.type.toUpperCase()}: ${threat.description}\nSource: ${threat.source} (${threat.sourceCountry})`;
    
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'threat-alert',
      requireInteraction: threat.severity === 'critical',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds for high severity
    if (threat.severity !== 'critical') {
      setTimeout(() => notification.close(), 10000);
    }
  }, [settings.browserNotificationsEnabled]);

  const notifyThreat = useCallback((threat: Threat) => {
    const shouldNotify = 
      (threat.severity === 'critical' && settings.notifyOnCritical) ||
      (threat.severity === 'high' && settings.notifyOnHigh);
    
    if (!shouldNotify || threat.status === 'blocked') return;

    playAlertSound(threat.severity as 'critical' | 'high');
    sendBrowserNotification(threat);
  }, [settings, playAlertSound, sendBrowserNotification]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('sentinel-notification-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleSound = useCallback(() => {
    // Resume audio context on user interaction
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  const toggleBrowserNotifications = useCallback(async () => {
    if (!settings.browserNotificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        updateSettings({ browserNotificationsEnabled: true });
      }
    } else {
      updateSettings({ browserNotificationsEnabled: false });
    }
  }, [settings.browserNotificationsEnabled, requestNotificationPermission, updateSettings]);

  return {
    settings,
    permissionStatus,
    notifyThreat,
    toggleSound,
    toggleBrowserNotifications,
    updateSettings,
    requestNotificationPermission,
    playAlertSound,
  };
};
