import { Shield, Power, Activity, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NotificationSettings } from './NotificationSettings';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useSidebar } from '@/components/ui/sidebar';

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
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-9 w-9"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            
            {isMobile && (
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-sm font-bold text-gradient-cyber">SENTINEL</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
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
            
            <ThemeToggle />

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
