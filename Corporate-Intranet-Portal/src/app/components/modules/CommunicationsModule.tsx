import { Calendar as CalendarIcon, Send, Check, Eye, Trash2, Pencil, X, Save, Plus, CheckCircle, Cake, Star } from "lucide-react";
import { useState, useMemo } from "react";
import { useAnnouncements } from "../../contexts/AnnouncementsContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "../ui/calendar";
import { useAuth } from "../../contexts/AuthContext";
import { useSystem, Task } from "../../contexts/SystemContext";
import { getGreeting } from "../../utils/greetings";
import { TaskModal } from "../modals/TaskModal";
import { NewTaskModal } from "../modals/NewTaskModal";

interface Event {
  id: string;
  title: string;
  date: Date;
  description: string;
  type: string;
}

interface Birthday {
  id: string;
  name: string;
  date: string;
  area: string;
}

export function CommunicationsModule() {
  const { user } = useAuth();
  const { announcements, publishAnnouncement, deleteAnnouncement, updateAnnouncement } = useAnnouncements();
  const { tasks, addTask, addObservationToTask, completeTask } = useSystem();
  const greeting = getGreeting();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<string | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Leer eventos del admin desde localStorage (misma clave que CalendarioEventosView)
  const adminEvents = useMemo(() => {
    const saved = localStorage.getItem("admin_events");
    if (!saved) return [];
    return JSON.parse(saved).map((e: any) => ({ ...e, date: new Date(e.date) }));
  }, []);

  // Leer cumpleaños del admin desde localStorage (misma clave que CalendarioCumpleaniosView)
  const adminBirthdays = useMemo(() => {
    const saved = localStorage.getItem("admin_birthdays");
    if (!saved) return [];
    return JSON.parse(saved) as Birthday[];
  }, []);

  // Eventos del día seleccionado
  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return adminEvents.filter((e: Event) => format(new Date(e.date), "yyyy-MM-dd") === dateStr);
  }, [selectedDate, adminEvents]);

  // Cumpleaños del día seleccionado
  const dayBirthdays = useMemo(() => {
    if (!selectedDate) return [];
    return adminBirthdays.filter(b => {
      const bDate = new Date(b.date);
      return bDate.getMonth() === selectedDate.getMonth() && bDate.getDate() === selectedDate.getDate();
    });
  }, [selectedDate, adminBirthdays]);

  // Anuncios activos en la fecha seleccionada
  const dayAnnouncements = useMemo(() => {
    if (!selectedDate) return [];
    return announcements.filter(ann => {
      if (!ann.published) return false;
      const start = new Date(ann.startDate);
      const end = new Date(ann.endDate);
      return selectedDate >= start && selectedDate <= end;
    });
  }, [selectedDate, announcements]);

  const handleStartEdit = (ann: any) => {
    setEditingAnnouncement(ann.id);
    setEditTitle(ann.title);
    setEditDescription(ann.description);
  };

  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
  };

  const handleSaveEdit = (id: string) => {
    updateAnnouncement(id, { title: editTitle, description: editDescription });
    setEditingAnnouncement(null);
  };

  const handlePublish = (id: string) => {
    publishAnnouncement(id);
    setSelectedAnnouncement(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este anuncio?")) {
      deleteAnnouncement(id);
    }
  };

  const pendingAnnouncements = announcements.filter(ann => !ann.published);
  const publishedAnnouncements = announcements.filter(ann => ann.published);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleAddTask = (title: string, description: string, assignedTo: string) => {
    addTask({
      title,
      description,
      assignedTo,
      registeredBy: user?.fullName || "Comunicaciones"
    });
  };

  const handleAddObservation = (taskId: string, observationText: string) => {
    addObservationToTask(taskId, { text: observationText, author: user?.fullName || "Comunicaciones" });
    if (selectedTask && selectedTask.id === taskId) {
      const newObs = { text: observationText, author: user?.fullName || "Comunicaciones", date: new Date().toISOString() };
      setSelectedTask({ ...selectedTask, observations: [...selectedTask.observations, newObs] });
    }
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
  };

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // Días con eventos para el calendario
  const eventDays = useMemo(() => {
    const days = new Set<string>();
    adminEvents.forEach((e: Event) => days.add(format(new Date(e.date), "yyyy-MM-dd")));
    adminBirthdays.forEach(b => days.add(format(new Date(b.date), "yyyy-MM-dd")));
    announcements.filter(a => a.published).forEach(a => {
      let d = new Date(a.startDate);
      const end = new Date(a.endDate);
      while (d <= end) {
        days.add(format(d, "yyyy-MM-dd"));
        d = new Date(d.getTime() + 86400000);
      }
    });
    return days;
  }, [adminEvents, adminBirthdays, announcements]);

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      institucional: "bg-blue-500",
      capacitacion: "bg-green-500",
      reunion: "bg-amber-500",
      otro: "bg-gray-500",
    };
    return colors[type] || "bg-[#0778AC]";
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">
          Módulo de Comunicaciones
        </h1>
        <div className="h-1 bg-gradient-to-r from-[#CF3438] to-transparent w-32 md:w-48 rounded-full"></div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#0778AC]">
        <p className="text-gray-700 font-bold text-sm md:text-base mb-1">
          ¡{greeting}, {user?.fullName.split(' ')[0]}!
        </p>
        <p className="text-gray-600 text-sm md:text-base">
          En este módulo encontrarás herramientas para la gestión de comunicaciones institucionales y seguimiento de tareas.
        </p>
      </div>

      {/* CALENDARIO TIPO GOOGLE */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-6 shadow-md mb-8">
        <div className="flex items-center gap-2 mb-4 text-[#0778AC]">
          <CalendarIcon className="w-5 h-5" />
          <h2 className="font-bold text-lg">Calendario de Eventos</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario visual */}
          <div className="lg:col-span-1">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border w-full"
              modifiers={{
                hasEvent: (date) => eventDays.has(format(date, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{
                hasEvent: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-[#CF3438]",
              }}
            />
          </div>

          {/* Detalle del día */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gradient-to-r from-[#f0f4f8] to-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold text-[#0778AC] text-lg mb-1">
                {selectedDate ? format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccione una fecha"}
              </h3>
              <p className="text-xs text-gray-500">
                {dayEvents.length + dayBirthdays.length + dayAnnouncements.length} evento(s) en esta fecha
              </p>
            </div>

            {/* Eventos del admin */}
            {dayEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#0778AC]" /> Eventos
                </h4>
                <div className="space-y-2">
                  {dayEvents.map((event: Event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getEventTypeColor(event.type)}`} />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{event.title}</p>
                        {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cumpleaños */}
            {dayBirthdays.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Cake className="w-4 h-4 text-[#CF3438]" /> Cumpleaños
                </h4>
                <div className="space-y-2">
                  {dayBirthdays.map((b: Birthday) => (
                    <div key={b.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-white border border-pink-100 rounded-lg">
                      <Cake className="w-5 h-5 text-[#CF3438]" />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{b.name}</p>
                        <p className="text-xs text-gray-500">{b.area || "General"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anuncios activos */}
            {dayAnnouncements.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" /> Anuncios Vigentes
                </h4>
                <div className="space-y-2">
                  {dayAnnouncements.map(ann => (
                    <div key={ann.id} className="p-3 bg-green-50 border border-green-100 rounded-lg">
                      <p className="font-semibold text-sm text-gray-800">{ann.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{ann.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dayEvents.length === 0 && dayBirthdays.length === 0 && dayAnnouncements.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay eventos, cumpleaños o anuncios para esta fecha</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de anuncios pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-6 shadow-md">
            <h2 className="text-lg font-semibold text-[#CF3438] mb-4">
              Anuncios Pendientes por Aprobación
            </h2>

            {pendingAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {pendingAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#CF3438] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">{ann.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{ann.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            Inicio: {format(ann.startDate, "dd/MM/yyyy HH:mm", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            Fin: {format(ann.endDate, "dd/MM/yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Registrado por: {ann.createdBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAnnouncement(ann.id === selectedAnnouncement ? null : ann.id)}
                        className="flex-1 bg-[#0778AC] hover:bg-[#065a87] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {selectedAnnouncement === ann.id ? "Ocultar" : "Ver Detalles"}
                      </button>
                      <button
                        onClick={() => handlePublish(ann.id)}
                        className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Publicar Anuncio
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedAnnouncement === ann.id && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gray-50 p-3 rounded-lg">
                        {editingAnnouncement === ann.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Título del Anuncio</label>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-[#0778AC]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Descripción del Evento</label>
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={3}
                                className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-[#0778AC] resize-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(ann.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Guardar Cambios
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-semibold text-gray-700">Detalles completos:</p>
                              <button
                                onClick={() => handleStartEdit(ann)}
                                className="text-[#0778AC] hover:text-[#065a87] text-xs font-bold flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Editar Anuncio
                              </button>
                            </div>
                            <p className="text-sm text-gray-600">{ann.description}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hay anuncios pendientes por aprobación
              </p>
            )}
          </div>
        </div>

        {/* Mini resumen del lado derecho */}
        <div className="space-y-4">
          <div className="bg-white border-2 border-green-200 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold text-green-600 text-sm mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" /> Publicados ({publishedAnnouncements.length})
            </h3>
            {publishedAnnouncements.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {publishedAnnouncements.slice(0, 5).map(ann => (
                  <div key={ann.id} className="text-xs p-2 bg-green-50 rounded border border-green-100">
                    <p className="font-semibold text-gray-700">{ann.title}</p>
                    <p className="text-gray-400">Vence: {format(ann.endDate, "dd/MM", { locale: es })}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Sin anuncios publicados</p>
            )}
          </div>

          <div className="bg-white border-2 border-amber-200 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold text-amber-600 text-sm mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Próximos Eventos
            </h3>
            {adminEvents.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {adminEvents.slice(0, 5).map((event: Event) => (
                  <div key={event.id} className="text-xs p-2 bg-amber-50 rounded border border-amber-100">
                    <p className="font-semibold text-gray-700">{event.title}</p>
                    <p className="text-gray-400">{format(new Date(event.date), "dd/MM/yyyy", { locale: es })}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Sin eventos próximos</p>
            )}
          </div>

          <div className="bg-white border-2 border-pink-200 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold text-pink-600 text-sm mb-3 flex items-center gap-2">
              <Cake className="w-4 h-4" /> Cumpleaños del Mes
            </h3>
            {adminBirthdays.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(() => {
                  const currentMonth = new Date().getMonth();
                  return adminBirthdays
                    .filter((b: Birthday) => new Date(b.date).getMonth() === currentMonth)
                    .map((b: Birthday) => (
                      <div key={b.id} className="text-xs p-2 bg-pink-50 rounded border border-pink-100">
                        <p className="font-semibold text-gray-700">{b.name}</p>
                        <p className="text-gray-400">{format(new Date(b.date), "dd 'de' MMMM", { locale: es })}</p>
                      </div>
                    ));
                })()}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Sin cumpleaños este mes</p>
            )}
          </div>
        </div>
      </div>

      {/* Tareas Sincronizadas */}
      <section className="mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#0778AC]">Tareas de Seguimiento</h2>
            <div className="h-1 bg-gradient-to-r from-[#0778AC] to-transparent w-24 rounded-full mt-1"></div>
          </div>
          <button
            onClick={() => setNewTaskModalOpen(true)}
            className="bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Cargar Nueva Tarea
          </button>
        </div>

        {pendingTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#CF3438] transition-colors">{task.title}</h3>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md uppercase tracking-wider">Pendiente</span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                    Asignado: {task.assignedTo}
                  </span>
                  <span className="text-xs font-semibold bg-gray-50 text-gray-500 px-3 py-1 rounded-lg">
                    Origen: {task.registeredBy}
                  </span>
                </div>
                {task.observations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-[#0778AC]">
                    <div className="w-2 h-2 bg-[#0778AC] rounded-full animate-pulse"></div>
                    <p className="text-xs font-bold">
                      {task.observations.length} observación{task.observations.length !== 1 ? "es" : ""} reciente{task.observations.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No hay tareas pendientes en este momento</p>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Tareas Finalizadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-green-50/50 border-2 border-green-100 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer opacity-75 hover:opacity-100"
                >
                  <h4 className="font-bold text-gray-700 text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

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