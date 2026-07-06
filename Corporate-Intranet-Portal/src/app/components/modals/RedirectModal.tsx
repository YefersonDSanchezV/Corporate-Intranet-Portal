import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface RedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalName: string;
  portalUrl?: string;
}

export function RedirectModal({ isOpen, onClose, portalName, portalUrl }: RedirectModalProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (portalUrl) {
              window.open(portalUrl, "_blank");
            } else {
              // Si no hay URL, simulamos una redirección interna o a una URL por defecto
              console.log(`Redirigiendo a ${portalName}...`);
            }
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, onClose, portalName, portalUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="bg-[#0778AC] p-6 text-white flex items-center justify-between rounded-t-xl">
          <div>
            <h3 className="font-bold text-xl">Redirigiendo...</h3>
            <p className="text-blue-100 text-xs mt-1">Será redirigido al portal seleccionado en unos segundos</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <Loader2 className="w-16 h-16 text-[#CF3438] animate-spin" />
          <p className="text-center text-gray-700">
            En un momento será redirigido al portal seleccionado:
          </p>
          <p className="text-xl font-semibold text-[#0778AC] text-center">{portalName}</p>
          <p className="text-sm text-gray-500">Redirigiendo en {countdown} segundos...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
