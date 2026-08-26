import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { authApi } from "../api/auth";
import { getToken } from "../api/client";
import type { User } from "./AuthContext";

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminPanelOpen: boolean;
  adminUser: User | null;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  openAdminPanel: () => void;
  closeAdminPanel: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  useEffect(() => {
    const onExpired = () => {
      setIsAdminAuthenticated(false);
      setAdminPanelOpen(false);
      setAdminUser(null);
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login(username, password);
      setAdminUser(res.user);
      setIsAdminAuthenticated(true);
      setAdminPanelOpen(true);
      return true;
    } catch {
      return false;
    }
  };

  const adminLogout = () => {
    authApi.logout().catch(() => {});
    setIsAdminAuthenticated(false);
    setAdminPanelOpen(false);
    setAdminUser(null);
  };

  const openAdminPanel = () => {
    const token = getToken();
    if (!token) return;
    setAdminPanelOpen(true);
  };
  const closeAdminPanel = () => setAdminPanelOpen(false);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        adminPanelOpen,
        adminUser,
        adminLogin,
        adminLogout,
        openAdminPanel,
        closeAdminPanel,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context)
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}
