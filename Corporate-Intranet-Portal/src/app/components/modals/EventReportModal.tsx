import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Badge } from "../ui/badge";

interface EventReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventReportModal({ isOpen, onClose }: EventReportModalProps) {
  const reports = [
    {
      area: "Área de Urgencias",
      indicator: "Tiempo de espera promedio",
      status: "good",
      value: "15 minutos",
      deadline: "30 de Marzo, 2026",
      comment: "Indicador dentro de los parámetros establecidos"
    },
    {
      area: "UCI",
      indicator: "Tasa de infecciones nosocomiales",
      status: "warning",
      value: "3.2%",
      deadline: "30 de Marzo, 2026",
      comment: "Ligeramente por encima del límite aceptable (3%)"
    },
    {
      area: "Quirófano",
      indicator: "Cumplimiento lista de chequeo quirúrgico",
      status: "good",
      value: "98%",
      deadline: "30 de Marzo, 2026",
      comment: "Excelente cumplimiento del protocolo"
    },
    {
      area: "Cardiología",
      indicator: "Satisfacción del paciente",
      status: "good",
      value: "96%",
      deadline: "30 de Marzo, 2026",
      comment: "Indicador sobresaliente"
    },
    {
      area: "Laboratorio Clínico",
      indicator: "Tiempo de entrega de resultados",
      status: "critical",
      value: "4.5 horas",
      deadline: "30 de Marzo, 2026",
      comment: "Por encima del tiempo meta de 2 horas. Requiere acción inmediata"
    },
    {
      area: "Farmacia",
      indicator: "Disponibilidad de medicamentos",
      status: "good",
      value: "99.5%",
      deadline: "30 de Marzo, 2026",
      comment: "Indicador óptimo"
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "critical":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-100 text-green-800 border-green-300";
      case "warning":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "good":
        return "Bien";
      case "warning":
        return "Atención";
      case "critical":
        return "Crítico";
      default:
        return "N/A";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#CF3438] text-xl flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Reporte de Eventos e Indicadores
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información del modal
          </DialogDescription>
          <p className="text-sm text-gray-600 mt-2">
            Estado de indicadores reportados por las diferentes áreas
          </p>
        </DialogHeader>

        <div className="bg-blue-50 border-l-4 border-[#0778AC] p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-[#0778AC] font-semibold mb-1">
            <Clock className="w-5 h-5" />
            Fecha límite para subir indicadores
          </div>
          <p className="text-gray-700">30 de Marzo de 2026 - 11:59 PM</p>
        </div>

        <div className="space-y-4 py-4">
          {reports.map((report, index) => (
            <div
              key={index}
              className="p-4 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(report.status)}
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {report.area}
                  </h3>
                </div>
                <Badge className={`${getStatusColor(report.status)} border`}>
                  {getStatusText(report.status)}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-sm text-gray-500">Indicador</p>
                  <p className="font-medium text-gray-800">{report.indicator}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor Reportado</p>
                  <p className="font-bold text-[#0778AC] text-lg">{report.value}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{report.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
