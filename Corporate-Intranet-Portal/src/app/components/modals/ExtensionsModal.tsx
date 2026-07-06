import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Phone } from "lucide-react";

interface ExtensionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExtensionsModal({ isOpen, onClose }: ExtensionsModalProps) {
  const extensions = [
    { area: "Recepción Principal", ext: "100" },
    { area: "Urgencias", ext: "101" },
    { area: "UCI - Unidad de Cuidados Intensivos", ext: "102" },
    { area: "Cardiología", ext: "103" },
    { area: "Quirófano", ext: "104" },
    { area: "Laboratorio Clínico", ext: "105" },
    { area: "Imágenes Diagnósticas", ext: "106" },
    { area: "Farmacia", ext: "107" },
    { area: "Administración", ext: "108" },
    { area: "Recursos Humanos", ext: "109" },
    { area: "Contabilidad", ext: "110" },
    { area: "Sistemas e Informática", ext: "111" },
    { area: "Mantenimiento", ext: "112" },
    { area: "Gestión de Calidad", ext: "113" },
    { area: "Facturación", ext: "114" },
    { area: "Admisiones", ext: "115" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0778AC] text-xl">
            Extensiones Telefónicas - ICVC
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información del modal
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
          {extensions.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all"
            >
              <div className="bg-gradient-to-br from-[#CF3438] to-[#e74c3c] rounded-full p-3 shadow-md">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{item.area}</p>
                <p className="text-[#0778AC] font-bold text-lg">Ext. {item.ext}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
