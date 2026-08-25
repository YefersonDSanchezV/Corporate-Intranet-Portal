import { createContext, useContext, useState, ReactNode } from "react";
import { DEV_CREDENTIALS } from "../utils/dev-credentials";

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminPanelOpen: boolean;
  adminLogin: (username: string, password: string) => boolean;
  adminLogout: () => void;
  openAdminPanel: () => void;
  closeAdminPanel: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  const adminLogin = (username: string, password: string): boolean => {
    const normalized = username.toLowerCase();
    const isValid =
      DEV_CREDENTIALS.allowedUsernames.includes(normalized) &&
      password === DEV_CREDENTIALS.password;
    if (isValid) {
      setIsAdminAuthenticated(true);
      setAdminPanelOpen(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPanelOpen(false);
  };

  const openAdminPanel = () => setAdminPanelOpen(true);
  const closeAdminPanel = () => setAdminPanelOpen(false);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        adminPanelOpen,
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
