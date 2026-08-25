import React, { createContext, useContext, useState, useEffect } from 'react';
import { sitesApi } from '../api/sites';
import { directoryApi } from '../api/directory';
import { apiAvailable } from '../api/client';

export interface RedirectSite {
  id: string;
  title: string;
  url: string;
  type: "image" | "icon";
  ref: string;
  moduleId: string;
  active: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface RolePermission {
  roleId: string;
  modules: string[];
  actions: string[];
}

export interface EpsPlatform {
  id: string;
  name: string;
  url: string;
}

export interface ContractHistory {
  contractNo: string;
  type: string;
  startDate: string;
  endDate?: string;
  observation: string;
}

export interface Contract {
  id: string;
  docNumber: string;
  name: string;
  position?: string;
  contractType: string;
  startDate: string;
  endDate?: string;
  subgroup?: string;
  group?: string;
  salary?: string;
  history?: ContractHistory[];
  status: "Liquidado" | "No Liquidado";
}

export interface SupportContact {
  id: string;
  type: "email" | "extension";
  name?: string;
  position?: string;
  email?: string;
  extName?: string;
  extNumber?: string;
}

export interface ContingencyFormat {
  id: string;
  name: string;
  code: string;
  description: string;
  url: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  level: string;
  active: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  registeredBy: string;
  observations: { text: string; author: string; date: string }[];
  completed: boolean;
  createdAt: string;
}

export interface InstitutionEmail {
  id: string;
  employeeName: string;
  position: string;
  email: string;
  area: string;
  floor?: string;
}

export interface DirectoryEntry {
  id: string;
  name: string;
  extension: string;
  floor: string[];
  area?: string;
  isSupport?: boolean;
  type: "administrativo" | "asistencial";
  active: boolean;
}

interface SystemContextType {
  sites: RedirectSite[];
  setSites: React.Dispatch<React.SetStateAction<RedirectSite[]>>;
  addSite: (site: Omit<RedirectSite, 'id' | 'active'>) => void;
  updateSite: (site: RedirectSite) => void;
  toggleSiteActive: (id: string) => void;
  
  roles: Role[];
  addRole: (role: Omit<Role, 'id'>) => void;
  rolePermissions: RolePermission[];
  updateRoleModulePermissions: (roleId: string, modules: string[]) => void;
  updateRoleActionPermissions: (roleId: string, actions: string[]) => void;
  
  directory: DirectoryEntry[];
  addDirectoryEntry: (entry: Omit<DirectoryEntry, 'id' | 'active'>) => void;
  updateDirectoryEntry: (entry: DirectoryEntry) => void;
  removeDirectoryEntry: (id: string) => void;

  epsList: EpsPlatform[];
  setEpsList: React.Dispatch<React.SetStateAction<EpsPlatform[]>>;
  addEps: (eps: Omit<EpsPlatform, 'id'>) => void;
  removeEps: (id: string) => void;

  contracts: Contract[];
  addContract: (contract: Omit<Contract, 'id' | 'status'>) => void;
  updateContract: (contract: Contract) => void;

  supportContacts: SupportContact[];
  addSupportContact: (contact: Omit<SupportContact, 'id'>) => void;
  updateSupportContact: (contact: SupportContact) => void;

  contingencyFormats: ContingencyFormat[];
  addFormat: (format: Omit<ContingencyFormat, 'id'>) => void;
  removeFormat: (id: string) => void;

  achievements: Achievement[];
  addAchievement: (achievement: Omit<Achievement, 'id'>) => void;
  removeAchievement: (id: string) => void;

  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'observations'>) => void;
  updateTask: (task: Task) => void;
  addObservationToTask: (taskId: string, observation: { text: string; author: string }) => void;
  completeTask: (taskId: string) => void;

