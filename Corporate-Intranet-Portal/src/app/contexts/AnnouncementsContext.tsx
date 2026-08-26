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
}

interface AnnouncementsContextType {
  announcements: Announcement[];
  publishedAnnouncements: Announcement[];
  notificationCount: number;
  clearNotifications: () => void;
  addAnnouncement: (announcement: Omit<Announcement, "id" | "published" | "createdAt">) => Promise<void>;
  publishAnnouncement: (id: string) => Promise<void>;
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
        if (!cancelled) {
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

  const addAnnouncement = async (announcement: Omit<Announcement, "id" | "published" | "createdAt">) => {
    try {
      const created = await announcementsApi.create(announcement);
      setAnnouncements(prev => [created, ...prev]);
    } catch {
      const newAnnouncement: Announcement = {
        ...announcement,
        id: Date.now().toString(),
        published: false,
        createdAt: new Date()
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    }
  };

  const publishAnnouncement = async (id: string) => {
    try {
      await announcementsApi.publish(id);
      setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, published: true } : ann));
      setNotificationCount(prev => prev + 1);
    } catch {
      setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, published: true } : ann));
      setNotificationCount(prev => prev + 1);
    }
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      const updated = await announcementsApi.update(id, updates);
      setAnnouncements(prev => prev.map(ann => ann.id === id ? updated : ann));
    } catch {
      setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, ...updates } : ann));
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await announcementsApi.remove(id);
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
    } catch {
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
    }
  };

  // Filtrar anuncios publicados y que estén dentro del rango de fechas
  const publishedAnnouncements = announcements.filter(ann => {
    if (!ann.published) return false;
    const now = new Date();
    return now >= ann.startDate && now <= ann.endDate;
  });

  return (
    <AnnouncementsContext.Provider
      value={{
        announcements,
        publishedAnnouncements,
        notificationCount,
        clearNotifications,
        addAnnouncement,
        publishAnnouncement,
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
