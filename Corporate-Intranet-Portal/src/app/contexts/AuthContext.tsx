import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { authApi } from "../api/auth";
import { usersApi } from "../api/users";
import { apiAvailable, getToken, clearToken } from "../api/client";

export type UserRole =
  | "admin"
  | "root"
  | "ti"
  | "coordinador_ti"
  | "sistemas"
  | "ingeniero_sistemas"
  | "comunicaciones"
  | "asistencial"
  | "coordinador_asistencial"
  | "coordinador_consulta_externa"
  | "administrativo"
  | "administrativo_rrhh"
  | "administrativo_calidad"
  | "coordinador_administrativo";

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  identification: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  role: UserRole;
  status: "active" | "inactive";
  createdDate: string;
  birthDate?: string;
}

export interface AccessRecord {
  moduleName: string;
  accessTime: Date;
  userName: string;
  userIdentification: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  accessRecords: AccessRecord[];
  accessRequests: AccessRequest[];
  passwordResetRequests: PasswordResetRequest[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addAccessRecord: (moduleName: string) => void;
  addAccessRequest: (request: Omit<AccessRequest, "id" | "requestDate" | "status">) => void;
  addPasswordResetRequest: (request: Omit<PasswordResetRequest, "id" | "requestDate" | "status">) => void;
  approveAccessRequest: (id: string) => void;
  rejectAccessRequest: (id: string) => void;
  resetPassword: (id: string) => void;
  setUsers: React.Dispatch<React.SetStateAction<Record<string, User>>>;
  addUser: (user: Omit<User, "id" | "status" | "createdDate">) => Promise<void>;
  toggleUserStatus: (username: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AccessRequest {
  id: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  phone: string;
  position: string;
  email?: string;
  requestDate: Date;
  status: "pending" | "approved" | "rejected";
}

export interface PasswordResetRequest {
  id: string;
  username: string;
  details: string;
  requestDate: Date;
  status: "pending" | "completed";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Record<string, User>>(() => {
    const saved = localStorage.getItem("intranet_users");
    // Si hay backend disponible, se sobrescribirá con datos reales; si no, queda como caché offline
    return saved ? JSON.parse(saved) : {};
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>(() => {
    const saved = localStorage.getItem("intranet_access_records");
    return saved ? JSON.parse(saved) : [];
  });

  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => {
    const saved = localStorage.getItem("intranet_access_requests");
    const data = saved ? JSON.parse(saved) : [];
    return data.map((r: any) => ({ ...r, requestDate: new Date(r.requestDate) }));
  });

  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>(() => {
    const saved = localStorage.getItem("intranet_password_reset_requests");
    const data = saved ? JSON.parse(saved) : [];
    return data.map((r: any) => ({ ...r, requestDate: new Date(r.requestDate) }));
  });

useEffect(() => localStorage.setItem("intranet_users", JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem("intranet_access_records", JSON.stringify(accessRecords)), [accessRecords]);
  useEffect(() => localStorage.setItem("intranet_access_requests", JSON.stringify(accessRequests)), [accessRequests]);
  useEffect(() => localStorage.setItem("intranet_password_reset_requests", JSON.stringify(passwordResetRequests)), [passwordResetRequests]);

  // Sincroniza usuarios con el backend (fuente de verdad). Si falla, mantiene localStorage como fallback offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await apiAvailable())) return;
      try {
        const backendUsers = await usersApi.list();
        if (cancelled) return;
        const map: Record<string, User> = {};
        backendUsers.forEach(u => { map[u.username.toLowerCase()] = u; });
        setUsers(map);
      } catch {
        // Backend no disponible: se mantiene caché local
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        if (!cancelled) setCurrentUser(me);
      } catch {
        clearToken();
      }
    })();
    const onExpired = () => setCurrentUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:expired", onExpired);
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login(username, password);
      setCurrentUser(res.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setCurrentUser(null);
  };

  const addAccessRecord = useCallback((moduleName: string) => {
    if (!currentUser) return;

    const record: AccessRecord = {
      moduleName,
      accessTime: new Date(),
      userName: currentUser.fullName,
      userIdentification: currentUser.identification
    };

    setAccessRecords(prev => [record, ...prev].slice(0, 50));
  }, [currentUser]);

  const addAccessRequest = useCallback((request: Omit<AccessRequest, "id" | "requestDate" | "status">) => {
    const newRequest: AccessRequest = {
      ...request,
      id: Date.now().toString(),
      requestDate: new Date(),
      status: "pending"
    };
    setAccessRequests(prev => [...prev, newRequest]);
  }, []);

  const addPasswordResetRequest = useCallback((request: Omit<PasswordResetRequest, "id" | "requestDate" | "status">) => {
    const newRequest: PasswordResetRequest = {
      ...request,
      id: Date.now().toString(),
      requestDate: new Date(),
      status: "pending"
    };
    setPasswordResetRequests(prev => [...prev, newRequest]);
  }, []);

  const approveAccessRequest = useCallback((id: string) => {
    setAccessRequests(prev =>
      prev.map(req => req.id === id ? { ...req, status: "approved" as const } : req)
    );
  }, []);

  const rejectAccessRequest = useCallback((id: string) => {
    setAccessRequests(prev =>
      prev.map(req => req.id === id ? { ...req, status: "rejected" as const } : req)
    );
  }, []);

  const resetPassword = useCallback((id: string) => {
    setPasswordResetRequests(prev =>
      prev.map(req => req.id === id ? { ...req, status: "completed" as const } : req)
    );
  }, []);

  const addUser = useCallback(async (userData: Omit<User, "id" | "status" | "createdDate">) => {
    try {
      const created = await usersApi.create(userData);
      setUsers(prev => ({ ...prev, [created.username.toLowerCase()]: created }));
    } catch {
      // Fallback offline: guarda en localStorage
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        status: "active",
        createdDate: new Date().toISOString()
      };
      setUsers(prev => ({ ...prev, [newUser.username.toLowerCase()]: newUser }));
    }
  }, []);

  const toggleUserStatus = useCallback(async (username: string) => {
    const key = username.toLowerCase();
    const user = users[key];
    if (!user) return;
    try {
      const updated = await usersApi.toggleStatus(username, user.status);
      setUsers(prev => ({ ...prev, [key]: updated }));
    } catch {
      setUsers(prev => {
        const u = prev[key];
        if (!u) return prev;
        return { ...prev, [key]: { ...u, status: u.status === "active" ? "inactive" : "active" } };
      });
    }
  }, [users]);

  const updateUser = useCallback(async (updatedUser: User) => {
    try {
      const updated = await usersApi.update(updatedUser);
      setUsers(prev => ({ ...prev, [updated.username.toLowerCase()]: updated }));
    } catch {
      setUsers(prev => ({ ...prev, [updatedUser.username.toLowerCase()]: updatedUser }));
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user: currentUser,
      users: Object.values(users),
      accessRecords,
      accessRequests,
      passwordResetRequests,
      login,
      logout,
      addAccessRecord,
      addAccessRequest,
      addPasswordResetRequest,
      approveAccessRequest,
      rejectAccessRequest,
      resetPassword,
      setUsers,
      addUser,
      toggleUserStatus,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
