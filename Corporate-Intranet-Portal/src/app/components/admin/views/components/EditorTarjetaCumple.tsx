import { useEffect, useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import { filesApi } from "../../../../api/files";
import { POSICION_DEFECTO, type PosicionFoto } from "../../../../api/plantillas";
import { TarjetaCumplePreview } from "./TarjetaCumplePreview";

interface Props {
  /** Plantilla seleccionada (archivo del fondo). */
  plantillaArchivoOid?: number | null;
  /** Posición inicial de la foto. */
  posicion?: PosicionFoto | null;
  /** Foto del cumplañero ya cargada (archivo del backend o vista local). */
  fotoArchivoOid?: number | null;
  fotoLocal?: string;
  nombre: string;
  fechaCumpleanos?: string;
  edad?: number;
  cargo?: string | null;
  disabled?: boolean;
  onPosicionChange?: (posicion: PosicionFoto) => void;
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

const CAMPOS: Array<{ key: keyof Omit<PosicionFoto, "redondo">; label: string }> = [
  { key: "px", label: "Posición horizontal (X %)" },
  { key: "py", label: "Posición vertical (Y %)" },
  { key: "ancho", label: "Ancho de la foto (%)" },
  { key: "alto", label: "Alto de la foto (%)" },
];

/**
 * Editor de la tarjeta: vista previa con la foto superpuesta a la plantilla y
 * controles numéricos para ajustar la posición en porcentaje.
 */
export function EditorTarjetaCumple({
  plantillaArchivoOid,
  posicion,
  fotoArchivoOid,
  fotoLocal,
  nombre,
  fechaCumpleanos,
  edad,
  cargo,
  disabled = false,
  onPosicionChange,
}: Props) {
  const base = posicion ?? POSICION_DEFECTO;
  const fotoBackend = useArchivoUrl(fotoArchivoOid);
  const fotoSrc = fotoLocal || fotoBackend;

  const setValor = (key: keyof Omit<PosicionFoto, "redondo">, valor: number) => {
    const numero = Number.isFinite(valor) ? Math.min(100, Math.max(0, valor)) : 0;
    onPosicionChange?.({ ...base, [key]: numero });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <div>
        {fotoSrc ? (
          <div className="relative w-full aspect-[16/9] rounded-lg border-2 border-gray-100 bg-gray-50 overflow-hidden">
            <TarjetaFondo plantillaArchivoOid={plantillaArchivoOid} />
            <div
              className="absolute"
              style={{
                left: `${base.px}%`,
                top: `${base.py}%`,
                width: `${base.ancho}%`,
                height: `${base.alto}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <img
                src={fotoSrc}
                alt={`Foto de ${nombre}`}
                className={`w-full h-full object-cover border-2 border-white shadow-md ${
                  base.redondo ? "rounded-full" : "rounded-lg"
                }`}
              />
            </div>
            <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-2">
              <p className="text-white font-bold text-sm truncate">{nombre || "Nombre del funcionario"}</p>
              <p className="text-white/80 text-[11px]">
                {fechaCumpleanos ? `${fechaCumpleanos} · ` : ""}Cumple {edad ?? 0} años
                {cargo ? ` · ${cargo}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <TarjetaCumplePreview
            data={{ nombreCompleto: nombre || "Nombre del funcionario", fechaCumpleanos: fechaCumpleanos ?? "", edad: edad ?? 0, cargo, fotoArchivoOid }}
            plantillaArchivoOid={plantillaArchivoOid}
            posicion={base}
            emptyLabel="Seleccione la plantilla o cargue la foto para ver la tarjeta"
          />
        )}
      </div>

      <div className="space-y-3">
        {CAMPOS.map((campo) => (
          <div key={campo.key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{campo.label}</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={base[campo.key]}
                disabled={disabled}
                onChange={(e) => setValor(campo.key, Number(e.target.value))}
                className="flex-1 accent-[#0778AC]"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={base[campo.key]}
                disabled={disabled}
                onChange={(e) => setValor(campo.key, Number(e.target.value))}
                className="w-20 border-2 border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-[#0778AC] disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>
        ))}
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 pt-1">
          <input
            type="checkbox"
            checked={base.redondo}
            disabled={disabled}
            onChange={(e) => onPosicionChange?.({ ...base, redondo: e.target.checked })}
            className="w-4 h-4 accent-[#0778AC]"
          />
          Foto redonda
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPosicionChange?.({ ...POSICION_DEFECTO })}
          className="text-xs font-semibold text-[#0778AC] hover:underline disabled:opacity-40"
        >
          Restablecer posición
        </button>
        <p className="text-[11px] text-gray-400 flex items-start gap-1.5 pt-1">
          <Upload className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          Los valores son porcentajes sobre la plantilla, así que la tarjeta se ve igual en cualquier pantalla.
        </p>
      </div>
    </div>
  );
}

function TarjetaFondo({ plantillaArchivoOid }: { plantillaArchivoOid?: number | null }) {
  const src = useArchivoUrl(plantillaArchivoOid);
  if (!src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
        <ImageIcon className="w-8 h-8 mb-2" />
        <p className="text-xs">Vista previa</p>
      </div>
    );
  }
  return <img src={src} alt="Plantilla de cumpleaños" className="absolute inset-0 w-full h-full object-contain" />;
}
