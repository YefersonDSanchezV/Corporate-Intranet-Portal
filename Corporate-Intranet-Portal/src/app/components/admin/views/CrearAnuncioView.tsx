import { Save, Send } from "lucide-react";
import { useState } from "react";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";
import { useAuth } from "../../../contexts/AuthContext";

export function CrearAnuncioView() {
  const { addAnnouncement, publishAnnouncement } = useAnnouncements();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [publishNow, setPublishNow] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    const ann = {
      title: title.trim(),
      description: description.trim(),
      startDate: new Date(`${startDate}T${startTime}:00`),
      endDate: new Date(`${endDate}T${endTime}:00`),
      createdBy: user?.fullName || "Administrador",
    };

    addAnnouncement(ann);
    
    if (publishNow) {
      setTimeout(() => {
        const saved = localStorage.getItem('intranet_announcements');
        if (saved) {
          const parsed = JSON.parse(saved);
          const latest = parsed[0];
          if (latest) publishAnnouncement(latest.id);
        }
      }, 100);
    }

    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    alert("Anuncio creado exitosamente.");
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Crear Anuncio</h1>
        <p className="text-gray-600 text-sm">Cree y publique anuncios institucionales.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Titulo del anuncio *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: Nuevo horario de atencion" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripcion</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none" placeholder="Descripcion del anuncio..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de inicio *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de inicio</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de fin *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de fin</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm font-medium">
            <input type="checkbox" checked={publishNow} onChange={e => setPublishNow(e.target.checked)} className="w-4 h-4" />
            Publicar automaticamente al crear
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setTitle(""); setDescription(""); setStartDate(""); setEndDate(""); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">
              Limpiar
            </button>
            <button type="submit" className="flex items-center gap-2 bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
              {publishNow ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {publishNow ? "Crear y Publicar" : "Crear Anuncio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}