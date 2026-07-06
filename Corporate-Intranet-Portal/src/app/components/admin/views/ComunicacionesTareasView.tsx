import { Plus, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useSystem, Task } from "../../../contexts/SystemContext";
import { useAuth } from "../../../contexts/AuthContext";
import { TaskModal } from "../../modals/TaskModal";
import { NewTaskModal } from "../../modals/NewTaskModal";

export function ComunicacionesTareasView() {
  const { user } = useAuth();
  const { tasks, addTask, addObservationToTask, completeTask } = useSystem();
  
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleAddTask = (title: string, description: string, assignedTo: string) => {
    addTask({
      title,
      description,
      assignedTo,
      registeredBy: user?.fullName || "Admin"
    });
  };

  const handleAddObservation = (taskId: string, observationText: string) => {
    addObservationToTask(taskId, { text: observationText, author: user?.fullName || "Admin" });
    
    // Update selected task to show new observation in modal
    if (selectedTask && selectedTask.id === taskId) {
      const newObs = { text: observationText, author: user?.fullName || "Admin", date: new Date().toISOString() };
      setSelectedTask({ ...selectedTask, observations: [...selectedTask.observations, newObs] });
    }
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
  };

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e] mb-2">Seguimiento de Tareas</h1>
          <p className="text-gray-600 text-sm">
            Gestión y seguimiento de tareas asignadas al personal administrativo y de RRHH.
          </p>
        </div>
        <button
          onClick={() => setNewTaskModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
          Tareas Pendientes
        </h2>
        {pendingTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group"
              >
                <h3 className="font-bold text-gray-800 mb-2 group-hover:text-[#0778AC] transition-colors">{task.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Asignado a:</span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                      {task.assignedTo}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
                    <span className="text-xs text-gray-400">Por: {task.registeredBy}</span>
                    {task.observations.length > 0 && (
                      <span className="text-xs font-medium text-[#CF3438] bg-red-50 px-2 py-0.5 rounded-full">
                        {task.observations.length} observaci{task.observations.length === 1 ? "ón" : "ones"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-500 font-semibold mb-1">Todo al día</h3>
            <p className="text-gray-400 text-sm">No hay tareas pendientes en este momento.</p>
          </div>
        )}
      </section>

      {completedTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-green-600 mb-4 pb-2 border-b-2 border-green-600/30">
            Tareas Completadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="bg-green-50/50 border-2 border-green-100 hover:border-green-300 rounded-xl p-5 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 mb-1 truncate">{task.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">{task.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded-sm">
                        Completada
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        Asignado: {task.assignedTo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onAddObservation={handleAddObservation}
        onCompleteTask={handleCompleteTask}
      />

      <NewTaskModal
        isOpen={newTaskModalOpen}
        onClose={() => setNewTaskModalOpen(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
