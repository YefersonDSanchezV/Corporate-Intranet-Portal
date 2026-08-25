import { Plus, CheckCircle, X } from "lucide-react";
import { useState } from "react";
import { useSystem, Task } from "../../../contexts/SystemContext";
import { useAuth } from "../../../contexts/AuthContext";

export function TareasSeguimientoView() {
  const { tasks, addTask, completeTask } = useSystem();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title, description, assignedTo, registeredBy: user?.fullName || "Administrador" });
    setTitle(""); setDescription(""); setAssignedTo("");
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Tareas y Seguimiento</h1>
          <p className="text-gray-600 text-sm">Administre las tareas y su seguimiento.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" /> {showForm ? "Ver listado" : "Nueva tarea"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl mb-6">
          <h2 className="text-lg font-bold text-[#0778AC] mb-4">Registrar nueva tarea</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Titulo *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripcion</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Asignado a</label>
              <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Nombre del responsable" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Cancelar</button>
              <button type="submit" className="bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Guardar tarea</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-amber-600 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
            Pendientes ({pendingTasks.length})
          </h2>
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <div key={task.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTask(task)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{task.description?.substring(0, 100)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); completeTask(task.id); }} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg" title="Completar">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
                {task.assignedTo && <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded mt-2 inline-block">{task.assignedTo}</span>}
              </div>
            ))}
            {pendingTasks.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No hay tareas pendientes</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-green-600 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Completadas ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div key={task.id} className="border border-green-100 bg-green-50/30 rounded-lg p-4 cursor-pointer" onClick={() => setSelectedTask(task)}>
                <p className="font-semibold text-sm text-gray-600 line-through">{task.title}</p>
                <p className="text-xs text-gray-400 mt-1">{task.description?.substring(0, 80)}</p>
              </div>
            ))}
            {completedTasks.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No hay tareas completadas</p>}
          </div>
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[200] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#0778AC]">{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedTask.description}</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Asignado a: {selectedTask.assignedTo || "Sin asignar"}</p>
              <p>Registrado por: {selectedTask.registeredBy}</p>
              <p>Estado: {selectedTask.completed ? "Completada" : "Pendiente"}</p>
            </div>
            {selectedTask.observations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-semibold text-xs text-gray-700 mb-2">Observaciones:</p>
                {selectedTask.observations.map((obs, i) => (
                  <div key={i} className="bg-gray-50 rounded p-2 mb-2 text-xs">
                    <p className="text-gray-600">{obs.text}</p>
                    <p className="text-gray-400 mt-1">- {obs.author}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSelectedTask(null)} className="w-full mt-4 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm font-semibold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}