import { Shield, Power, Settings, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NotificationSettings } from './NotificationSettings';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  notificationProps?: {
    soundEnabled: boolean;
    browserNotificationsEnabled: boolean;
    notifyOnCritical: boolean;
    notifyOnHigh: boolean;
    permissionStatus: NotificationPermission;
    onToggleSound: () => void;
    onToggleBrowserNotifications: () => void;
    onUpdateSettings: (settings: { notifyOnCritical?: boolean; notifyOnHigh?: boolean }) => void;
    onTestSound: () => void;
  };
}

export const Header = ({ isMonitoring, onToggleMonitoring, notificationProps }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              <span className={cn(
                'absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full',
                isMonitoring ? 'bg-success animate-pulse' : 'bg-muted-foreground'
              )} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gradient-cyber">SENTINEL</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">AI Threat Detection System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <div className={cn(
              'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
              isMonitoring 
                ? 'bg-success/10 text-success' 
                : 'bg-muted text-muted-foreground'
            )}>
              <Activity className={cn('w-4 h-4', isMonitoring && 'animate-pulse')} />
              {isMonitoring ? 'Active Monitoring' : 'Monitoring Paused'}
            </div>
            
            <Button
              variant={isMonitoring ? 'destructive' : 'default'}
              size="sm"
              onClick={onToggleMonitoring}
              className="gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <Power className="w-4 h-4" />
              <span className="hidden sm:inline">{isMonitoring ? 'Stop' : 'Start'}</span>
            </Button>
            
            {notificationProps && (
              <NotificationSettings {...notificationProps} />
            )}
            
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Settings className="w-5 h-5" />
            </Button>

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
