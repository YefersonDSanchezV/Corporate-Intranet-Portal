import React, { createContext, useContext, useState, useEffect } from 'react';
import { sitesApi } from '../api/sites';
import { directoryApi } from '../api/directory';
import { tasksApi } from '../api/tasks';
import { achievementsApi } from '../api/achievements';
import { apiAvailable, apiFetch } from '../api/client';
import { CONTROL_PANEL_ALL_PERMISSION_IDS } from '../components/admin/rbac';

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
  estado?: boolean;
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
  addSite: (site: Omit<RedirectSite, 'id' | 'active'>) => Promise<void>;
  updateSite: (site: RedirectSite) => Promise<void>;
  removeSite: (id: string) => Promise<void>;
  toggleSiteActive: (id: string) => Promise<void>;
  
  roles: Role[];
  addRole: (role: Omit<Role, 'id'>) => Promise<void>;
  toggleRoleEstado: (id: string) => Promise<void>;
  rolePermissions: RolePermission[];
  updateRoleModulePermissions: (roleId: string, modules: string[]) => void;
  updateRoleActionPermissions: (roleId: string, actions: string[]) => void;
  
  directory: DirectoryEntry[];
  addDirectoryEntry: (entry: Omit<DirectoryEntry, 'id' | 'active'>) => Promise<void>;
  updateDirectoryEntry: (entry: DirectoryEntry) => Promise<void>;
  removeDirectoryEntry: (id: string) => Promise<void>;

  epsList: EpsPlatform[];
  setEpsList: React.Dispatch<React.SetStateAction<EpsPlatform[]>>;
  addEps: (eps: Omit<EpsPlatform, 'id'>) => void;
  removeEps: (id: string) => void;

  contracts: Contract[];
  addContract: (contract: Omit<Contract, "id" | "status">) => void;
  updateContract: (contract: Contract) => void;

  supportContacts: SupportContact[];
  addSupportContact: (contact: Omit<SupportContact, 'id'>) => void;
  updateSupportContact: (contact: SupportContact) => void;

  contingencyFormats: ContingencyFormat[];
  addFormat: (format: Omit<ContingencyFormat, 'id'>) => void;
  removeFormat: (id: string) => void;

  achievements: Achievement[];
  addAchievement: (achievement: Omit<Achievement, 'id'>) => Promise<void>;
  removeAchievement: (id: string) => Promise<void>;

  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'observations'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  addObservationToTask: (taskId: string, observation: { text: string; author: string }) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;

  institutionEmails: InstitutionEmail[];
  addInstitutionEmail: (email: Omit<InstitutionEmail, 'id'>) => Promise<void>;
  updateInstitutionEmail: (email: InstitutionEmail) => Promise<void>;
  removeInstitutionEmail: (id: string) => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [sites, setSites] = useState<RedirectSite[]>(() => {
    const saved = localStorage.getItem('intranet_sites');
    return saved ? JSON.parse(saved) : [];
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem('intranet_roles');
    return saved ? JSON.parse(saved) : [];
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem('intranet_role_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Error parsing role permissions", e);
      }
    }
    return [];
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
        const [siteData, extData, emailData, taskData, achData, cargoData] = await Promise.all([
          sitesApi.list().catch(() => null),
          directoryApi.extensions().catch(() => null),
          directoryApi.emails().catch(() => null),
          tasksApi.list().catch(() => null),
          achievementsApi.list().catch(() => null),
          apiFetch<{ oid: number; nombre: string; estado: boolean }[]>("/cargos").catch(() => null),
        ]);
        if (cancelled) return;
        // Si el backend responde (aunque sea []), sincroniza y limpia localStorage viejo
        if (Array.isArray(siteData)) setSites(siteData);
        if (Array.isArray(extData)) setDirectory(extData);
        if (Array.isArray(emailData)) setInstitutionEmails(emailData);
        if (Array.isArray(taskData)) setTasks(taskData);
        if (Array.isArray(achData)) setAchievements(achData);
        if (Array.isArray(cargoData)) {
          const mappedRoles: Role[] = cargoData.map(c => ({ id: String(c.oid), name: c.nombre, description: c.nombre, estado: c.estado }));
          setRoles(mappedRoles);
          setRolePermissions(curr => {
            const next = [...curr];
            let updated = false;
            mappedRoles.forEach(r => {
              const existing = next.find(p => p.roleId === r.id);
              const isAdmin = r.name.toLowerCase() === 'administrador';
              if (!existing) {
                next.push({
                  roleId: r.id,
                  modules: isAdmin ? CONTROL_PANEL_ALL_PERMISSION_IDS : ["Inicio"],
                  actions: isAdmin ? ["Registrar Directorio", "Editar Solicitudes de registros de anuncios", "Aprobar y Rechazar solicitudes de Anuncios", "Listar Usuarios", "Crear usuarios", "Solicitudes de Usuarios", "Editar Usuarios", "Reinicio de Contraseña", "Consultar Logs", "Registrar Sitios de redirección", "Actualizar sitios de redirección", "Consultar sitios de redirección", "Autorizar módulos a Usuarios", "Autorizar Acciones de Módulos a Usuarios"] : []
                });
                updated = true;
              } else if (isAdmin) {
                const merged = [...new Set([...existing.modules, ...CONTROL_PANEL_ALL_PERMISSION_IDS])];
                if (merged.length !== existing.modules.length) {
                  existing.modules = merged;
                  updated = true;
                }
                existing.actions = ["Registrar Directorio", "Editar Solicitudes de registros de anuncios", "Aprobar y Rechazar solicitudes de Anuncios", "Listar Usuarios", "Crear usuarios", "Solicitudes de Usuarios", "Editar Usuarios", "Reinicio de Contraseña", "Consultar Logs", "Registrar Sitios de redirección", "Actualizar sitios de redirección", "Consultar sitios de redirección", "Autorizar módulos a Usuarios", "Autorizar Acciones de Módulos a Usuarios"];
              }
            });
            // Limpiar permisos de roles que ya no existen
            const filtered = next.filter(p => mappedRoles.some(r => r.id === p.roleId));
            return filtered.length !== next.length || updated ? filtered : next;
          });
        }
      } catch {
        // Backend no disponible: se mantienen los datos mock/localStorage
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addSite = async (site: Omit<RedirectSite, 'id' | 'active'>) => {
    const created = await sitesApi.create(site);
    setSites(prev => [...prev, created]);
  };

  const updateSite = async (updatedSite: RedirectSite) => {
    const updated = await sitesApi.update(updatedSite);
    setSites(prev => prev.map(s => s.id === updatedSite.id ? updated : s));
  };

  const toggleSiteActive = async (id: string) => {
    await sitesApi.toggleActive(id);
    setSites(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const removeSite = async (id: string) => {
    await sitesApi.remove(id);
    setSites(prev => prev.filter(s => s.id !== id));
  };

  const addRole = async (role: Omit<Role, 'id'>) => {
    const displayName = role.description || role.name;
    try {
      const created = await apiFetch<{ oid: number; nombre: string; estado: boolean }>("/cargos", { method: "POST", body: { nombre: displayName } });
      const newRole: Role = { id: String(created.oid), name: created.nombre, description: created.nombre, estado: created.estado };
      setRoles(prev => [...prev, newRole]);
      setRolePermissions(prev => [...prev, { roleId: newRole.id, modules: ["Inicio"], actions: [] }]);
    } catch {
      const newId = `r-${Date.now()}`;
      setRoles(prev => [...prev, { ...role, id: newId, estado: true }]);
      setRolePermissions(prev => [...prev, { roleId: newId, modules: ["Inicio"], actions: [] }]);
    }
  };

  const toggleRoleEstado = async (id: string) => {
    const role = roles.find(r => r.id === id);
    if (!role) return;
    const previo = role.estado !== false;
    // Optimistic update
    setRoles(prev => prev.map(r => r.id === id ? { ...r, estado: !previo } : r));
    try {
      await apiFetch(`/cargos/${id}/estado`, { method: "PATCH" });
    } catch {
      // Revertir si falla
      setRoles(prev => prev.map(r => r.id === id ? { ...r, estado: previo } : r));
    }
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

  const addDirectoryEntry = async (entry: Omit<DirectoryEntry, 'id' | 'active'>) => {
    const created = await directoryApi.createExtension(entry);
    setDirectory(prev => [...prev, created]);
  };

  const updateDirectoryEntry = async (updatedEntry: DirectoryEntry) => {
    const updated = await directoryApi.updateExtension(updatedEntry);
    setDirectory(prev => prev.map(e => e.id === updatedEntry.id ? updated : e));
  };

  const removeDirectoryEntry = async (id: string) => {
    await directoryApi.deleteExtension(id);
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

  const addAchievement = async (achievement: Omit<Achievement, 'id'>) => {
    try {
      const created = await achievementsApi.create(achievement);
      setAchievements(prev => [...prev, created]);
    } catch {
      setAchievements(prev => [...prev, { ...achievement, id: Date.now().toString() }]);
    }
  };

  const removeAchievement = async (id: string) => {
    try {
      await achievementsApi.remove(id);
      setAchievements(prev => prev.filter(a => a.id !== id));
    } catch {
      setAchievements(prev => prev.filter(a => a.id !== id));
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'observations'>) => {
    try {
      const created = await tasksApi.create(task);
      setTasks(prev => [created, ...prev]);
    } catch {
      setTasks(prev => [{
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        completed: false,
        observations: []
      }, ...prev]);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      const updated = await tasksApi.update(updatedTask);
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updated : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
  };

  const addObservationToTask = async (taskId: string, observation: { text: string; author: string }) => {
    try {
      await tasksApi.addComment(taskId, observation);
      const obs = { ...observation, date: new Date().toISOString() };
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, observations: [...t.observations, obs] } : t));
    } catch {
      const obs = { ...observation, date: new Date().toISOString() };
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, observations: [...t.observations, obs] } : t));
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      await tasksApi.complete(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    }
  };

  const addInstitutionEmail = async (email: Omit<InstitutionEmail, 'id'>) => {
    const created = await directoryApi.createEmail(email);
    setInstitutionEmails(prev => [...prev, created]);
  };

  const updateInstitutionEmail = async (updatedEmail: InstitutionEmail) => {
    const updated = await directoryApi.updateEmail(updatedEmail);
    setInstitutionEmails(prev => prev.map(e => e.id === updatedEmail.id ? updated : e));
  };

  const removeInstitutionEmail = async (id: string) => {
    await directoryApi.deleteEmail(id);
    setInstitutionEmails(prev => prev.filter(e => e.id !== id));
  };

  return (
    <SystemContext.Provider value={{
      sites, setSites, addSite, updateSite, removeSite, toggleSiteActive,
      roles, addRole, toggleRoleEstado, rolePermissions, updateRoleModulePermissions, updateRoleActionPermissions,
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
