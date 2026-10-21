import { Cake, Eye, Loader2, Pencil, Plus, Save, Search, Trash2, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ApiError } from "../../../api/client";
import { cumpleaniosApi, type CumpleaniosRegistro } from "../../../api/cumpleanios";
import { filesApi } from "../../../api/files";
import { MESES_CORTOS, plantillasCumpleaniosApi, POSICION_DEFECTO, type PlantillaCumpleanios, type PosicionFoto } from "../../../api/plantillas";
import { useBirthdays } from "../../../hooks/useBirthdays";
import { EDAD_MAXIMA, EDAD_MINIMA, isValidBirthDate } from "../../../utils/birthdays";
import { noPermissionReason } from "../AccessGate";
import { useAdminAccess } from "../useAdminAccess";
import { EditorTarjetaCumple } from "./components/EditorTarjetaCumple";
import { TarjetaCumplePreview } from "./components/TarjetaCumplePreview";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function CumpleaniosComunicacionesView() {
  const { can } = useAdminAccess();
  const canGrabar = can("comunicaciones-cumpleanios", "grabar");
  const canActualizar = can("comunicaciones-cumpleanios", "actualizar");
  const canEliminar = can("comunicaciones-cumpleanios", "eliminar");

  // Automáticos + manuales en una sola lista (misma fuente que el calendario).
  const { birthdays, loading: loadingBirthdays, addManual, updateManual, removeManual } = useBirthdays();

  const [tarjetas, setTarjetas] = useState<Record<string, CumpleaniosRegistro>>({});
  const [plantillas, setPlantillas] = useState<PlantillaCumpleanios[]>([]);

  const [mes, setMes] = useState<number>(new Date().getMonth());
  const [busqueda, setBusqueda] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [recargando, setRecargando] = useState(false);

  // Modal de consulta + tarjeta
  const [detalle, setDetalle] = useState<CumpleaniosRegistro | null>(null);

  // Modal de creación/edición
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CumpleaniosRegistro | null>(null);
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [cargo, setCargo] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [configTarjeta, setConfigTarjeta] = useState<ConfigTarjeta | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoArchivoOid, setFotoArchivoOid] = useState<number | null>(null);
  const [fotoError, setFotoError] = useState("");
  const [plantillaOid, setPlantillaOid] = useState<number | null>(null);
  const [posicion, setPosicion] = useState<PosicionFoto>({ ...POSICION_DEFECTO });
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const cargarTarjetas = async () => {
    setRecargando(true);
    try {
      const data = await cumpleaniosApi.list();
      setTarjetas(Object.fromEntries(data.map((r) => [r.id, r])));
    } catch {
      // La tabla sigue funcionando con la fuente del calendario.
    } finally {
      setRecargando(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        setPlantillas(await plantillasCumpleaniosApi.list());
      } catch {
        setPlantillas([]);
      }
      await cargarTarjetas();
    })();
  }, []);

  /** Fusiona el registro del calendario con la configuración de tarjeta del backend. */
  const filas = useMemo(() => {
    return birthdays.map((b) => ({
      b,
      tarjeta: tarjetas[b.id],
    }));
  }, [birthdays, tarjetas]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(({ b, tarjeta }) => {
      if (parseISO(b.fechaCumpleanos).getMonth() !== mes) return false;
      if (!q) return true;
      const cargoTexto = (tarjeta?.cargo ?? b.area ?? "").toLowerCase();
      return b.nombreCompleto.toLowerCase().includes(q) || cargoTexto.includes(q);
    });
  }, [filas, mes, busqueda]);

  const revokePreview = (url: string) => {
    if (url.startsWith("blob:")) {
      try { URL.revokeObjectURL(url); } catch { /* noop */ }
    }
  };

  const handleFotoChange = (file: File | null) => {
    setFotoError("");
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png"];
    const extOk = /\.(jpe?g|png)$/i.test(file.name);
    if (!validTypes.includes(file.type) && !extOk) {
      setFotoError("La foto debe ser JPG o PNG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFotoError("La foto no puede superar 2MB.");
      return;
    }
    setFotoFile(file);
    setFotoPreview((prev) => {
      if (prev) revokePreview(prev);
      return URL.createObjectURL(file);
    });
  };

  const limpiarFormulario = () => {
    setNombre("");
    setFechaNacimiento("");
    setCargo("");
    setFormError("");
    setFotoFile(null);
    setFotoArchivoOid(null);
    setFotoError("");
    setPlantillaOid(null);
    setPosicion({ ...POSICION_DEFECTO });
    setFotoPreview((prev) => {
      if (prev) revokePreview(prev);
      return "";
    });
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  };

  const openCreate = () => {
    limpiarFormulario();
    setEditing(null);
    setShowForm(true);
  };

  /** Edición: los registros automáticos conservan los datos del perfil (solo foto y plantilla). */
  const openEdit = (registro: CumpleaniosRegistro) => {
    setEditing(registro);
    setNombre(registro.nombreCompleto);
    setFechaNacimiento(registro.fechaNacimiento.slice(0, 10));
    setCargo(registro.cargo ?? "");
    setFormError("");
    setFotoFile(null);
    setFotoError("");
    setFotoArchivoOid(registro.fotoArchivoOid ?? null);
    setPlantillaOid(registro.plantillaOid ?? null);
    setPosicion(
      registro.posicion
        ? { ...registro.posicion }
        : plantillas.find((p) => p.oid === registro.plantillaOid)?.foto
          ? { ...(plantillas.find((p) => p.oid === registro.plantillaOid)!.foto as PosicionFoto) }
          : { ...POSICION_DEFECTO },
    );
    setFotoPreview((prev) => {
      if (prev) revokePreview(prev);
      return "";
    });
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const subirFoto = async (): Promise<number | null> => {
    if (!fotoFile) return fotoArchivoOid;
    const res = await cumpleaniosApi.uploadFoto(fotoFile);
    if (!res.ok) throw new Error(`No se pudo subir la foto (${res.status})`);
    const data = await res.json().catch(() => null);
    const raw = data?.oid ?? data?.archivoOid ?? data?.id ?? data?.fileOid ?? data?.data?.oid;
    const oid = Number(raw);
    if (!Number.isFinite(oid)) throw new Error("El servidor no devolvió el identificador de la foto.");
    return oid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setNotice("");
    const automatico = editing?.origen === "sistema";

    if (!automatico) {
      if (!nombre.trim()) {
        setFormError("El nombre completo es obligatorio.");
        return;
      }
      if (!isValidBirthDate(fechaNacimiento)) {
        setFormError(
          `Fecha de nacimiento inválida: debe ser anterior a hoy y la edad estar entre ${EDAD_MINIMA} y ${EDAD_MAXIMA} años.`,
        );
        return;
      }
      if (!cargo.trim()) {
        setFormError("El cargo es obligatorio. Escríbelo libremente.");
        return;
      }
      if (!fotoFile && fotoArchivoOid == null) {
        setFotoError("La foto es obligatoria.");
        setFormError("Debe adjuntar una foto (JPG/PNG, máximo 2MB).");
        return;
      }
    }

    setSaving(true);
    try {
      const oidFoto = automatico ? fotoArchivoOid : await subirFoto();
      if (automatico) {
        if (!editing) return;
        const actualizado = await cumpleaniosApi.updateTarjeta(editing.oid, {
          fotoArchivoOid: oidFoto,
          plantillaOid,
          fotoPx: posicion.px,
          fotoPy: posicion.py,
          fotoAncho: posicion.ancho,
          fotoAlto: posicion.alto,
          fotoRedondo: posicion.redondo,
          fotoZoom: posicion.zoom ?? 1,
          fotoOffsetX: posicion.offsetX ?? 0,
          fotoOffsetY: posicion.offsetY ?? 0,
          ...(configTarjeta ? { config: JSON.stringify(configTarjeta) } : {}),
        });
        setTarjetas((prev) => ({ ...prev, [actualizado.id]: actualizado }));
        setNotice(`Tarjeta de ${editing.nombreCompleto} actualizada correctamente.`);
      } else {
        const body = {
          nombreCompleto: nombre.trim(),
          fechaNacimiento,
          cargo: cargo.trim(),
          fotoArchivoOid: oidFoto,
          plantillaOid,
          fotoPx: posicion.px,
          fotoPy: posicion.py,
          fotoAncho: posicion.ancho,
          fotoAlto: posicion.alto,
          fotoRedondo: posicion.redondo,
          fotoZoom: posicion.zoom ?? 1,
          fotoOffsetX: posicion.offsetX ?? 0,
          fotoOffsetY: posicion.offsetY ?? 0,
          ...(configTarjeta ? { config: JSON.stringify(configTarjeta) } : {}),
        };
        const res = editing
          ? await updateManual({ ...editing } as never, body)
          : await addManual(body);
        if (!res.ok) {
          setFormError(res.error || "No se pudo guardar el cumpleaños.");
          setSaving(false);
          return;
        }
        await cargarTarjetas();
        setNotice(editing ? "Cumpleaños actualizado correctamente." : "Cumpleaños registrado correctamente.");
      }
      limpiarFormulario();
      closeForm();
    } catch (e) {
      const msg = e instanceof ApiError || e instanceof Error ? e.message : "No se pudo guardar.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (registro: CumpleaniosRegistro) => {
    if (!window.confirm(`¿Eliminar el cumpleaños de ${registro.nombreCompleto}?`)) return;
    const b = birthdays.find((x) => x.id === registro.id);
    if (!b) return;
    const res = await removeManual(b);
    setNotice(res.ok ? "Cumpleaños eliminado correctamente." : res.error || "No se pudo eliminar.");
    if (res.ok) await cargarTarjetas();
  };

  const plantillaSeleccionada = plantillas.find((p) => p.oid === plantillaOid);
  /** Las plantillas temáticas del mes consultado aparecen primero. */
  const ordenados = useMemo(() => {
    const mesActual = mes + 1;
    const aplica = (p: PlantillaCumpleanios) => !p.meses || p.meses.length === 0 || p.meses.includes(mesActual);
    return [...plantillas].sort((a, b) => {
      const diferencia = Number(aplica(b)) - Number(aplica(a));
      return diferencia !== 0 ? diferencia : a.nombre.localeCompare(b.nombre, "es");
    });
  }, [plantillas, mes]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Cumpleaños</h1>
          <p className="text-gray-600 text-sm">
            Todos los cumpleaños registrados: automáticos de los usuarios activos y manuales. Consulte los datos del
            funcionario y previsualice su foto en la plantilla asignada.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={!canGrabar}
          title={canGrabar ? undefined : noPermissionReason("Cumpleaños", "grabar")}
          className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" /> Nuevo Cumpleaños
        </button>
      </div>

      {notice && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Cerrar aviso"><XCircle className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">{error}</div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o cargo..."
            className="flex-1 border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {MESES.map((nombreMes, i) => (
            <button
              key={nombreMes}
              onClick={() => setMes(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                mes === i ? "bg-[#0778AC] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {nombreMes.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de consulta */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700 text-sm">
            Registros de {MESES[mes]} ({filtrados.length})
          </h3>
          {recargando && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-sm font-semibold text-gray-600">Foto</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Nombre completo</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">Edad</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Fecha de cumpleaños</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Cargo</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Origen</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Plantilla</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(({ b, tarjeta }) => (
                <tr key={b.id} className={`hover:bg-gray-50 ${b.esHoy ? "bg-red-50/50" : ""}`}>
                  <td className="p-3"><MiniFoto oid={b.fotoArchivoOid} nombre={b.nombreCompleto} /></td>
                  <td className="p-3 font-semibold text-sm">
                    {b.nombreCompleto}
                    {b.esHoy && (
                      <span className="ml-2 text-[10px] bg-[#CF3438] text-white px-2 py-0.5 rounded-full font-bold">HOY</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-center">
                    <span className="inline-block bg-[#0778AC]/10 text-[#0778AC] font-bold px-2.5 py-1 rounded-full text-xs">
                      {b.edad} años
                    </span>
                  </td>
                  <td className="p-3 text-sm">{format(parseISO(b.fechaCumpleanos), "dd 'de' MMMM 'de' yyyy", { locale: es })}</td>
                  <td className="p-3 text-sm">{tarjeta?.cargo || b.area || "-"}</td>
                  <td className="p-3 text-sm">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        b.origen === "manual" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.origen === "manual" ? "MANUAL" : "AUTOMÁTICO"}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">{tarjeta?.plantillaNombre || "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setDetalle(tarjeta ?? registroDesdeBirthday(b.id, tarjeta, b))}
                        disabled={!tarjeta}
                        title="Consultar datos y previsualizar tarjeta"
                        aria-label="Consultar cumpleaños"
                        className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const registro = tarjeta ?? registroDesdeBirthday(b.id, tarjeta, b);
                          openEdit(registro);
                        }}
                        disabled={!canActualizar || (!tarjeta && b.origen !== "manual")}
                        title={canActualizar ? "Editar / asignar plantilla" : noPermissionReason("Cumpleaños", "actualizar")}
                        aria-label="Editar cumpleaños"
                        className="p-1.5 bg-blue-50 text-[#0778AC] hover:bg-blue-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {b.origen === "manual" && (
                        <button
                          onClick={() => handleDelete(tarjeta ?? registroDesdeBirthday(b.id, tarjeta, b))}
                          disabled={!canEliminar}
                          title={canEliminar ? "Eliminar" : noPermissionReason("Cumpleaños", "eliminar")}
                          aria-label="Eliminar cumpleaños"
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400 text-sm">
                    {loadingBirthdays ? "Cargando..." : "Sin resultados para este filtro."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de consulta + tarjeta */}
      {detalle && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Cake className="w-5 h-5" /> {detalle.nombreCompleto}
                </h3>
                <p className="text-white/70 text-xs mt-0.5">
                  {detalle.origen === "manual" ? "Registro manual" : "Usuario del sistema"} · Tarjeta de cumpleaños
                </p>
              </div>
              <button onClick={() => setDetalle(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <TarjetaCumplePreview
                  data={{
                    nombreCompleto: detalle.nombreCompleto,
                    fechaCumpleanos: detalle.fechaCumpleanos.slice(0, 10),
                    edad: detalle.edad,
                    cargo: detalle.cargo,
                    fotoArchivoOid: detalle.fotoArchivoOid,
                  }}
                  plantillaArchivoOid={detalle.plantillaArchivoOid}
                  posicion={detalle.posicion}
                  config={plantillas.find((p) => p.oid === detalle.plantillaOid)?.config ?? null}
                  frenteArchivoOid={plantillas.find((p) => p.oid === detalle.plantillaOid)?.frenteArchivoOid ?? null}
                  emptyLabel="Este cumpleaños no tiene plantilla asignada. Asígnela desde Editar."
                />
                <dl className="text-sm space-y-3">
                  <Dato label="Nombre completo" valor={detalle.nombreCompleto} />
                  {detalle.codigo && <Dato label="Usuario del sistema" valor={detalle.codigo} />}
                  <Dato label="Fecha de nacimiento" valor={format(parseISO(detalle.fechaNacimiento.slice(0, 10)), "dd/MM/yyyy")} />
                  <Dato label="Cumpleaños" valor={format(parseISO(detalle.fechaCumpleanos.slice(0, 10)), "dd 'de' MMMM 'de' yyyy", { locale: es })} />
                  <Dato label="Edad que cumple" valor={`${detalle.edad} años`} />
                  <Dato label="Cargo" valor={detalle.cargo || "-"} />
                  <Dato label="Plantilla" valor={detalle.plantillaNombre || "Sin asignar"} />
                  <Dato
                    label="Marco de la foto"
                    valor={
                      detalle.posicion
                        ? `X ${detalle.posicion.px}% · Y ${detalle.posicion.py}% · ${detalle.posicion.ancho}%×${detalle.posicion.alto}%${
                            (detalle.posicion.zoom ?? 1) > 1 ? ` · Zoom ${detalle.posicion.zoom}×` : ""
                          }`
                        : "-"
                    }
                  />
                </dl>
              </div>
              <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
                <button
                  onClick={() => {
                    openEdit(detalle);
                    setDetalle(null);
                  }}
                  disabled={!canActualizar}
                  title={canActualizar ? "Editar / asignar plantilla" : noPermissionReason("Cumpleaños", "actualizar")}
                  className="inline-flex items-center gap-2 border border-[#0778AC]/30 text-[#0778AC] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0778AC]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Pencil className="w-4 h-4" /> Asignar plantilla
                </button>
                <button
                  onClick={() => setDetalle(null)}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear / editar */}
      {showForm && (
        <div className="fixed inset-0 z-[310] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Cake className="w-5 h-5" />
                  {editing
                    ? editing.origen === "sistema"
                      ? `Tarjeta de cumpleaños — ${editing.nombreCompleto}`
                      : "Editar cumpleaños"
                    : "Nuevo Cumpleaños"}
                </h3>
                <p className="text-white/70 text-xs mt-0.5">
                  {editing?.origen === "sistema"
                    ? "El nombre y la fecha de nacimiento vienen del usuario; aquí se configura la foto y la plantilla."
                    : "Complete los datos del cumpleaños. La edad y la fecha de cumpleaños se calculan solas."}
                </p>
              </div>
              <button onClick={closeForm} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <FormField
                  label="Nombre completo *"
                  value={nombre}
                  onChange={setNombre}
                  required
                  readOnly={editing?.origen === "sistema"}
                  placeholder="Ej: María Pérez Gómez"
                />
                <FormField
                  label="Fecha de nacimiento *"
                  value={fechaNacimiento}
                  onChange={setFechaNacimiento}
                  type="date"
                  required
                  readOnly={editing?.origen === "sistema"}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
                <div className="lg:col-span-2">
                  <FormField
                    label="Cargo *"
                    value={cargo}
                    onChange={setCargo}
                    required
                    readOnly={editing?.origen === "sistema"}
                    maxLength={255}
                    placeholder="Escríbelo libremente, ej: Contratista - Aseo turno noche"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {editing?.origen === "sistema"
                      ? "El cargo del usuario se administra en Generales › Usuarios."
                      : "Texto libre, independiente del cargo registrado en el sistema."}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Foto {editing?.origen === "sistema" ? "" : "*"}
                  </label>
                  <div className="flex items-center gap-4">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Foto del cumpleañero" className="w-24 h-24 rounded-full object-cover border-2 border-[#0778AC]/20" />
                    ) : fotoArchivoOid != null ? (
                      <MiniFoto oid={fotoArchivoOid} nombre={nombre} className="w-24 h-24" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-semibold border-2 border-dashed border-gray-200">
                        Sin foto
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fotoInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => handleFotoChange(e.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        onClick={() => fotoInputRef.current?.click()}
                        className="px-4 py-2 rounded-lg border border-[#0778AC]/30 text-[#0778AC] text-xs font-semibold hover:bg-[#0778AC]/5"
                      >
                        {fotoPreview || fotoArchivoOid != null ? "Cambiar" : "Seleccionar foto"}
                      </button>
                      {(fotoPreview || fotoArchivoOid != null) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFotoFile(null);
                            setFotoArchivoOid(null);
                            setFotoPreview((prev) => {
                              if (prev) revokePreview(prev);
                              return "";
                            });
                            if (fotoInputRef.current) fotoInputRef.current.value = "";
                          }}
                          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">JPG o PNG, máximo 2MB.</p>
                  {fotoError && <p className="text-xs text-red-600 mt-1">{fotoError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plantilla de cumpleaños</label>
                  <select
                    value={plantillaOid ?? ""}
                    onChange={(e) => {
                      const valor = e.target.value ? Number(e.target.value) : null;
                      setPlantillaOid(valor);
                      const plantilla = plantillas.find((p) => p.oid === valor);
                      if (plantilla?.foto) {
                        // Cambiar de plantilla reinicia el reencuadre: la foto vuelve a
                        // centrarse automáticamente dentro del nuevo marco.
                        setPosicion({ ...plantilla.foto, zoom: 1, offsetX: 0, offsetY: 0 });
                      } else {
                        setPosicion({ ...POSICION_DEFECTO });
                      }
                    }}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC]"
                  >
                    <option value="">Sin plantilla</option>
                    {ordenados.map((p) => (
                      <option key={p.oid} value={p.oid}>
                        {p.nombre}
                        {p.meses && p.meses.length > 0
                          ? ` · ${p.meses.map((m) => MESES_CORTOS[m - 1] ?? m).join(", ")}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Se administran en Comunicaciones › Cumpleaños › Plantillas de Cumpleaños.
                  </p>
                </div>
              </div>

              {(plantillaOid != null || fotoArchivoOid != null) && (
                <div className="border border-gray-100 rounded-lg p-5 bg-gray-50/40">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Vista previa de la tarjeta</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    La foto se inserta automáticamente dentro del marco de la plantilla. Arrástrela para reencuadrarla
                    y use el zoom si necesita acercarla: siempre queda dentro del marco.
                  </p>
                  <EditorTarjetaCumple
                    plantillaArchivoOid={plantillaSeleccionada?.archivoOid ?? null}
                    posicion={posicion}
                    config={plantillaSeleccionada?.config ?? null}
                    frenteArchivoOid={plantillaSeleccionada?.frenteArchivoOid ?? null}
                    fotoArchivoOid={fotoArchivoOid}
                    fotoLocal={fotoPreview}
                    nombre={nombre}
                    fechaCumpleanos={fechaNacimiento ? fechaProximoCumple(fechaNacimiento) : undefined}
                    edad={fechaNacimiento ? edadProxima(fechaNacimiento) : 0}
                    cargo={cargo}
                    onPosicionChange={setPosicion}
                    onConfigChange={setConfigTarjeta}
                  />
                </div>
              )}

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">{formError}</div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !canActualizar}
                  title={canActualizar ? undefined : noPermissionReason("Cumpleaños", "actualizar")}
                  className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Guardando..." : "Grabar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Registro de tarjeta mínimo cuando el backend todavía no respondió. */
function registroDesdeBirthday(
  id: string,
  tarjeta: CumpleaniosRegistro | undefined,
  b: { id: string; nombreCompleto: string; fechaNacimiento: string; fechaCumpleanos: string; edad: number; area: string; origen: string; manualOid?: number; fotoArchivoOid?: number | null },
): CumpleaniosRegistro {
  if (tarjeta) return tarjeta;
  return {
    id,
    origen: b.origen === "manual" ? "manual" : "sistema",
    oid: b.manualOid ?? 0,
    nombreCompleto: b.nombreCompleto,
    fechaNacimiento: b.fechaNacimiento,
    fechaCumpleanos: b.fechaCumpleanos,
    edad: b.edad,
    cargo: b.area,
    fotoArchivoOid: b.fotoArchivoOid ?? null,
  };
}

function fechaProximoCumple(fechaNacimiento: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaNacimiento);
  if (!partes) return "";
  const anio = new Date().getFullYear();
  return `${anio}-${partes[2]}-${partes[3]}`;
}

function edadProxima(fechaNacimiento: string): number {
  const partes = /^(\d{4})/.exec(fechaNacimiento);
  return partes ? new Date().getFullYear() - Number(partes[1]) : 0;
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-800 font-semibold">{valor}</dd>
    </div>
  );
}

function MiniFoto({ oid, nombre, className = "w-10 h-10" }: { oid?: number | null; nombre: string; className?: string }) {
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
        try { URL.revokeObjectURL(url); } catch { /* noop */ }
      }
    };
  }, [oid]);

  if (src) {
    return <img src={src} alt={`Foto de ${nombre}`} className={`${className} rounded-full object-cover shrink-0 border border-gray-200`} />;
  }
  return (
    <div className={`${className} bg-[#0778AC]/10 rounded-full flex items-center justify-center shrink-0`}>
      <Cake className="w-4 h-4 text-[#0778AC]" />
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", required = false, placeholder, max, maxLength, readOnly = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  max?: string;
  maxLength?: number;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        max={max}
        maxLength={maxLength}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border-2 rounded-lg p-3 text-sm focus:outline-none focus:border-[#0778AC] ${
          readOnly ? "border-gray-100 bg-gray-50 text-gray-500" : "border-gray-200"
        }`}
      />
    </div>
  );
}
