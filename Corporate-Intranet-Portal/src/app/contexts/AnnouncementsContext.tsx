import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { announcementsApi } from "../api/announcements";
import { apiAvailable } from "../api/client";
import { mapAnuncioToFE, type BackendAnuncioResponse } from "../api/mappers";

export interface Announcement {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  published: boolean;
  estado?: string; // PENDIENTE, PUBLICADO, RECHAZADO
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

// Caché persistente id -> nombre del creador. Una vez que se conoce el creador de un
// anuncio, ese nombre no se pierde aunque el backend deje de informarlo.
const CREATORS_KEY = 'intranet_announcement_creators';

function loadCreatorCache(): Record<string, string> {
  try {
    const saved = localStorage.getItem(CREATORS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function rememberCreator(id: string | undefined, name: string | undefined) {
  if (!id || !name) return;
  try {
    const cache = loadCreatorCache();
    if (cache[id] === name) return;
    cache[id] = name;
    localStorage.setItem(CREATORS_KEY, JSON.stringify(cache));
  } catch {
    // almacenamiento no disponible
  }
}

function resolveCreator(id: string | undefined, name: string | undefined): string {
  if (name) {
    rememberCreator(id, name);
    return name;
  }
  try {
    const cached = id ? loadCreatorCache()[id] : undefined;
    return cached || "";
  } catch {
    return "";
  }
}

// Descarta entradas corruptas (p. ej. respuestas sin mapear guardadas antes del fix)
// para que nunca rompan el render con pantalla en blanco.
function sanitizeAnnouncements(raw: unknown): Announcement[] {
  if (!Array.isArray(raw)) return [];
  const out: Announcement[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const ann = item as any;
    try {
      const start = new Date(ann.startDate);
      const end = new Date(ann.endDate);
      const created = new Date(ann.createdAt);
      if (!ann.id || !ann.title || isNaN(start.getTime()) || isNaN(end.getTime())) continue;
      out.push({
        ...ann,
        startDate: start,
        endDate: end,
        createdAt: isNaN(created.getTime()) ? new Date() : created,
        createdBy: resolveCreator(ann.id, ann.createdBy),
      });
    } catch {
      // omitir entrada corrupta
    }
  }
  return out;
}

// Mapea el DTO del backend; si la respuesta no trae el anuncio, aplica el fallback local.
// El nombre del creador nunca se borra: si el backend no lo informa se conserva el previo.
function fromDto(dto: unknown, fallback: Announcement): Announcement {
  try {
    if (dto && typeof dto === "object" && (dto as any).oid !== undefined) {
      const mapped = mapAnuncioToFE(dto as BackendAnuncioResponse);
      mapped.createdBy = resolveCreator(mapped.id, mapped.createdBy || fallback.createdBy);
      return mapped;
    }
  } catch {
    // usar fallback
  }
  return fallback;
}

export function AnnouncementsProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem('intranet_announcements');
      if (saved) return sanitizeAnnouncements(JSON.parse(saved));
    } catch {
      // almacenamiento corrupto: empezar vacío
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
          // sanitizeAnnouncements conserva el creador conocido (caché) si el backend no lo informa.
          setAnnouncements(sanitizeAnnouncements(data.map((ann) => ({
            ...ann,
            startDate: new Date(ann.startDate),
            endDate: new Date(ann.endDate),
            createdAt: new Date(ann.createdAt),
          }))));
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
      createdBy: resolveCreator(created.id, created.createdBy || (announcement as any).createdBy || "Administrador"),
    };
    setAnnouncements(prev => [withCreator, ...prev]);
    return withCreator;
  };

  const publishAnnouncement = async (id: string) => {
    const dto = await announcementsApi.publish(id);
    setAnnouncements(prev => prev.map(ann => ann.id === id ? fromDto(dto, { ...ann, published: true, estado: "PUBLICADO" }) : ann));
    setNotificationCount(prev => prev + 1);
  };

  const rejectAnnouncement = async (id: string, observation: string) => {
    const dto = await announcementsApi.reject(id, observation);
    setAnnouncements(prev => prev.map(ann => ann.id === id ? fromDto(dto, { ...ann, published: false, estado: "RECHAZADO" }) : ann));
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    const dto = await announcementsApi.update(id, updates);
    setAnnouncements(prev => prev.map(ann => {
      if (ann.id !== id) return ann;
      const fallback: Announcement = { ...ann, ...updates, id: ann.id };
      return fromDto(dto, fallback);
    }));
  };

  const deleteAnnouncement = async (id: string) => {
    await announcementsApi.remove(id);
    setAnnouncements(prev => prev.filter(ann => ann.id !== id));
  };

  // Filtrar anuncios publicados y que estén dentro del rango de fechas (usa nowTick para refresco por minuto)
  const publishedAnnouncements = announcements.filter(ann => {
    if (ann.estado !== "PUBLICADO") return false;
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
