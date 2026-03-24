import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api } from "../lib/api";

export const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let ignore = false;

    const checkAuth = async () => {
      try {
        const auth = await api.getAuthStatus();
        if (!ignore) {
          setIsAuthenticated(auth.authenticated);
        }
      } catch {
        if (!ignore) {
          setIsAuthenticated(false);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading) {
    return <p>Checking session...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
