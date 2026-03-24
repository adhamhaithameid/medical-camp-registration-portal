import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthResult } from "@medical-camp/shared";
import { api } from "../lib/api";

interface AuthContextValue {
  auth: AuthResult;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthResult>({ authenticated: false });
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const status = await api.getAuthStatus();
      setAuth(status);
    } catch {
      setAuth({ authenticated: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await api.login({ username, password });
      setAuth(result);
    },
    []
  );

  const logout = useCallback(async () => {
    await api.logout();
    setAuth({ authenticated: false });
  }, []);

  const value = useMemo(
    () => ({
      auth,
      isLoading,
      refreshAuth,
      login,
      logout
    }),
    [auth, isLoading, refreshAuth, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
