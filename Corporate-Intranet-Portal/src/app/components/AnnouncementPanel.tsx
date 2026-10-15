import { Bell, Calendar, Building2, User, ChevronUp, ChevronDown } from "lucide-react";
import { useAnnouncements } from "../contexts/AnnouncementsContext";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";

type Variant = "home" | "sidebar";

interface AnnouncementPanelProps {
  variant?: Variant;
  maxVisible?: number;
}

// Carrusel vertical: muestra una ventana fija de anuncios y rota hacia arriba.
// Así la página nunca se estira por más anuncios que se publiquen.
function useVerticalCarousel(total: number, visible: number) {
  const count = Math.min(visible, Math.max(total, 0));
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const canRotate = total > count && count > 0;

  // Al llegar un anuncio nuevo se vuelve al inicio para mostrarlo de inmediato.
  useEffect(() => {
    setStart(0);
  }, [total]);

  useEffect(() => {
    if (!canRotate || paused) return;
    const id = setInterval(() => setStart((s) => (s + 1) % total), 5000);
    return () => clearInterval(id);
  }, [canRotate, paused, total]);

  const next = () => total > 0 && setStart((s) => (s + 1) % total);
  const prev = () => total > 0 && setStart((s) => (s - 1 + total) % total);

  const indices: number[] = [];
  for (let i = 0; i < count; i++) indices.push((start + i) % total);

  return { start, count, canRotate, paused, setPaused, next, prev, indices };
}

export function AnnouncementPanel({ variant = "home", maxVisible = 3 }: AnnouncementPanelProps) {
  const { publishedAnnouncements } = useAnnouncements();
  const { users } = useAuth();
  const { start, canRotate, setPaused, next, prev, indices } = useVerticalCarousel(
    publishedAnnouncements.length,
    maxVisible
  );

  const getCreatorInfo = (announcement: any) => {
    const creator = users.find(u => u.fullName === announcement.createdBy || u.username === announcement.createdBy);
    const cargo = creator?.position || creator?.role || "";
    return { name: announcement.createdBy, cargo };
  };

  return (
    <div
      className={`${variant === "home"
        ? 'bg-gradient-to-r from-[#f0f4f8] to-white border-2 border-[#0778AC]/20 p-4 md:p-6'
        : 'bg-white p-4 mb-0 border-2 border-[#0778AC]/10'}
        rounded-lg shadow-md h-full flex flex-col`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`flex items-center gap-3 ${variant === "sidebar" ? 'mb-2' : 'mb-4'}`}>
        <div className={`${variant === "home" ? 'bg-[#CF3438]' : 'bg-[#0778AC]'} rounded-full p-2`}>
          <Bell className={`${variant === "sidebar" ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} text-white`} />
        </div>
        <h2 className={`${variant === "sidebar" ? 'text-base' : 'text-lg md:text-xl'} font-semibold text-[#0778AC]`}>
          Anuncios y Comunicados
        </h2>
        {canRotate && (
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] font-semibold text-gray-400 mr-1">
              {start + 1}/{publishedAnnouncements.length}
            </span>
            <button
              onClick={prev}
              title="Ver anteriores"
              aria-label="Ver anuncios anteriores"
              className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-[#0778AC] hover:border-[#0778AC] hover:bg-[#f0f4f8] transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              title="Ver siguientes"
              aria-label="Ver anuncios siguientes"
              className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-[#0778AC] hover:border-[#0778AC] hover:bg-[#f0f4f8] transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {publishedAnnouncements.length > 0 ? (
        <div key={start} className="announcement-slide-up flex-1 flex flex-col gap-3">
          {variant === "home" ? (
            indices.map((i, idx) => {
              const announcement = publishedAnnouncements[i];
              return (
                <div key={announcement.id} className={idx > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                  <HomeAnnouncementCard
                    announcement={announcement}
                    creatorInfo={getCreatorInfo(announcement)}
                  />
                </div>
              );
            })
          ) : (
            indices.map((i) => {
              const announcement = publishedAnnouncements[i];
              return (
                <SidebarAnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                />
              );
            })
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-center py-4 text-sm">No hay anuncios vigentes en este momento</p>
        </div>
      )}
    </div>
  );
}

function HomeAnnouncementCard({ announcement, creatorInfo }: { announcement: any; creatorInfo: { name: string; cargo: string } }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex-1">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="font-semibold text-gray-800 text-sm md:text-base flex-1 leading-tight break-words">{announcement.title}</h3>
          <div className="flex flex-col items-end gap-1 shrink-0 text-right max-w-[42%]">
            {(announcement as any).areaInforma && (
              <div className="flex items-center gap-1 text-xs font-medium text-[#0778AC] justify-end">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="break-words text-right">{announcement.areaInforma}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="break-words text-right">{creatorInfo.name}{creatorInfo.cargo ? ` — ${creatorInfo.cargo}` : ""}</span>
            </div>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-600 whitespace-pre-wrap break-words">{announcement.description}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
        <Calendar className="w-3 h-3" />
        <span>Vigente hasta: {format(announcement.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</span>
      </div>
    </div>
  );
}

function SidebarAnnouncementCard({ announcement }: { announcement: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow w-full flex flex-col">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight break-words mb-1">{announcement.title}</h3>
        {(announcement as any).areaInforma && (
          <div className="flex items-center gap-1 text-xs font-medium text-[#0778AC] mb-2">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="break-words text-left">{announcement.areaInforma}</span>
          </div>
        )}
        <p className="text-xs text-gray-600 mb-2 whitespace-pre-wrap break-words">{announcement.description}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 flex-shrink-0">
        <Calendar className="w-3 h-3 flex-shrink-0" />
        <span>Hasta: {format(announcement.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</span>
      </div>
    </div>
  );
}
