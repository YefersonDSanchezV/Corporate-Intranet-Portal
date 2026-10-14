import { Bell, Calendar, Building2, User, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useAnnouncements } from "../contexts/AnnouncementsContext";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";

type Variant = "home" | "sidebar";

interface AnnouncementPanelProps {
  variant?: Variant;
  maxVisible?: number;
}

export function AnnouncementPanel({ variant = "home", maxVisible }: AnnouncementPanelProps) {
  const { publishedAnnouncements } = useAnnouncements();
  const { users } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const defaultMaxVisible = variant === "home" ? 2 : 1;
  const visibleCount = maxVisible ?? defaultMaxVisible;
  const shouldCarousel = publishedAnnouncements.length > visibleCount;

  // Sidebar carousel constants (fixed pixel width for stable rendering)
  const CARD_WIDTH = 300; // px
  const CARD_GAP = 8; // px (gap-2 = 8px)

  const visibleAnnouncements = publishedAnnouncements.slice(currentIndex, currentIndex + visibleCount);

  const nextSlide = () => {
    if (!shouldCarousel) return;
    setCurrentIndex((prev) => (prev + 1) % (publishedAnnouncements.length - visibleCount + 1));
  };

  const prevSlide = () => {
    if (!shouldCarousel) return;
    setCurrentIndex((prev) => (prev - 1 + (publishedAnnouncements.length - visibleCount + 1)) % (publishedAnnouncements.length - visibleCount + 1));
  };

  useEffect(() => {
    if (!shouldCarousel) return;
    intervalRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [shouldCarousel, publishedAnnouncements.length, visibleCount]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const getCreatorInfo = (announcement: any) => {
    const creator = users.find(u => u.fullName === announcement.createdBy || u.username === announcement.createdBy);
    const cargo = creator?.position || creator?.role || "";
    return { name: announcement.createdBy, cargo };
  };

  // Sidebar carousel uses pixel-based calculations for stable rendering
  const trackWidth = shouldCarousel ? publishedAnnouncements.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP : 0;
  const translateX = shouldCarousel ? -currentIndex * (CARD_WIDTH + CARD_GAP) : 0;

  return (
    <div
      className={`${variant === "home" 
        ? 'bg-gradient-to-r from-[#f0f4f8] to-white border-2 border-[#0778AC]/20 p-4 md:p-6' 
        : 'bg-white p-4 mb-0 border-2 border-[#0778AC]/10'} 
        rounded-lg shadow-md h-full flex flex-col`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex items-center gap-3 ${variant === "sidebar" ? 'mb-2' : 'mb-4'}`}>
        <div className={`${variant === "home" ? 'bg-[#CF3438]' : 'bg-[#0778AC]'} rounded-full p-2`}>
          <Bell className={`${variant === "sidebar" ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} text-white`} />
        </div>
        <h2 className={`${variant === "sidebar" ? 'text-base' : 'text-lg md:text-xl'} font-semibold text-[#0778AC]`}>
          Anuncios y Comunicados
        </h2>
      </div>

      {publishedAnnouncements.length > 0 ? (
        <div className="flex-1 overflow-hidden relative">
          {variant === "home" ? (
            <div className="flex flex-col gap-1">
              {visibleAnnouncements.map((announcement, idx) => (
                <div key={announcement.id} className={idx > 0 ? 'pt-2 border-t border-gray-100' : ''}>
                  <HomeAnnouncementCard
                    announcement={announcement}
                    creatorInfo={getCreatorInfo(announcement)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div
                className={`flex gap-2 ${shouldCarousel ? 'transition-transform duration-700 ease-in-out' : ''}`}
                style={{
                  width: shouldCarousel ? trackWidth : 'auto',
                  transform: shouldCarousel ? `translateX(${translateX}px)` : undefined,
                }}
              >
                {publishedAnnouncements.map((announcement) => (
                  <SidebarAnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                  />
                ))}
              </div>

              {shouldCarousel && !isHovered && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md transition-opacity opacity-0 hover:opacity-100 group-hover:opacity-100"
                    aria-label="Anuncio anterior"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#0778AC]" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md transition-opacity opacity-0 hover:opacity-100 group-hover:opacity-100"
                    aria-label="Siguiente anuncio"
                  >
                    <ChevronRight className="w-4 h-4 text-[#0778AC]" />
                  </button>
                </>
              )}
            </div>
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
    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow flex-1 min-h-[180px] flex flex-col">
      <div className="flex-1">
        <div className="flex justify-between items-start gap-4 mb-1">
          <h3 className="font-semibold text-gray-800 text-sm md:text-base flex-1 leading-tight break-words">{announcement.title}</h3>
          <div className="flex flex-col items-end gap-1 shrink-0 text-right max-w-[42%]">
            {(announcement as any).areaInforma && (
              <div className="flex items-center gap-1 text-xs font-medium text-[#0778AC] justify-end">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="break-words text-right">{(announcement as any).areaInforma}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="break-words text-right">{creatorInfo.name}{creatorInfo.cargo ? ` — ${creatorInfo.cargo}` : ""}</span>
            </div>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-600">{announcement.description}</p>
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
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow flex-shrink-0 w-[300px] basis-[300px] flex flex-col justify-between min-h-[160px] box-border">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight break-words mb-1">{announcement.title}</h3>
        {(announcement as any).areaInforma && (
          <div className="flex items-center gap-1 text-xs font-medium text-[#0778AC] mb-2">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="break-words text-left">{(announcement as any).areaInforma}</span>
          </div>
        )}
        <p className="text-xs text-gray-600 mb-2">{announcement.description}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
        <Calendar className="w-3 h-3" />
        <span>Hasta: {format(announcement.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</span>
      </div>
    </div>
  );
}