  institutionEmails: InstitutionEmail[];
  addInstitutionEmail: (email: Omit<InstitutionEmail, 'id'>) => void;
  updateInstitutionEmail: (email: InstitutionEmail) => void;
  removeInstitutionEmail: (id: string) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [sites, setSites] = useState<RedirectSite[]>(() => {
    const saved = localStorage.getItem('intranet_sites');
    if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);
    
    // Default initial sites requested by user
    return [
      { id: "s1", title: "DGH - Dinamica Gestion Hospitalaria", url: "", type: "icon", ref: "FileText", moduleId: "Inicio", active: true },
      { id: "s2", title: "Enterprise - Software de Laboratorio", url: "", type: "icon", ref: "ShieldCheck", moduleId: "Inicio", active: true },
      { id: "s3", title: "ActualPac - Software de Imagenologia", url: "", type: "icon", ref: "FileText", moduleId: "Inicio", active: true },
      { id: "s4", title: "biometric - Agenda del Personal", url: "", type: "icon", ref: "Calendar", moduleId: "Inicio", active: true },
      { id: "s5", title: "almera - Sistema de gestion de calidad", url: "", type: "icon", ref: "FileText", moduleId: "Inicio", active: true },
      { id: "s6", title: "GLPI - Mesa de ayuda TI", url: "", type: "icon", ref: "Globe", moduleId: "Soporte", active: true }
    ];
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem('intranet_roles');
    return saved ? JSON.parse(saved) : [
      { id: "r1", name: "admin", description: "Administrador Total" },
      { id: "r2", name: "root", description: "Super Usuario" },
      { id: "r3", name: "asistencial", description: "Personal Médico/Asistencial" },
      { id: "r4", name: "administrativo", description: "Personal Administrativo" }
    ];
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem('intranet_role_permissions');
    const defaultPerms: RolePermission[] = [
      {
        roleId: "r1",
        modules: ["Inicio", "Área Asistencial", "Área Administrativa", "Gestión Institucional", "Soporte", "Directorio", "Comunicaciones", "Gestión de Usuarios", "Logs", "Administrador Intranet"],
        actions: ["Registrar Directorio", "Editar Solicitudes de registros de anuncios", "Aprobar y Rechazar solicitudes de Anuncios", "Listar Usuarios", "Crear usuarios", "Solicitudes de Usuarios", "Editar Usuarios", "Reinicio de Contraseña", "Consultar Logs", "Registrar Sitios de redirección", "Actualizar sitios de redirección", "Consultar sitios de redirección", "Autorizar módulos a Usuarios", "Autorizar Acciones de Módulos a Usuarios"]
      },
      {
        roleId: "r2",
        modules: ["Inicio", "Área Asistencial", "Área Administrativa", "Gestión Institucional", "Soporte", "Directorio", "Comunicaciones", "Gestión de Usuarios", "Logs", "Administrador Intranet"],
        actions: ["Registrar Directorio", "Editar Solicitudes de registros de anuncios", "Aprobar y Rechazar solicitudes de Anuncios", "Listar Usuarios", "Crear usuarios", "Solicitudes de Usuarios", "Editar Usuarios", "Reinicio de Contraseña", "Consultar Logs", "Registrar Sitios de redirección", "Actualizar sitios de redirección", "Consultar sitios de redirección", "Autorizar módulos a Usuarios", "Autorizar Acciones de Módulos a Usuarios"]
      },
      {
        roleId: "r3",
        modules: ["Inicio", "Área Asistencial", "Directorio"],
        actions: []
      },
      {
        roleId: "r4",
        modules: ["Inicio", "Área Asistencial", "Área Administrativa", "Gestión Institucional", "Soporte", "Directorio"],
        actions: []
      }
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error parsing role permissions", e);
      }
    }
    
