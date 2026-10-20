import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Image as ImageIcon, User } from "lucide-react";
import { filesApi } from "../../../../api/files";
import { POSICION_DEFECTO, type PosicionFoto } from "../../../../api/plantillas";

export interface TarjetaCumpleData {
  nombreCompleto: string;
  /** ISO yyyy-MM-dd del cumpleaños en el año actual. */
  fechaCumpleanos: string;
  edad: number;
  cargo?: string | null;
  fotoArchivoOid?: number | null;
}

function useArchivoUrl(oid?: number | null): string {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    let url = "";
    if (oid == null) {
      setSrc("");
      return;
    }
    (async () => {
      try {
        const res = await filesApi.download(String(oid));
        if (!res.ok || !active) return;
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        if (active) setSrc(url);
      } catch {
        if (active) setSrc("");
      }
    })();
    return () => {
      active = false;
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // noop
        }
      }
    };
  }, [oid]);
  return src;
}

/**
 * Tarjeta de cumpleaños: la plantilla como fondo y encima la foto del funcionario
 * con sus datos. La posición de la foto se interpreta siempre en porcentaje sobre
 * el tamaño real del contenedor, así que la vista previa coincide con la tarjeta
 * publicada sin importar la resolución.
 */
export function TarjetaCumplePreview({
  data,
  plantillaArchivoOid,
  posicion,
  emptyLabel = "Seleccione una plantilla para ver la tarjeta",
}: {
  data: TarjetaCumpleData;
  plantillaArchivoOid?: number | null;
  posicion?: PosicionFoto | null;
  emptyLabel?: string;
}) {
  const plantillaSrc = useArchivoUrl(plantillaArchivoOid);
  const fotoSrc = useArchivoUrl(data.fotoArchivoOid);
  const pos = posicion ?? POSICION_DEFECTO;

  const fecha = data.fechaCumpleanos
    ? format(new Date(`${data.fechaCumpleanos}T00:00:00`), "d 'de' MMMM", { locale: es })
    : "";

  return (
    <div className="relative w-full aspect-[16/9] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
      {plantillaSrc ? (
        <img src={plantillaSrc} alt="Plantilla de cumpleaños" className="absolute inset-0 w-full h-full object-contain" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-8 h-8 mb-2" />
          <p className="text-xs px-4 text-center">{emptyLabel}</p>
        </div>
      )}

      {plantillaSrc && (
        <div
          className="absolute"
          style={{
            left: `${pos.px}%`,
            top: `${pos.py}%`,
            width: `${pos.ancho}%`,
            height: `${pos.alto}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className={`w-full h-full overflow-hidden bg-white/80 border-2 border-white shadow-md flex items-center justify-center ${
              pos.redondo ? "rounded-full" : "rounded-lg"
            }`}
          >
            {fotoSrc ? (
              <img src={fotoSrc} alt={`Foto de ${data.nombreCompleto}`} className="w-full h-full object-cover" />
            ) : (
              <User className="w-1/3 h-1/3 text-[#0778AC]" />
            )}
          </div>
        </div>
      )}

      {plantillaSrc && (
        <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
          <p className="text-white font-bold text-sm truncate">{data.nombreCompleto}</p>
          <p className="text-white/80 text-xs">
            {fecha} · Cumple {data.edad} años{data.cargo ? ` · ${data.cargo}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
