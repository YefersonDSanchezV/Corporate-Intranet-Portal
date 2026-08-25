import { Plus, Trash2, Save, Cake } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Birthday {
  id: string;
  name: string;
  date: string;
  area: string;
}

export function CalendarioCumpleaniosView() {
  const [birthdays, setBirthdays] = useState<Birthday[]>(() => {
    const saved = localStorage.getItem("admin_birthdays");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");

  const persist = (next: Birthday[]) => {
    setBirthdays(next);
    localStorage.setItem("admin_birthdays", JSON.stringify(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    persist([...birthdays, { id: Date.now().toString(), name, date, area }]);
    setName(""); setDate(""); setArea("");
    setShowForm(false);
  };

  const currentMonth = new Date().getMonth();
  const monthBirthdays = birthdays.filter(b => new Date(b.date).getMonth() === currentMonth);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Calendario de Cumpleaños</h1>
          <p className="text-gray-600 text-sm">Administre los cumpleaños del personal.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" /> {showForm ? "Ver listado" : "Nuevo cumpleaños"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl mb-6">
          <h2 className="text-lg font-bold text-[#0778AC] mb-4">Registrar cumpleaños</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo *</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de nacimiento *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Area</label>
              <input value={area} onChange={e => setArea(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: Sistemas" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Cancelar</button>
              <button type="submit" className="bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-2.5 rounded-lg text-sm font-semibold"><Save className="w-4 h-4 inline mr-1" />Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-bold text-[#0778AC] mb-3 flex items-center gap-2">
          <Cake className="w-5 h-5" /> Cumpleaños de {format(new Date(), "MMMM", { locale: es })}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthBirthdays.length > 0 ? monthBirthdays.map(b => (
            <div key={b.id} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 text-sm">{b.name}</p>
                <p className="text-xs text-gray-500">{format(new Date(b.date), "dd 'de' MMMM", { locale: es })}</p>
                {b.area && <p className="text-[10px] text-gray-400">{b.area}</p>}
              </div>
              <button onClick={() => persist(birthdays.filter(x => x.id !== b.id))} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          )) : (
            <div className="col-span-full text-center py-8 text-gray-400">No hay cumpleaños registrados para este mes.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 text-sm">Todos los registros ({birthdays.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-sm font-semibold text-gray-600">Nombre</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Fecha</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Area</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {birthdays.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold text-sm">{b.name}</td>
                  <td className="p-3 text-sm">{format(new Date(b.date), "dd/MM/yyyy")}</td>
                  <td className="p-3 text-sm">{b.area || "-"}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => persist(birthdays.filter(x => x.id !== b.id))} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}