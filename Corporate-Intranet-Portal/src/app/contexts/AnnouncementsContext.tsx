import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { announcementsApi } from "../api/announcements";
import { apiAvailable } from "../api/client";

export interface Announcement {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  published: boolean;
  createdAt: Date;
  codigo?: string;
  areaInforma?: string;
}

interface AnnouncementsContextType {
  announcements: Announcement[];
  publishedAnnouncements: Announcement[];
  notificationCount: number;
  clearNotifications: () => void;
  // Las mutaciones propagan el error del backend (ApiError) para que la vista lo muestre.
  addAnnouncement: (announcement: Omit<Announcement, "id" | "published" | "createdAt" | "codigo">, creadorOid?: string | number | null) => Promise<void>;
  publishAnnouncement: (id: string) => Promise<void>;
  rejectAnnouncement: (id: string, observation: string) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export function AnnouncementsProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('intranet_announcements');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((ann: any) => ({
        ...ann,
        startDate: new Date(ann.startDate),
        endDate: new Date(ann.endDate),
        createdAt: new Date(ann.createdAt)
      }));
    }
    return [];
  });

  const [notificationCount, setNotificationCount] = useState(() => {
    const saved = localStorage.getItem('intranet_notifications_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [nowTick, setNowTick] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNowTick(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem('intranet_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('intranet_notifications_count', notificationCount.toString());
  }, [notificationCount]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await apiAvailable())) return;
      try {
        const data = await announcementsApi.list();
        if (!cancelled && Array.isArray(data)) {
          setAnnouncements(data.map((ann) => ({
            ...ann,
            startDate: new Date(ann.startDate),
            endDate: new Date(ann.endDate),
            createdAt: new Date(ann.createdAt),
          })));
        }
      } catch {
        // Backend no disponible: se mantiene localStorage
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addAnnouncement = async (announcement: Omit<Announcement, "id" | "published" | "createdAt" | "codigo">, creadorOid?: string | number | null) => {
    const created = await announcementsApi.create(announcement as any, creadorOid ?? null);
    const withCreator: Announcement = {
      ...created,
      createdBy: created.createdBy || (announcement as any).createdBy || "Administrador",
    };
    setAnnouncements(prev => [withCreator, ...prev]);
  };

  const publishAnnouncement = async (id: string) => {
    await announcementsApi.publish(id);
    setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, published: true } : ann));
    setNotificationCount(prev => prev + 1);
  };

  const rejectAnnouncement = async (id: string, observation: string) => {
    await announcementsApi.reject(id, observation);
    setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, published: false, description: `${ann.description}\n[Rechazado: ${observation}]` } as Announcement : ann));
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    const updated = await announcementsApi.update(id, updates);
    setAnnouncements(prev => prev.map(ann => ann.id === id ? updated : ann));
  };

  const deleteAnnouncement = async (id: string) => {
    await announcementsApi.remove(id);
    setAnnouncements(prev => prev.filter(ann => ann.id !== id));
  };

  // Filtrar anuncios publicados y que estén dentro del rango de fechas (usa nowTick para refresco por minuto)
  const publishedAnnouncements = announcements.filter(ann => {
    if (!ann.published) return false;
    return nowTick >= ann.startDate && nowTick <= ann.endDate;
  });

  // Sincronizar burbuja: si expiran, bajar contador para no dejar burbuja vacía
  useEffect(() => {
    if (publishedAnnouncements.length === 0 && notificationCount !== 0) {
      setNotificationCount(0);
    } else if (notificationCount > publishedAnnouncements.length) {
      setNotificationCount(publishedAnnouncements.length);
    }
  }, [publishedAnnouncements.length]);

  return (
    <AnnouncementsContext.Provider
      value={{
        announcements,
        publishedAnnouncements,
        notificationCount,
        clearNotifications,
        addAnnouncement,
        publishAnnouncement,
        rejectAnnouncement,
        updateAnnouncement,
        deleteAnnouncement
      }}
    >
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementsContext);
  if (context === undefined) {
    throw new Error("useAnnouncements must be used within an AnnouncementsProvider");
  }
  return context;
}
