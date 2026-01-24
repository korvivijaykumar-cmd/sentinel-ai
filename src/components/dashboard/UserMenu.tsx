import { LogOut, User, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const roleConfig: Record<AppRole, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-destructive text-destructive-foreground' },
  analyst: { label: 'Analyst', color: 'bg-primary text-primary-foreground' },
  viewer: { label: 'Viewer', color: 'bg-muted text-muted-foreground' },
};

export const UserMenu = () => {
  const { user, profile, roles, signOut } = useAuth();

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const primaryRole = roles[0] || 'viewer';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-2">
            <span>Security Account</span>
            <div className="flex flex-wrap gap-1">
              {roles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className={cn('text-xs', roleConfig[role].color)}
                >
                  {roleConfig[role].label}
                </Badge>
              ))}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <User className="w-4 h-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Shield className="w-4 h-4" />
          Security Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="gap-2 text-destructive focus:text-destructive"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
