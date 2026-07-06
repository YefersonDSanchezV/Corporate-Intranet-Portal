import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Calendar, Bell } from "lucide-react";
import { Badge } from "../ui/badge";

interface InternalAnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InternalAnnouncementsModal({ isOpen, onClose }: InternalAnnouncementsModalProps) {
  const announcements = [
    {
      title: "Reserva de Sala de Juntas",
      description: "Se ha reservado la sala de juntas principal para el día 25 de marzo de 2026 de 9:00 AM a 12:00 PM para la reunión de Comité de Calidad.",
      date: "22 de Marzo, 2026",
      type: "Reserva",
      priority: "normal"
    },
    {
      title: "Evento: Jornada de Actualización Cardiovascular",
      description: "Se realizará una jornada de actualización en procedimientos cardiovasculares el día 28 de marzo de 2026 en el auditorio principal. Asistencia obligatoria para el personal médico del área de cardiología.",
      date: "20 de Marzo, 2026",
      type: "Evento",
      priority: "high"
    },
    {
      title: "Reevaluación de Exámenes Médicos Ocupacionales",
      description: "Se informa a todo el personal que durante el mes de abril se llevará a cabo la reevaluación de exámenes médicos ocupacionales. Por favor comunicarse con el área de recursos humanos para agendar su cita.",
      date: "19 de Marzo, 2026",
      type: "Salud Ocupacional",
      priority: "high"
    },
    {
      title: "Mantenimiento Programado de Sistemas",
      description: "El día 26 de marzo de 2026 de 11:00 PM a 2:00 AM se realizará mantenimiento programado en los servidores. Los sistemas DGH y Enterprise no estarán disponibles durante este período.",
      date: "18 de Marzo, 2026",
      type: "Sistemas",
      priority: "urgent"
    },
    {
      title: "Capacitación: Nuevo Protocolo de Atención",
      description: "Se convoca a capacitación sobre el nuevo protocolo de atención al paciente cardiovascular el 30 de marzo de 2026 a las 2:00 PM en la sala de capacitaciones.",
      date: "17 de Marzo, 2026",
      type: "Capacitación",
      priority: "normal"
    },
    {
      title: "Actualización de Políticas Institucionales",
      description: "Se han actualizado las políticas de seguridad del paciente y bioseguridad. Todo el personal debe revisar los documentos en el módulo de gestión administrativa antes del 31 de marzo.",
      date: "15 de Marzo, 2026",
      type: "Políticas",
      priority: "high"
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0778AC] text-xl flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Comunicados Internos
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información del modal
          </DialogDescription>
          <p className="text-sm text-gray-600 mt-2">
            Información y anuncios del área administrativa
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {announcements.map((announcement, index) => (
            <div
              key={index}
              className="p-4 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <Badge className={`${getPriorityColor(announcement.priority)} border`}>
                  {announcement.type}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {announcement.date}
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                {announcement.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {announcement.description}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
