import { X, CheckCircle, MessageSquare, User, ClipboardList } from "lucide-react";
import { useState } from "react";
import type { Task } from "../modules/AdministrativeAreaModule";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAddObservation: (taskId: string, observation: string) => void;
  onCompleteTask: (taskId: string) => void;
}

export function TaskModal({ isOpen, onClose, task, onAddObservation, onCompleteTask }: TaskModalProps) {
  const [observation, setObservation] = useState("");

  if (!isOpen || !task) return null;

  const handleAddObservation = () => {
    if (observation.trim()) {
      onAddObservation(task.id, observation);
      setObservation("");
    }
  };

  const handleComplete = () => {
    onCompleteTask(task.id);
    onClose();
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 md:p-6 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Detalle de la Tarea</h2>
            {task.completed && (
              <span className="text-white/80 text-xs flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" /> Completada
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {/* Información de la tarea */}
          <div className="mb-5 bg-gray-50 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
              {task.completed && (
                <div className="flex items-center gap-1 text-green-600 mt-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Tarea Completada</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex items-start gap-2">
                <ClipboardList className="w-4 h-4 text-[#0778AC] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</p>
                  <p className="text-sm text-gray-700 mt-0.5">{task.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#0778AC] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Asignado a</p>
                  <p className="text-sm text-gray-700 mt-0.5">{task.assignedTo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registrado por</p>
                  <p className="text-sm text-gray-600 mt-0.5">{task.registeredBy}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 ml-6">
                  Creada el {formatDate(task.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones existentes */}
          <div className="mb-5">
            <h4 className="font-semibold text-[#0778AC] mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Observaciones ({task.observations.length})
            </h4>
            {task.observations.length > 0 ? (
              <div className="space-y-2 mb-4">
                {task.observations.map((obs, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{obs.text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      — {obs.author} · {formatDate(obs.date)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-4">No hay observaciones registradas aún.</p>
            )}

            {/* Agregar nueva observación */}
            {!task.completed && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agregar Observación
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Escriba su observación aquí..."
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all min-h-[100px] resize-none"
                />
                <button
                  onClick={handleAddObservation}
                  disabled={!observation.trim()}
                  className="mt-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Observación
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer — Completar tarea */}
        {!task.completed && (
          <div className="border-t-2 border-gray-200 p-4 md:p-5 bg-gray-50 flex-shrink-0">
            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Marcar como Completada
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
