import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth, AppRole } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

export const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, roles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-muted-foreground">Verifying security clearance...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <Shield className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have the required security clearance to access this area.
            </p>
            <p className="text-sm text-muted-foreground">
              Required role: {requiredRoles.join(' or ')}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
