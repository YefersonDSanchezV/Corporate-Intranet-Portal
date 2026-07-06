import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

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
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addAccessRecord: (moduleName: string) => void;
  addAccessRequest: (request: Omit<AccessRequest, "id" | "requestDate" | "status">) => void;
  addPasswordResetRequest: (request: Omit<PasswordResetRequest, "id" | "requestDate" | "status">) => void;
  approveAccessRequest: (id: string) => void;
  rejectAccessRequest: (id: string) => void;
  resetPassword: (id: string) => void;
  setUsers: React.Dispatch<React.SetStateAction<Record<string, User>>>;
  addUser: (user: Omit<User, "id" | "status" | "createdDate">) => void;
  toggleUserStatus: (username: string) => void;
  updateUser: (user: User) => void;
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

const INITIAL_USERS: Record<string, User> = {
  "root": {
    id: "1",
    username: "root",
    fullName: "Admin",
    identification: "123456789",
    email: "root@icvc.com.co",
    position: "Administrador de Sistemas",
    department: "Tecnología",
    role: "root",
    status: "active",
    createdDate: new Date().toISOString()
  }
};

const MOCK_DEV_USER: User = {
  id: "dev-user",
  username: "devuser",
  fullName: "Usuario DEV",
  identification: "000000000",
  email: "dev@icvc.com.co",
  position: "Usuario de Pruebas",
  department: "General",
  role: "asistencial",
  status: "active",
  createdDate: new Date().toISOString()
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Record<string, User>>(() => {
    const saved = localStorage.getItem("intranet_users");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(
    import.meta.env?.DEV !== false ? MOCK_DEV_USER : null
  );

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

  const login = (username: string, password: string): boolean => {
    const normalizedUsername = username.toLowerCase();
    const isSpecialAdmin = normalizedUsername === "root" || normalizedUsername === "admin";
    const isCorrectPassword = password === "icvc2024**";

    if (isSpecialAdmin && isCorrectPassword) {
      setCurrentUser(users["root"]);
      return true;
    }

    const foundUser = users[normalizedUsername];
    if (foundUser && !isSpecialAdmin && foundUser.status === "active") {
      if (foundUser.password && foundUser.password !== password) return false;
      setCurrentUser(foundUser);
      return true;
    }
    
    return false;
  };

  const logout = () => {
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

  const addUser = useCallback((userData: Omit<User, "id" | "status" | "createdDate">) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      status: "active",
      createdDate: new Date().toISOString()
    };
    setUsers(prev => ({
      ...prev,
      [newUser.username.toLowerCase()]: newUser
    }));
  }, []);

  const toggleUserStatus = useCallback((username: string) => {
    setUsers(prev => {
      const key = username.toLowerCase();
      const user = prev[key];
      if (!user) return prev;
      return {
        ...prev,
        [key]: { ...user, status: user.status === "active" ? "inactive" : "active" }
      };
    });
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => ({
      ...prev,
      [updatedUser.username.toLowerCase()]: updatedUser
    }));
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
