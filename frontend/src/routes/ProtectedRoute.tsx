import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Role } from "@/features/auth/AuthContext";

interface ProtectedRouteProps {
  /** If omitted, any authenticated user (any role) may access the route. */
  allowedRoles?: Role[];
}

/**
 * Layout-style route guard (renders <Outlet /> for its children).
 * Three outcomes:
 *  - still resolving session/profile -> show a loading state
 *  - no session -> redirect to /login
 *  - session exists but role isn't allowed -> redirect to /unauthorized
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