    return defaultPerms;
  });

  const [directory, setDirectory] = useState<DirectoryEntry[]>(() => {
    const saved = localStorage.getItem('intranet_directory');
    return saved ? JSON.parse(saved) : [];
  });

  const [epsList, setEpsList] = useState<EpsPlatform[]>(() => {
    const saved = localStorage.getItem('intranet_eps');
    return saved ? JSON.parse(saved) : [];
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('intranet_contracts');
    return saved ? JSON.parse(saved) : [];
  });

  const [supportContacts, setSupportContacts] = useState<SupportContact[]>(() => {
    const saved = localStorage.getItem('intranet_support');
    return saved ? JSON.parse(saved) : [];
  });

  const [contingencyFormats, setContingencyFormats] = useState<ContingencyFormat[]>(() => {
    const saved = localStorage.getItem('intranet_formats');
    return saved ? JSON.parse(saved) : [];
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('intranet_achievements');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('intranet_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [institutionEmails, setInstitutionEmails] = useState<InstitutionEmail[]>(() => {
    const saved = localStorage.getItem('intranet_institution_emails');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('intranet_sites', JSON.stringify(sites));
    localStorage.setItem('intranet_roles', JSON.stringify(roles));
    localStorage.setItem('intranet_role_permissions', JSON.stringify(rolePermissions));
    localStorage.setItem('intranet_directory', JSON.stringify(directory));
    localStorage.setItem('intranet_eps', JSON.stringify(epsList));
    localStorage.setItem('intranet_contracts', JSON.stringify(contracts));
    localStorage.setItem('intranet_support', JSON.stringify(supportContacts));
    localStorage.setItem('intranet_formats', JSON.stringify(contingencyFormats));
    localStorage.setItem('intranet_achievements', JSON.stringify(achievements));
    localStorage.setItem('intranet_tasks', JSON.stringify(tasks));
    localStorage.setItem('intranet_institution_emails', JSON.stringify(institutionEmails));
  }, [sites, roles, rolePermissions, directory, epsList, contracts, supportContacts, contingencyFormats, achievements, tasks, institutionEmails]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await apiAvailable())) return;
      try {
        const [siteData, extData, emailData] = await Promise.all([
          sitesApi.list(),
          directoryApi.extensions(),
          directoryApi.emails(),
        ]);
        if (cancelled) return;
        if (Array.isArray(siteData) && siteData.length > 0) setSites(siteData);
        if (Array.isArray(extData)) setDirectory(extData);
        if (Array.isArray(emailData)) setInstitutionEmails(emailData);
      } catch {
        // Backend no disponible: se mantienen los datos mock/localStorage
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addSite = (site: Omit<RedirectSite, 'id' | 'active'>) => {
    setSites(prev => [...prev, { ...site, id: Date.now().toString(), active: true }]);
  };

  const updateSite = (updatedSite: RedirectSite) => {
    setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s));
  };

  const toggleSiteActive = (id: string) => {
    setSites(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const addRole = (role: Omit<Role, 'id'>) => {
    const newId = `r-${Date.now()}`;
    setRoles(prev => [...prev, { ...role, id: newId }]);
    setRolePermissions(prev => [...prev, { roleId: newId, modules: ["Inicio"], actions: [] }]);
  };

  const updateRoleModulePermissions = (roleId: string, modules: string[]) => {
    setRolePermissions(prev => {
      const existing = prev.find(p => p.roleId === roleId);
      if (existing) {
        return prev.map(p => p.roleId === roleId ? { ...p, modules } : p);
      }
      return [...prev, { roleId, modules, actions: [] }];
    });
  };

  const updateRoleActionPermissions = (roleId: string, actions: string[]) => {
    setRolePermissions(prev => {
      const existing = prev.find(p => p.roleId === roleId);
      if (existing) {
        return prev.map(p => p.roleId === roleId ? { ...p, actions } : p);
      }
      return [...prev, { roleId, modules: [], actions }];
    });
  };

  const addDirectoryEntry = (entry: Omit<DirectoryEntry, 'id' | 'active'>) => {
    setDirectory(prev => [...prev, { ...entry, id: Date.now().toString(), active: true }]);
  };

  const updateDirectoryEntry = (updatedEntry: DirectoryEntry) => {
    setDirectory(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const removeDirectoryEntry = (id: string) => {
    setDirectory(prev => prev.filter(e => e.id !== id));
  };

  const addEps = (eps: Omit<EpsPlatform, 'id'>) => {
    setEpsList(prev => [...prev, { ...eps, id: Date.now().toString() }]);
  };

  const removeEps = (id: string) => {
    setEpsList(prev => prev.filter(e => e.id !== id));
  };

  const addContract = (contract: Omit<Contract, "id" | "status">) => {
    setContracts(prev => [...prev, { ...contract, id: Date.now().toString(), status: "No Liquidado" }]);
  };

  const updateContract = (updatedContract: Contract) => {
    setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
  };

  const addSupportContact = (contact: Omit<SupportContact, 'id'>) => {
    setSupportContacts(prev => [...prev, { ...contact, id: Date.now().toString() }]);
  };

  const updateSupportContact = (updatedContact: SupportContact) => {
    setSupportContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
  };

  const addFormat = (format: Omit<ContingencyFormat, 'id'>) => {
    setContingencyFormats(prev => [...prev, { ...format, id: Date.now().toString() }]);
  };

  const removeFormat = (id: string) => {
    setContingencyFormats(prev => prev.filter(f => f.id !== id));
  };

  const addAchievement = (achievement: Omit<Achievement, 'id'>) => {
    setAchievements(prev => [...prev, { ...achievement, id: Date.now().toString() }]);
  };

  const removeAchievement = (id: string) => {
    setAchievements(prev => prev.filter(a => a.id !== id));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'observations'>) => {
    setTasks(prev => [{
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      observations: []
    }, ...prev]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const addObservationToTask = (taskId: string, observation: { text: string; author: string }) => {
    const obs = { ...observation, date: new Date().toISOString() };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, observations: [...t.observations, obs] } : t));
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
  };

  const addInstitutionEmail = (email: Omit<InstitutionEmail, 'id'>) => {
    setInstitutionEmails(prev => [...prev, { ...email, id: Date.now().toString() }]);
  };

  const updateInstitutionEmail = (updatedEmail: InstitutionEmail) => {
    setInstitutionEmails(prev => prev.map(e => e.id === updatedEmail.id ? updatedEmail : e));
  };

  const removeInstitutionEmail = (id: string) => {
    setInstitutionEmails(prev => prev.filter(e => e.id !== id));
  };

  return (
    <SystemContext.Provider value={{
      sites, setSites, addSite, updateSite, toggleSiteActive,
      roles, addRole, rolePermissions, updateRoleModulePermissions, updateRoleActionPermissions,
      directory, addDirectoryEntry, updateDirectoryEntry, removeDirectoryEntry,
      epsList, setEpsList, addEps, removeEps,
      contracts, addContract, updateContract,
      supportContacts, addSupportContact, updateSupportContact,
      contingencyFormats, addFormat, removeFormat,
      achievements, addAchievement, removeAchievement,
      tasks, addTask, updateTask, addObservationToTask, completeTask,
      institutionEmails, addInstitutionEmail, updateInstitutionEmail, removeInstitutionEmail
    }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
