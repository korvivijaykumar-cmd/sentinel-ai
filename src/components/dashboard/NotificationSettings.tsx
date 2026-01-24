import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NotificationSettingsProps {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  notifyOnCritical: boolean;
  notifyOnHigh: boolean;
  permissionStatus: NotificationPermission;
  onToggleSound: () => void;
  onToggleBrowserNotifications: () => void;
  onUpdateSettings: (settings: { notifyOnCritical?: boolean; notifyOnHigh?: boolean }) => void;
  onTestSound: () => void;
}

export const NotificationSettings = ({
  soundEnabled,
  browserNotificationsEnabled,
  notifyOnCritical,
  notifyOnHigh,
  permissionStatus,
  onToggleSound,
  onToggleBrowserNotifications,
  onUpdateSettings,
  onTestSound,
}: NotificationSettingsProps) => {
  const isAnyEnabled = soundEnabled || browserNotificationsEnabled;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'relative',
            isAnyEnabled && 'border-primary/50'
          )}
        >
          {isAnyEnabled ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          {isAnyEnabled && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">Alert Notifications</h4>
            <p className="text-xs text-muted-foreground">
              Configure how you receive threat alerts
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="sound" className="text-sm">Sound Alerts</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onTestSound}
                  className="h-7 text-xs"
                  disabled={!soundEnabled}
                >
                  Test
                </Button>
                <Switch
                  id="sound"
                  checked={soundEnabled}
                  onCheckedChange={onToggleSound}
                />
              </div>
            </div>
            
            {/* Browser Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className={cn(
                  'h-4 w-4',
                  browserNotificationsEnabled ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div>
                  <Label htmlFor="browser" className="text-sm">Browser Notifications</Label>
                  {permissionStatus === 'denied' && (
                    <p className="text-xs text-destructive">Permission denied</p>
                  )}
                </div>
              </div>
              <Switch
                id="browser"
                checked={browserNotificationsEnabled}
                onCheckedChange={onToggleBrowserNotifications}
                disabled={permissionStatus === 'denied'}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Alert Levels
            </Label>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                <Label htmlFor="critical" className="text-sm">Critical Threats</Label>
              </div>
              <Switch
                id="critical"
                checked={notifyOnCritical}
                onCheckedChange={(checked) => onUpdateSettings({ notifyOnCritical: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive/70" />
                <Label htmlFor="high" className="text-sm">High Severity</Label>
              </div>
              <Switch
                id="high"
                checked={notifyOnHigh}
                onCheckedChange={(checked) => onUpdateSettings({ notifyOnHigh: checked })}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
