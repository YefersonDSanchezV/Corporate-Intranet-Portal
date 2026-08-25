import { Bell, CheckCircle, ClipboardCheck, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";
import { useSystem } from "../../../contexts/SystemContext";

export function DashboardComunicacionesView() {
  const { announcements, publishedAnnouncements } = useAnnouncements();
  const { tasks } = useSystem();

  const pendingAnnouncements = announcements.filter(a => !a.published);
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const activeAnnouncements = publishedAnnouncements.filter(a => {
    const now = new Date();
    return now >= a.startDate && now <= a.endDate;
  });

  const stats = [
    { label: "Anuncios Activos", value: activeAnnouncements.length, icon: Megaphone, color: "bg-green-500" },
    { label: "Pendientes aprobacion", value: pendingAnnouncements.length, icon: Bell, color: "bg-amber-500" },
    { label: "Tareas Pendientes", value: pendingTasks.length, icon: ClipboardCheck, color: "bg-blue-500" },
    { label: "Tareas Completadas", value: completedTasks.length, icon: CheckCircle, color: "bg-purple-500" },
  ];

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Dashboard de Comunicaciones</h1>
        <p className="text-gray-600 text-sm">Resumen general del modulo de comunicaciones.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-[#0778AC] mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Anuncios Pendientes
          </h2>
          {pendingAnnouncements.length > 0 ? (
            <div className="space-y-3">
              {pendingAnnouncements.slice(0, 5).map(ann => (
                <div key={ann.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                  <p className="font-semibold text-sm text-gray-800">{ann.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Creado: {format(ann.createdAt, "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No hay anuncios pendientes</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-[#0778AC] mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" /> Tareas Recientes
          </h2>
          {pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {pendingTasks.slice(0, 5).map(task => (
                <div key={task.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                  <p className="font-semibold text-sm text-gray-800">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">Asignado a: {task.assignedTo}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No hay tareas pendientes</p>
          )}
        </div>
      </div>
    </div>
  );
}