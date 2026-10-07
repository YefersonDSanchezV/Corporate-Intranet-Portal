import { Check, Eye, Globe, Plus, Trash2, X, Star } from "lucide-react";
import { useAdminAccess } from "../useAdminAccess";
import { noPermissionReason } from "../AccessGate";
import { useMemo, useState } from "react";
import { ApiError } from "../../../api/client";
import { useSystem } from "../../../contexts/SystemContext";

export function AccesoRapidoView() {
  const { sites, toggleSiteAccesoRapido } = useSystem();

  // Todos los sitios creados en submodulo "Sitio de Redireccion" (gensitredireccion)
  // Filtramos los que no son del propio AccesoRapido para evitar duplicados; si se usa el flag accesoRapido, todos vienen de la misma tabla.
  const allRedireccionSites = useMemo(() => sites, [sites]);
  const accesosRapidos = useMemo(() => sites.filter((s) => s.accesoRapido), [sites]);

  const [showModal, setShowModal] = useState(false);
  const [consulting, setConsulting] = useState<(typeof sites)[number] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setUpdatingId(id);
    try {
      await toggleSiteAccesoRapido(id);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "No se pudo actualizar";
      alert(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const { can } = useAdminAccess();
  const canGrabar = can("accesos-rapidos", "grabar");
  const canActualizar = can("accesos-rapidos", "actualizar");
  const canEliminar = can("accesos-rapidos", "eliminar");

  const handleRemoveQuickAccess = async (id: string) => {
    // Quitar de acceso rápido = toggle off
    await handleToggle(id);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Gestionar Accesos Rápidos</h1>
          <p className="text-gray-600 text-sm">Seleccione los sitios de redirección (creados en <span className="font-semibold">Módulo → Sitio de Redirección</span>) que aparecerán en el panel público <span className="font-semibold">Inicio → Accesos Rápidos</span>. ({accesosRapidos.length} activos)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!canGrabar}
          title={canGrabar ? undefined : noPermissionReason("Accesos Rapidos", "grabar")}
          className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nuevo acceso
        </button>
      </div>

      {/* Tabla de accesos rápidos actuales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Nombre</th>
                <th className="p-4 text-sm font-semibold text-gray-600">URL</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Módulo asignado</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accesosRapidos.map((site) => (
                <tr key={site.id} className="hover:bg-amber-50/40">
                  <td className="p-4 font-semibold text-gray-800 text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                    {site.title}
                  </td>
                  <td className="p-4"><a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0778AC] hover:underline block truncate max-w-[420px] font-mono bg-blue-50/50 px-2 py-1 rounded border border-blue-100">{site.url}</a></td>
                  <td className="p-4"><span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded truncate block max-w-[150px]">{site.moduleId}</span></td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button title="Consultar" onClick={() => setConsulting(site)} className="p-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button
                        title={canEliminar ? "Quitar de Accesos Rápidos" : noPermissionReason("Accesos Rapidos", "eliminar")}
                        aria-label="Quitar de Accesos Rapidos"
                        onClick={() => handleRemoveQuickAccess(site.id)}
                        disabled={!canEliminar || updatingId === site.id}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      ><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {accesosRapidos.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm">No hay accesos rápidos. Use “Nuevo acceso” para seleccionar sitios de Sitio de Redirección.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo acceso: tabla con todos los sitios de redirección - más ancho, fila delgada */}
      {showModal && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-2xl w-[96vw] max-w-[1440px] max-h-[88vh] overflow-hidden flex flex-col">
            <div className="bg-[#0778AC] px-6 py-3.5 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2"><Globe className="w-5 h-5" /> Seleccionar sitios para Acceso Rápido</h3>
                <p className="text-white/70 text-[11px] mt-0.5">Listado de todos los sitios creados en Sitio de Redirección — marque los que desea mostrar en Inicio</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <colgroup>
                  <col style={{ width: "64px" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                  <tr>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Acceso</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">URL</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Módulo</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allRedireccionSites.map((site) => (
                    <tr key={site.id} className={site.accesoRapido ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-gray-50"}>
                      <td className="py-2 px-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!site.accesoRapido}
                            onChange={() => handleToggle(site.id)}
                            disabled={!canActualizar || updatingId === site.id}
                            title={canActualizar ? (site.accesoRapido ? "Quitar de Accesos Rapidos" : "Agregar a Accesos Rapidos") : noPermissionReason("Accesos Rapidos", "actualizar")}
                            className="w-[18px] h-[18px] rounded border-2 border-gray-300 text-[#0778AC] focus:ring-[#0778AC] disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </label>
                      </td>
                      <td className="py-2 px-3 text-[13px] font-semibold text-gray-800 leading-tight whitespace-nowrap truncate max-w-0" title={site.title}>{site.title}</td>
                      <td className="py-2 px-3 text-[11px] font-mono text-[#0778AC] leading-tight break-all" title={site.url}>{site.url}</td>
                      <td className="py-2 px-3"><span className="inline-block text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">{site.moduleId}</span></td>
                      <td className="py-2 px-3 text-center">
                        {updatingId === site.id ? (
                          <span className="text-[11px] text-gray-400 animate-pulse">Guardando…</span>
                        ) : site.accesoRapido ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap"><Check className="w-3 h-3" /> En Acceso Rápido</span>
                        ) : (
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">No seleccionado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allRedireccionSites.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 text-sm">No hay sitios de redirección. Cree primero sitios en <b>Módulo → Sitio de Redirección</b>.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 rounded-lg bg-[#0778AC] hover:bg-[#065a87] text-white text-[13px] font-semibold">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {consulting && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white truncate">{consulting.title}</h2>
              <button onClick={() => setConsulting(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase">URL</p><a href={consulting.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#0778AC] hover:underline break-all">{consulting.url}</a></div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase">Módulo</p><p className="text-sm font-semibold text-gray-800">{consulting.moduleId}</p></div>
              <div className="flex justify-end pt-4 border-t border-gray-100"><button onClick={() => setConsulting(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50">Cerrar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
