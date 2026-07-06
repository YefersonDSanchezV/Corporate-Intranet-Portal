import { X, Plus, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (title: string, description: string, assignedTo: string) => void;
}

export function NewTaskModal({ isOpen, onClose, onAddTask }: NewTaskModalProps) {
  const { user, users } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim() && assignedTo.trim()) {
      onAddTask(title, description, assignedTo);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 md:p-6 text-white flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">Cargar Nueva Tarea</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Título de la Tarea *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Revisar contratos nuevos"
              className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción de la Tarea *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa los detalles y objetivos de la tarea..."
              className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all min-h-[100px] resize-none"
              required
            />
          </div>

          {/* Asignado a */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Asignado a *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0778AC] pointer-events-none" />
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all appearance-none bg-white"
                required
              >
                <option value="">Seleccione encargado de RRHH...</option>
                {users
                  .filter((u) => u.role === "administrativo_rrhh")
                  .map((u) => (
                    <option key={u.id} value={u.fullName}>
                      {u.fullName}
                    </option>
                  ))}
              </select>
            </div>
            {users.filter(u => u.role === "administrativo_rrhh").length === 0 && (
              <p className="text-xs text-red-500 mt-1">No hay usuarios con el rol administrativo_rrhh disponibles.</p>
            )}
          </div>

          {/* Registrado por — automático del usuario de sesión */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Registrado por
            </label>
            <input
              type="text"
              value={user?.fullName || "Usuario"}
              readOnly
              className="w-full border-2 border-gray-100 rounded-lg p-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              * Este campo se toma automáticamente del usuario de la sesión activa.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Registrar Tarea
          </button>
        </form>
      </div>
    </div>
  );
}
