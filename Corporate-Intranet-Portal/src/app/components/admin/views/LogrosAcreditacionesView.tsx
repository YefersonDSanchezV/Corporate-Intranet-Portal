import { Plus, Eye, Trash2, X, Save, Award } from "lucide-react";
import { useState } from "react";
import { Achievement, useSystem } from "../../../contexts/SystemContext";

export function LogrosAcreditacionesView() {
  const { achievements, addAchievement, removeAchievement } = useSystem();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Achievement | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [date, setDate] = useState("");
  const [level, setLevel] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setImage("");
    setDate("");
    setLevel("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addAchievement({ title, description, image, date, level, active: true });
    reset();
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Logros y Acreditaciones</h1>
          <p className="text-gray-600 text-sm">Administre los logros, acreditaciones y certificaciones institucionales.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(!showForm); }} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" />
          {showForm ? "Ver listado" : "Nuevo logro"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl">
          <h2 className="text-lg font-bold text-[#0778AC] mb-6">Registrar nuevo logro o acreditación</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Título del logro *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: Acreditación Internacional" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none" placeholder="Descripción del logro obtenido..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL de la imagen</label>
              <input value={image} onChange={e => setImage(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nivel</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                <option value="">Seleccione...</option>
                <option value="Local">Local</option>
                <option value="Regional">Regional</option>
                <option value="Nacional">Nacional</option>
                <option value="Internacional">Internacional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de obtención</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Cancelar</button>
              <button type="submit" className="flex items-center gap-2 bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                <Save className="w-4 h-4" /> Guardar logro
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {achievements.length > 0 ? achievements.map((ach) => (
            <div key={ach.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-[#0778AC]" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">{ach.title}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ach.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {ach.level && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">{ach.level}</span>}
                {ach.date && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{ach.date}</span>}
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => setShowDetail(ach)} className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                <button onClick={() => removeAchievement(ach.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )) : (
            <div className="md:col-span-2 xl:col-span-3 text-center py-16 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay logros o acreditaciones registradas.</p>
            </div>
          )}
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-[200] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#0778AC]">{showDetail.title}</h2>
              <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            {showDetail.image && <img src={showDetail.image} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />}
            <p className="text-sm text-gray-600 mb-4">{showDetail.description}</p>
            <div className="flex gap-2 mb-4">
              {showDetail.level && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">{showDetail.level}</span>}
              {showDetail.date && <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{showDetail.date}</span>}
            </div>
            <button onClick={() => setShowDetail(null)} className="w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm font-semibold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}