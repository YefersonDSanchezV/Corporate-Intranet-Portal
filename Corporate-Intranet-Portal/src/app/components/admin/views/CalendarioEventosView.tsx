import { Plus, Trash2, X, Save, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Calendar } from "../../ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  date: Date;
  description: string;
  type: "institucional" | "capacitacion" | "reunion" | "otro";
}

const EVENT_TYPES = [
  { value: "institucional", label: "Institucional", color: "bg-blue-100 text-blue-700" },
  { value: "capacitacion", label: "Capacitacion", color: "bg-green-100 text-green-700" },
  { value: "reunion", label: "Reunion", color: "bg-amber-100 text-amber-700" },
  { value: "otro", label: "Otro", color: "bg-gray-100 text-gray-700" },
];

export function CalendarioEventosView() {
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem("admin_events");
    return saved ? JSON.parse(saved).map((e: any) => ({ ...e, date: new Date(e.date) })) : [];
  });
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<string>("institucional");
  const [eventDate, setEventDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const persist = (next: Event[]) => {
    setEvents(next);
    localStorage.setItem("admin_events", JSON.stringify(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newEvent: Event = { id: Date.now().toString(), title, description, date: new Date(eventDate), type: eventType as any };
    persist([...events, newEvent]);
    setTitle(""); setDescription(""); setShowForm(false);
  };

  const dayEvents = events.filter(e => {
    if (!date) return false;
    return format(e.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
  });

  const getTypeStyle = (type: string) => EVENT_TYPES.find(t => t.value === type)?.color || "bg-gray-100 text-gray-700";

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Calendario de Eventos</h1>
          <p className="text-gray-600 text-sm">Administre los eventos institucionales.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" /> {showForm ? "Ver calendario" : "Nuevo evento"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl mb-6">
          <h2 className="text-lg font-bold text-[#0778AC] mb-4">Registrar nuevo evento</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Titulo *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripcion</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Cancelar</button>
              <button type="submit" className="bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-2.5 rounded-lg text-sm font-semibold"><Save className="w-4 h-4 inline mr-1" />Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
        </div>
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
          <h2 className="font-bold text-[#0778AC] mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccione una fecha"}
          </h2>
          {dayEvents.length > 0 ? dayEvents.map(event => (
            <div key={event.id} className="border border-gray-100 rounded-lg p-4 mb-3 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{event.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${getTypeStyle(event.type)}`}>
                    {EVENT_TYPES.find(t => t.value === event.type)?.label}
                  </span>
                  <button onClick={() => persist(events.filter(e => e.id !== event.id))} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-400 text-sm text-center py-8">No hay eventos para esta fecha.</p>
          )}
        </div>
      </div>
    </div>
  );
}