import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "../../ui/calendar";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";

export function CalendarioAnunciosView() {
  const { announcements } = useAnnouncements();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const dayAnnouncements = announcements.filter(ann => {
    if (!date) return false;
    const start = new Date(ann.startDate);
    const end = new Date(ann.endDate);
    return date >= start && date <= end;
  });

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Calendario de Anuncios</h1>
        <p className="text-gray-600 text-sm">Visualice los anuncios programados por fecha.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
          <h2 className="font-bold text-[#0778AC] mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccione una fecha"}
          </h2>
          {dayAnnouncements.length > 0 ? (
            <div className="space-y-3">
              {dayAnnouncements.map(ann => (
                <div key={ann.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-sm">{ann.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${ann.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {ann.published ? "Publicado" : "Pendiente"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{ann.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No hay anuncios para esta fecha.</p>
          )}
        </div>
      </div>
    </div>
  );
}