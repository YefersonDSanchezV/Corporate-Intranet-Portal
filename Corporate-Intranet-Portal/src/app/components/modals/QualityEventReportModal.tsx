import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { AlertTriangle, CheckCircle, Clock, User } from "lucide-react";
import { Badge } from "../ui/badge";

interface QualityEventReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QualityEventReportModal({ isOpen, onClose }: QualityEventReportModalProps) {
  const eventReports = [
    {
      id: "EVT-2026-045",
      title: "Caída de paciente en área de hospitalización",
      area: "Hospitalización - Piso 3",
      reporter: "María López - Enfermera Jefe",
      date: "20 de Marzo, 2026",
      severity: "Moderado",
      status: "En investigación",
      description: "Paciente de 68 años sufrió caída al levantarse de la cama sin asistencia. Sin lesiones graves reportadas.",
      actions: "Se reforzó protocolo de acompañamiento y se instalaron barandas adicionales."
    },
    {
      id: "EVT-2026-044",
      title: "Error en medicación - Dosis incorrecta",
      area: "UCI",
      reporter: "Carlos Ruiz - Médico Intensivista",
      date: "19 de Marzo, 2026",
      severity: "Alto",
      status: "Cerrado",
      description: "Se administró dosis incorrecta de anticoagulante. Error detectado a tiempo y corregido inmediatamente.",
      actions: "Capacitación al personal sobre verificación de dosis. Implementación de doble verificación."
    },
    {
      id: "EVT-2026-043",
      title: "Falla en equipo de ventilación mecánica",
      area: "UCI",
      reporter: "Ana Gómez - Terapia Respiratoria",
      date: "18 de Marzo, 2026",
      severity: "Crítico",
      status: "Resuelto",
      description: "Ventilador mecánico presentó falla durante uso. Paciente trasladado a equipo de respaldo sin incidentes.",
      actions: "Equipo enviado a mantenimiento correctivo. Actualización de protocolo de mantenimiento preventivo."
    },
    {
      id: "EVT-2026-042",
      title: "Demora en entrega de resultados de laboratorio",
      area: "Laboratorio Clínico",
      reporter: "Luis Martínez - Coordinador de Laboratorio",
      date: "17 de Marzo, 2026",
      severity: "Bajo",
      status: "En seguimiento",
      description: "Resultados de laboratorio entregados 3 horas después del tiempo estándar por sobrecarga de trabajo.",
      actions: "Análisis de capacidad instalada y evaluación de contratación de personal adicional."
    },
    {
      id: "EVT-2026-041",
      title: "Reacción adversa a medicamento",
      area: "Urgencias",
      reporter: "Sandra Torres - Médico Urgencias",
      date: "16 de Marzo, 2026",
      severity: "Moderado",
      status: "Resuelto",
      description: "Paciente presentó reacción alérgica a antibiótico. Atendido inmediatamente sin complicaciones.",
      actions: "Actualización de historia clínica con alergias. Reporte a farmacovigilancia."
    },
    {
      id: "EVT-2026-040",
      title: "Infección del sitio quirúrgico",
      area: "Cirugía",
      reporter: "Jorge Silva - Cirujano Cardiovascular",
      date: "15 de Marzo, 2026",
      severity: "Alto",
      status: "En investigación",
      description: "Paciente desarrolló infección en sitio quirúrgico 5 días post-cirugía.",
      actions: "Revisión de protocolos de asepsia y antisepsia. Cultivo enviado a microbiología."
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Crítico":
        return "bg-red-100 text-red-800 border-red-300";
      case "Alto":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Moderado":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resuelto":
      case "Cerrado":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "En investigación":
      case "En seguimiento":
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resuelto":
      case "Cerrado":
        return "bg-green-100 text-green-800 border-green-300";
      case "En investigación":
      case "En seguimiento":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#CF3438] text-xl flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Reporte de Eventos Adversos - Gestión de Calidad
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información del modal
          </DialogDescription>
          <p className="text-sm text-gray-600 mt-2">
            Eventos reportados por el personal ante incidencias o eventos adversos
          </p>
        </DialogHeader>

        <div className="bg-blue-50 border-l-4 border-[#0778AC] p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700">
            <strong>Total de eventos reportados este mes:</strong> {eventReports.length}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <strong>Eventos críticos:</strong> {eventReports.filter(e => e.severity === "Crítico").length} | 
            <strong className="ml-2">Eventos pendientes:</strong> {eventReports.filter(e => e.status === "En investigación" || e.status === "En seguimiento").length}
          </p>
        </div>

        <div className="space-y-4 py-4">
          {eventReports.map((event, index) => (
            <div
              key={index}
              className="p-4 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(event.status)}
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {event.id}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getSeverityColor(event.severity)} border`}>
                    {event.severity}
                  </Badge>
                  <Badge className={`${getStatusColor(event.status)} border`}>
                    {event.status}
                  </Badge>
                </div>
              </div>

              <h4 className="font-semibold text-gray-800 mb-2">{event.title}</h4>

              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Área:</span>
                  <span className="font-medium text-gray-800">{event.area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{event.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm mb-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Reportado por: {event.reporter}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <p className="text-sm text-gray-500 mb-1">Descripción del evento:</p>
                <p className="text-sm text-gray-700">{event.description}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-[#0778AC]">
                <p className="text-sm text-gray-500 mb-1">Acciones tomadas:</p>
                <p className="text-sm text-gray-700 font-medium">{event.actions}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
