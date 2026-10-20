import { Loader2, Plug, Save, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { parametrosApi, type Parametro } from "../../../api/parametros";
import { noPermissionReason } from "../AccessGate";
import { useAdminAccess } from "../useAdminAccess";
import { AlmacenamientoPanel } from "./AlmacenamientoPanel";

/**
 * Parámetros de la comunicación con MinIO (almacenamiento de archivos).
 * Los campos se agrupan en tres columnas temáticas: conexión, buckets y límites.
 * Por ahora hay una sola pestaña; la estructura queda lista para agregar más
 * (por ejemplo, correo o video) sin reordenar la vista.
 */
type Campo = {
  clave: string;
  label: string;
  ayuda: string;
  tipo?: "number" | "text" | "password";
  opcional?: boolean;
};

const COLUMNA_CONEXION: Campo[] = [
  {
    clave: "S3_ENDPOINT",
    label: "Endpoint de MinIO",
    ayuda: "URL del servicio, por ejemplo http://192.168.1.62:9000",
  },
  {
    clave: "S3_ACCESS_KEY",
    label: "Usuario (access key)",
    ayuda: "Credencial de acceso a MinIO. Si se deja vacío se usa la variable de entorno.",
    opcional: true,
  },
  {
    clave: "S3_SECRET_KEY",
    label: "Contraseña (secret key)",
    ayuda: "Contraseña de acceso a MinIO. Si se deja vacío se usa la variable de entorno.",
    tipo: "password",
    opcional: true,
  },
];

const COLUMNA_LIMITES: Campo[] = [
  {
    clave: "FOTOS_CUMPLE_MAX_MB",
    label: "Tamaño máximo de foto (MB)",
    ayuda: "Límite de la foto del funcionario en los cumpleaños manuales",
    tipo: "number",
  },
  {
    clave: "PLANTILLAS_CUMPLE_MAX_MB",
    label: "Tamaño máximo de plantilla (MB)",
    ayuda: "Límite de las imágenes de tarjeta que se cargan como plantilla",
    tipo: "number",
  },
  {
    clave: "FOTOS_CUMPLE_MIME",
    label: "Tipos MIME permitidos para fotos",
    ayuda: "Separados por coma, por ejemplo image/jpeg,image/png",
  },
];

const COLUMNAS: Array<{ id: string; titulo: string; descripcion: string; campos: Campo[] }> = [
  {
    id: "conexion",
    titulo: "Conexión",
    descripcion: "Endpoint y credenciales del servidor MinIO",
    campos: COLUMNA_CONEXION,
  },
  {
    id: "limites",
    titulo: "Límites de archivos",
    descripcion: "Tamaños máximos y tipos permitidos",
    campos: COLUMNA_LIMITES,
  },
];

/** Todos los campos, en orden, para validar/guardar de una vez. */
const CAMPOS: Campo[] = COLUMNAS.flatMap((columna) => columna.campos);

const TABS = [{ id: "minio", label: "MinIO" }] as const;
type TabId = (typeof TABS)[number]["id"];

export function ParametrosComunicacionesView() {
  const { can } = useAdminAccess();
  const canGrabar = can("parametros-comunicaciones", "grabar");
  const canActualizar = can("parametros-comunicaciones", "actualizar");
  const canEditar = canGrabar || canActualizar;

  const [tab, setTab] = useState<TabId>("minio");
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [originales, setOriginales] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; mensaje: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await parametrosApi.list();
        if (!active) return;
        setParametros(data);
        const mapa = Object.fromEntries(data.map((p) => [p.clave, p.valor ?? ""]));
        setValores(mapa);
        setOriginales(mapa);
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : "No se pudieron cargar los parámetros.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const descripcion = (clave: string) =>
    parametros.find((p) => p.clave === clave)?.descripcion ?? "";

  const cambios = CAMPOS.filter((campo) => (valores[campo.clave] ?? "") !== (originales[campo.clave] ?? ""));

  const handleGuardar = async () => {
    setNotice("");
    setError("");
    setResultadoPrueba(null);
    const errores: Record<string, string> = {};
    CAMPOS.forEach((campo) => {
      const valor = (valores[campo.clave] ?? "").trim();
      if (!valor) {
        // Las credenciales son opcionales: vacío = usar variables de entorno.
        if (!campo.opcional) {
          errores[campo.clave] = "El valor no puede estar vacío.";
        }
        return;
      }
      if (campo.tipo === "number" && !(Number(valor) > 0)) {
        errores[campo.clave] = "Debe ser un número mayor que cero.";
      }
    });
    setFieldError(errores);
    if (Object.keys(errores).length > 0) {
      setError("Revise los campos marcados antes de guardar.");
      return;
    }
    if (cambios.length === 0) {
      setNotice("No hay cambios por guardar.");
      return;
    }
    setSaving(true);
    try {
      const actualizados: Parametro[] = [];
      for (const campo of cambios) {
        actualizados.push(await parametrosApi.update(campo.clave, (valores[campo.clave] ?? "").trim()));
      }
      setParametros((prev) => prev.map((p) => actualizados.find((a) => a.clave === p.clave) ?? p));
      setOriginales((prev) => {
        const copia = { ...prev };
        actualizados.forEach((a) => {
          copia[a.clave] = a.valor ?? "";
        });
        return copia;
      });
      setNotice(
        actualizados.length === 1
          ? "Parámetro guardado correctamente."
          : `${actualizados.length} parámetros guardados correctamente.`,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudieron guardar los parámetros.");
    } finally {
      setSaving(false);
    }
  };

  const handleProbar = async () => {
    setResultadoPrueba(null);
    setError("");
    setNotice("");
    if (!(valores.S3_ENDPOINT ?? "").trim()) {
      setFieldError({ S3_ENDPOINT: "Requerido para probar la conexión." });
      setError("Complete el endpoint antes de probar la conexión.");
      return;
    }
    setProbando(true);
    try {
      // Sin bucket concreto: el backend valida endpoint y credenciales listando/creando
      // algún contenedor. Los buckets concretos se administran en "Almacenamiento de archivos".
      const res = await parametrosApi.probarMinio({
        endpoint: (valores.S3_ENDPOINT ?? "").trim(),
        accessKey: (valores.S3_ACCESS_KEY ?? "").trim() || undefined,
        secretKey: (valores.S3_SECRET_KEY ?? "").trim() || undefined,
      });
      setResultadoPrueba(res);
    } catch (e) {
      const mensaje = e instanceof ApiError ? e.message : "No se pudo probar la conexión.";
      setResultadoPrueba({ ok: false, mensaje });
    } finally {
      setProbando(false);
    }
  };

  const disabledTitle = canEditar ? undefined : noPermissionReason("Parametros de Comunicaciones", "actualizar");

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Parámetros de Comunicaciones</h1>
        <p className="text-gray-600 text-sm">
          Configuración del almacenamiento y de los archivos del módulo de Comunicaciones.
        </p>
      </div>

      {notice && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2.5">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}
      {resultadoPrueba && (
        <div
          className={`mb-4 border text-sm rounded-lg px-4 py-2.5 flex items-start gap-2 ${
            resultadoPrueba.ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          <Plug className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{resultadoPrueba.mensaje}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-100 bg-gray-50/60">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg -mb-px border-b-2 transition-colors ${
                tab === item.id
                  ? "border-[#0778AC] text-[#0778AC] bg-white"
                  : "border-transparent text-gray-500 hover:text-[#0778AC]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="bg-[#0778AC]/10 p-2 rounded-lg">
              <Server className="w-4 h-4 text-[#0778AC]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Servicio de almacenamiento MinIO</h2>
              <p className="text-xs text-gray-500">
                Endpoint, credenciales y contenedores que usa el sistema para guardar fotos, plantillas, videos y documentos.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Cargando parámetros...</p>
          ) : (
            <>
            <div className="grid gap-6 lg:grid-cols-2">
              {COLUMNAS.map((columna) => (
                <section
                  key={columna.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/40 p-5"
                >
                  <header className="mb-4">
                    <h3 className="text-sm font-bold text-[#0778AC] uppercase tracking-wide">
                      {columna.titulo}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{columna.descripcion}</p>
                  </header>
                  <div className="space-y-5">
                    {columna.campos.map((campo) => (
                      <div key={campo.clave}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{campo.label}</label>
                        <input
                          type={campo.tipo === "number" ? "number" : campo.tipo === "password" ? "password" : "text"}
                          min={campo.tipo === "number" ? 1 : undefined}
                          value={valores[campo.clave] ?? ""}
                          autoComplete={campo.tipo === "password" ? "new-password" : undefined}
                          onChange={(e) => {
                            setValores((prev) => ({ ...prev, [campo.clave]: e.target.value }));
                            setFieldError((prev) => ({ ...prev, [campo.clave]: "" }));
                            setResultadoPrueba(null);
                          }}
                          disabled={!canEditar}
                          title={disabledTitle}
                          placeholder={descripcion(campo.clave) || campo.ayuda}
                          className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:border-[#0778AC] disabled:bg-gray-50 disabled:text-gray-400"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">{campo.ayuda}</p>
                        {fieldError[campo.clave] && (
                          <p className="text-xs text-red-600 mt-1">{fieldError[campo.clave]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6">
              <AlmacenamientoPanel puedeEditar={canEditar} motivoSinPermiso={disabledTitle} />
            </div>
            </>
          )}

          <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {cambios.length > 0
                ? `${cambios.length} cambio${cambios.length === 1 ? "" : "s"} sin guardar`
                : "Todos los parámetros están actualizados"}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleProbar}
                disabled={!canEditar || probando}
                title={canEditar ? "Probar conexión con los valores actuales" : disabledTitle}
                className="inline-flex items-center gap-2 border-2 border-[#0778AC]/30 text-[#0778AC] hover:bg-[#0778AC]/5 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg text-sm font-semibold"
              >
                {probando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                {probando ? "Probando..." : "Probar conexión"}
              </button>
              <button
                onClick={handleGuardar}
                disabled={!canEditar || saving || cambios.length === 0}
                title={canEditar ? "Guardar cambios" : disabledTitle}
                className="inline-flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
              >
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
