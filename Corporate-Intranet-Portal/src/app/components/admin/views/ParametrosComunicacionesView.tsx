import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../../../api/client";
import { parametrosApi, type Parametro } from "../../../api/parametros";
import { noPermissionReason } from "../AccessGate";
import { useAdminAccess } from "../useAdminAccess";

export function ParametrosComunicacionesView() {
  const { can } = useAdminAccess();
  const canGrabar = can("parametros-comunicaciones", "grabar");
  const canActualizar = can("parametros-comunicaciones", "actualizar");
  const canEditar = canGrabar || canActualizar;

  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await parametrosApi.list();
        if (!active) return;
        setParametros(data);
        setValores(Object.fromEntries(data.map((p) => [p.clave, p.valor ?? ""])));
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

  const handleSave = async (clave: string) => {
    const valor = (valores[clave] ?? "").trim();
    if (!valor) {
      setRowError((prev) => ({ ...prev, [clave]: "El valor no puede estar vacío." }));
      return;
    }
    setRowError((prev) => ({ ...prev, [clave]: "" }));
    setSavingKey(clave);
    setNotice("");
    try {
      const updated = await parametrosApi.update(clave, valor);
      setParametros((prev) => prev.map((p) => (p.clave === clave ? updated : p)));
      setValores((prev) => ({ ...prev, [clave]: updated.valor ?? "" }));
      setNotice(`Parámetro "${clave}" guardado correctamente.`);
    } catch (e) {
      setRowError((prev) => ({
        ...prev,
        [clave]: e instanceof ApiError ? e.message : "No se pudo guardar el parámetro.",
      }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Parámetros de Comunicaciones</h1>
        <p className="text-gray-600 text-sm">
          Valores de configuración del módulo de Comunicaciones. Edite el valor de cada fila y pulse Guardar.
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Clave</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Valor</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Descripción</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parametros.map((p) => (
                <tr key={p.clave} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-sm text-gray-800">{p.clave}</td>
                  <td className="p-4">
                    <input
                      value={valores[p.clave] ?? ""}
                      onChange={(e) => setValores((prev) => ({ ...prev, [p.clave]: e.target.value }))}
                      disabled={!canEditar}
                      title={canEditar ? undefined : noPermissionReason("Parametros de Comunicaciones", "actualizar")}
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    {rowError[p.clave] && (
                      <p className="text-xs text-red-600 mt-1">{rowError[p.clave]}</p>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-500">{p.descripcion || "-"}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleSave(p.clave)}
                      disabled={!canEditar || savingKey === p.clave}
                      title={
                        canEditar
                          ? "Guardar"
                          : noPermissionReason("Parametros de Comunicaciones", "actualizar")
                      }
                      className="inline-flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-semibold"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingKey === p.clave ? "Guardando..." : "Guardar"}
                    </button>
                  </td>
                </tr>
              ))}
              {parametros.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                    {loading ? "Cargando parámetros..." : "No hay parámetros registrados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
