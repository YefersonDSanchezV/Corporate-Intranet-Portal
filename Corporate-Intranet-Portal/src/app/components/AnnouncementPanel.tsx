import { Bell, Calendar } from "lucide-react";
import { useAnnouncements } from "../contexts/AnnouncementsContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function AnnouncementPanel({ compact = false }: { compact?: boolean }) {
  const { publishedAnnouncements } = useAnnouncements();

  return (
    <div className={`${compact ? 'bg-white p-4 mb-0 border-2 border-[#0778AC]/10' : 'bg-gradient-to-r from-[#f0f4f8] to-white border-2 border-[#0778AC]/20 p-4 md:p-6'} rounded-lg shadow-md h-full flex flex-col`}>
      <div className={`flex items-center gap-3 ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className={`${compact ? 'bg-[#0778AC]' : 'bg-[#CF3438]'} rounded-full p-2`}>
          <Bell className={`${compact ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} text-white`} />
        </div>
        <h2 className={`${compact ? 'text-base' : 'text-lg md:text-xl'} font-semibold text-[#0778AC]`}>Anuncios y Comunicados</h2>
      </div>
      {publishedAnnouncements.length > 0 ? (
        <div className="space-y-3">
          {publishedAnnouncements.map((announcement) => (
            <div key={announcement.id} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">{announcement.title}</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-2">{announcement.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>
                  Vigente hasta: {format(announcement.endDate, "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-center py-4 text-sm">No hay anuncios vigentes en este momento</p>
        </div>
      )}
    </div>
  );
}