import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AdminRole } from "@medical-camp/shared";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: AdminRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { auth, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p>Checking session...</p>;
  }

  if (!auth.authenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/admin/registrations" replace />;
  }

  return <Outlet />;
};
