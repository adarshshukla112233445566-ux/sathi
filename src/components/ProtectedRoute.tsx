import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { LoadingState } from "@/components/ui";

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState message="Loading your session..." />;

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  if (adminOnly && profile?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
