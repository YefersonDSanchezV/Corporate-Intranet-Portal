import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { BookOpen, Download } from "lucide-react";
import { Button } from "../ui/button";

interface InstitutionalManualsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstitutionalManualsModal({ isOpen, onClose }: InstitutionalManualsModalProps) {
  const manuals = [
    {
      category: "Manuales Clínicos",
      items: [
        { name: "Manual de Procedimientos Médicos", version: "v3.2", date: "Marzo 2026", file: "manual_proc_medicos.pdf" },
        { name: "Manual de Protocolos de Atención Cardiovascular", version: "v2.5", date: "Febrero 2026", file: "manual_prot_cardiovascular.pdf" },
        { name: "Manual de Procedimientos de Enfermería", version: "v4.1", date: "Enero 2026", file: "manual_proc_enfermeria.pdf" },
        { name: "Manual de Atención en Urgencias", version: "v3.0", date: "Marzo 2026", file: "manual_urgencias.pdf" },
      ]
    },
    {
      category: "Manuales de Calidad",
      items: [
        { name: "Manual del Sistema de Gestión de Calidad", version: "v5.0", date: "Enero 2026", file: "manual_sgc.pdf" },
        { name: "Manual de Procedimientos de Auditoría Interna", version: "v2.8", date: "Febrero 2026", file: "manual_auditoria.pdf" },
        { name: "Manual de Gestión de Riesgos", version: "v3.3", date: "Marzo 2026", file: "manual_riesgos.pdf" },
        { name: "Manual de Mejoramiento Continuo", version: "v2.1", date: "Diciembre 2025", file: "manual_mejoramiento.pdf" },
      ]
    },
    {
      category: "Manuales Administrativos",
      items: [
        { name: "Manual de Funciones y Competencias", version: "v4.0", date: "Enero 2026", file: "manual_funciones.pdf" },
        { name: "Manual de Procedimientos Administrativos", version: "v3.5", date: "Febrero 2026", file: "manual_proc_admin.pdf" },
        { name: "Manual de Gestión Documental", version: "v2.9", date: "Marzo 2026", file: "manual_gest_documental.pdf" },
        { name: "Manual de Archivo y Correspondencia", version: "v2.3", date: "Enero 2026", file: "manual_archivo.pdf" },
      ]
    },
    {
      category: "Manuales de Seguridad",
      items: [
        { name: "Manual de Bioseguridad", version: "v4.2", date: "Marzo 2026", file: "manual_bioseguridad.pdf" },
        { name: "Manual de Seguridad del Paciente", version: "v3.8", date: "Febrero 2026", file: "manual_seg_paciente.pdf" },
        { name: "Manual de Salud Ocupacional", version: "v3.1", date: "Enero 2026", file: "manual_salud_ocupacional.pdf" },
        { name: "Manual de Plan de Emergencias", version: "v2.6", date: "Marzo 2026", file: "manual_emergencias.pdf" },
      ]
    },
  ];

  const handleDownload = (fileName: string) => {
    console.log(`Descargando: ${fileName}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0778AC] text-xl flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Manuales Institucionales - ICVC
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información del modal
          </DialogDescription>
          <p className="text-sm text-gray-600 mt-2">
            Repositorio de manuales, protocolos y procedimientos institucionales
          </p>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {manuals.map((category, catIndex) => (
            <div key={catIndex}>
              <h3 className="font-semibold text-[#CF3438] text-lg mb-4 pb-2 border-b-2 border-gray-200 flex items-center gap-2">
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.items.map((manual, manIndex) => (
                  <div
                    key={manIndex}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all group gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-gradient-to-br from-[#0778AC] to-[#0891d1] rounded-lg p-3 shadow-md group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">{manual.name}</h4>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {manual.version}
                          </span>
                          <span>Actualizado: {manual.date}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(manual.file)}
                      className="bg-[#CF3438] hover:bg-[#b82d31] text-white"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
