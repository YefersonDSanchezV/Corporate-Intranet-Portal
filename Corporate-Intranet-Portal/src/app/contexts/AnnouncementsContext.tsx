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
  addAnnouncement: (announcement: Omit<Announcement, "id" | "published" | "createdAt">) => void;
  publishAnnouncement: (id: string) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
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

  const addAnnouncement = (announcement: Omit<Announcement, "id" | "published" | "createdAt">) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: Date.now().toString(),
      published: false,
      createdAt: new Date()
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const publishAnnouncement = (id: string) => {
    setAnnouncements(prev =>
      prev.map(ann =>
        ann.id === id ? { ...ann, published: true } : ann
      )
    );
    // Incrementar notificaciones al publicar
    setNotificationCount(prev => prev + 1);
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  const updateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    setAnnouncements(prev =>
      prev.map(ann =>
        ann.id === id ? { ...ann, ...updates } : ann
      )
    );
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(ann => ann.id !== id));
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
