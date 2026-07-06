import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { FileText, Download } from "lucide-react";
import { Button } from "../ui/button";

interface InternalDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InternalDocumentationModal({ isOpen, onClose }: InternalDocumentationModalProps) {
  const documents = [
    {
      category: "Políticas Institucionales",
      files: [
        { name: "Política de Seguridad del Paciente", file: "politica_seguridad_paciente.pdf" },
        { name: "Política de Calidad", file: "politica_calidad.pdf" },
        { name: "Política de Bioseguridad", file: "politica_bioseguridad.pdf" },
        { name: "Política de Humanización", file: "politica_humanizacion.pdf" },
      ]
    },
    {
      category: "Identidad Corporativa",
      files: [
        { name: "Misión Institucional", file: "mision_icvc.pdf" },
        { name: "Visión Institucional", file: "vision_icvc.pdf" },
        { name: "Valores Corporativos", file: "valores_icvc.pdf" },
        { name: "Código de Ética y Conducta", file: "codigo_etica.pdf" },
      ]
    },
    {
      category: "Reglamentos",
      files: [
        { name: "Reglamento Interno de Trabajo", file: "reglamento_trabajo.pdf" },
        { name: "Reglamento de Higiene y Seguridad", file: "reglamento_seguridad.pdf" },
        { name: "Manual de Convivencia", file: "manual_convivencia.pdf" },
      ]
    },
    {
      category: "Procedimientos",
      files: [
        { name: "Procedimientos Administrativos", file: "proc_administrativos.pdf" },
        { name: "Procedimientos de Facturación", file: "proc_facturacion.pdf" },
        { name: "Procedimientos de Gestión Documental", file: "proc_gestion_documental.pdf" },
      ]
    },
  ];

  const handleDownload = (fileName: string) => {
    console.log(`Descargando: ${fileName}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0778AC] text-xl">
            Documentación Interna - ICVC
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información del modal
          </DialogDescription>
          <p className="text-sm text-gray-600 mt-2">
            Políticas, misión, visión, valores y documentos institucionales
          </p>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {documents.map((category, catIndex) => (
            <div key={catIndex}>
              <h3 className="font-semibold text-[#CF3438] text-lg mb-3 pb-2 border-b-2 border-gray-200">
                {category.category}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {category.files.map((doc, docIndex) => (
                  <div
                    key={docIndex}
                    className="flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-[#0778AC] to-[#0891d1] rounded-lg p-2 shadow-md group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-800">{doc.name}</span>
                    </div>
                    <Button
                      onClick={() => handleDownload(doc.file)}
                      variant="ghost"
                      size="sm"
                      className="text-[#CF3438] hover:text-[#b82d31] hover:bg-red-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
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
