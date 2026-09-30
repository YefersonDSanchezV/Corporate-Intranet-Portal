import { Bell, Calendar, Building2, User } from "lucide-react";
import { useAnnouncements } from "../contexts/AnnouncementsContext";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function AnnouncementPanel({ compact = false }: { compact?: boolean }) {
  const { publishedAnnouncements } = useAnnouncements();
  const { users } = useAuth();

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
              <div className="flex justify-between items-start gap-4 mb-1">
                <h3 className="font-semibold text-gray-800 text-sm md:text-base flex-1 leading-tight break-words">{announcement.title}</h3>
                <div className="flex flex-col items-end gap-1 shrink-0 text-right max-w-[42%]">
                  {(announcement as any).areaInforma && (
                    <div className="flex items-center gap-1 text-xs font-medium text-[#0778AC] justify-end">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="break-words text-right">{(announcement as any).areaInforma}</span>
                    </div>
                  )}
                  {(() => {
                    const creator = users.find(u => u.fullName === announcement.createdBy || u.username === announcement.createdBy);
                    const cargo = creator?.position || creator?.role || "";
                    return (
                      <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="break-words text-right">{announcement.createdBy}{cargo ? ` — ${cargo}` : ""}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
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