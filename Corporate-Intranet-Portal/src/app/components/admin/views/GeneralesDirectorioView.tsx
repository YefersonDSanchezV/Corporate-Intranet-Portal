import { Edit2, Eye, Mail, Phone, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../../../api/client";
import { DirectoryEntry, InstitutionEmail, useSystem } from "../../../contexts/SystemContext";

const PISOS = ["Piso 1", "Piso 2", "Piso 3", "Piso 4", "Piso 5", "Piso 6", "Betania"] as const;

export function GeneralesDirectorioView({ type }: { type: "extension" | "email" }) {
  const {
    directory,
    addDirectoryEntry,
    updateDirectoryEntry,
    removeDirectoryEntry,
    institutionEmails,
    addInstitutionEmail,
    updateInstitutionEmail,
    removeInstitutionEmail,
  } = useSystem();

  const [showForm, setShowForm] = useState(false);
  const [consulting, setConsulting] = useState<DirectoryEntry | InstitutionEmail | null>(null);
  const [editingExtension, setEditingExtension] = useState<DirectoryEntry | null>(null);
  const [editingEmail, setEditingEmail] = useState<InstitutionEmail | null>(null);

  const [extName, setExtName] = useState("");
  const [extension, setExtension] = useState("");
  const [rol, setRol] = useState<"asistencial" | "administrativo">("asistencial");
  const [area, setArea] = useState("");
  const [piso, setPiso] = useState<string>("Piso 1");
  const [isSupport, setIsSupport] = useState(false);

  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeArea, setEmployeeArea] = useState("");
  const [employeePosition, setEmployeePosition] = useState("");
  const [emailIsSupport, setEmailIsSupport] = useState(false);

  const reset = () => {
    setExtName("");
    setExtension("");
    setRol("asistencial");
    setArea("");
    setPiso("Piso 1");
    setIsSupport(false);
    setEmployeeName("");
    setEmployeeEmail("");
    setEmployeeArea("");
    setEmployeePosition("");
    setEmailIsSupport(false);
    setEditingExtension(null);
    setEditingEmail(null);
  };

  const editExtension = (entry: DirectoryEntry) => {
    setEditingExtension(entry);
    setExtName(entry.name);
    setExtension(entry.extension);
    setRol((entry.type as any) || "asistencial");
    setArea(entry.area || "");
    setPiso(entry.floor?.[0] || "Piso 1");
    setIsSupport(Boolean(entry.isSupport));
    setShowForm(true);
  };

  const editEmail = (entry: InstitutionEmail) => {
    setEditingEmail(entry);
    setEmployeeName(entry.employeeName);
    setEmployeeEmail(entry.email);
    setEmployeeArea(entry.area);
    setEmployeePosition(entry.position);
    setEmailIsSupport(Boolean((entry as any).isSupport));
    setShowForm(true);
  };

  const saveExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: DirectoryEntry = {
      id: editingExtension?.id || Date.now().toString(),
      name: extName,
      extension,
      area,
      floor: piso ? [piso] : [],
      isSupport,
      type: rol,
      active: editingExtension?.active ?? true,
    };
    try {
      if (editingExtension) {
        await updateDirectoryEntry(payload);
      } else {
        await addDirectoryEntry(payload);
      }
      reset();
      setShowForm(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar la extensión";
      alert(message);
    }
  };

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: InstitutionEmail = {
      id: editingEmail?.id || Date.now().toString(),
      employeeName,
      email: employeeEmail,
      area: employeeArea,
      position: employeePosition,
      isSupport: emailIsSupport,
    } as InstitutionEmail;
    try {
      if (editingEmail) {
        await updateInstitutionEmail(payload);
      } else {
        await addInstitutionEmail(payload);
      }
      reset();
      setShowForm(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el correo";
      alert(message);
    }
  };

  const isExtension = type === "extension";

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">
            {isExtension ? "Directorio de Extensiones" : "Directorio de Correos"}
          </h1>
          <p className="text-gray-600 text-sm">
            {isExtension ? "Administre extensiones, areas, pisos y marcacion de soporte." : "Administre los correos corporativos del directorio institucional."}
          </p>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" />
          {isExtension ? "Nueva extension" : "Nuevo correo"}
        </button>
      </div>

      {isExtension ? (
        <DirectoryTable
          entries={directory}
          onEdit={editExtension}
          onConsult={setConsulting}
          onDelete={async (id) => {
            try {
              await removeDirectoryEntry(id);
            } catch (error) {
              const message = error instanceof ApiError ? error.message : "No se pudo eliminar la extensión";
              alert(message);
            }
          }}
        />
      ) : (
        <EmailTable
          entries={institutionEmails}
          onEdit={editEmail}
          onConsult={setConsulting}
          onDelete={async (id) => {
            try {
              await removeInstitutionEmail(id);
            } catch (error) {
              const message = error instanceof ApiError ? error.message : "No se pudo eliminar el correo";
              alert(message);
            }
          }}
        />
      )}

      {/* Modal Crear/Editar Extension - estilo usuario con difuminado */}
      {showForm && isExtension && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg">{editingExtension ? "Editar extension" : "Nueva extension"}</h3>
                <p className="text-white/70 text-xs mt-0.5">Complete los datos de la extensión telefónica</p>
              </div>
              <button onClick={() => { setShowForm(false); reset(); }} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveExtension} className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 overflow-y-auto">
              <FormField label="Nombre de la extension" value={extName} onChange={setExtName} required />
              <FormField label="Extension" value={extension} onChange={setExtension} required />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rol *</label>
                <select value={rol} onChange={(e) => setRol(e.target.value as any)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                  <option value="asistencial">Asistencial</option>
                  <option value="administrativo">Administrativo</option>
                </select>
              </div>
              <FormField label="Area *" value={area} onChange={setArea} required placeholder="Ej: Sistemas, Comunicaciones, Cartera" />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Piso *</label>
                <select value={piso} onChange={(e) => setPiso(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                  {PISOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <label className="md:col-span-2 flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium">
                <input type="checkbox" checked={isSupport} onChange={(e) => setIsSupport(e.target.checked)} />
                Es soporte
              </label>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">{editingExtension ? "Actualizar" : "Grabar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Correo - estilo usuario con difuminado */}
      {showForm && !isExtension && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg">{editingEmail ? "Editar correo" : "Nuevo correo"}</h3>
                <p className="text-white/70 text-xs mt-0.5">Complete los datos del correo institucional</p>
              </div>
              <button onClick={() => { setShowForm(false); reset(); }} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveEmail} className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 overflow-y-auto">
              <FormField label="Nombre del funcionario" value={employeeName} onChange={setEmployeeName} required />
              <FormField label="Correo del funcionario" value={employeeEmail} onChange={setEmployeeEmail} type="email" required />
              <FormField label="Area" value={employeeArea} onChange={setEmployeeArea} required />
              <FormField label="Cargo" value={employeePosition} onChange={setEmployeePosition} required />
              <label className="md:col-span-2 flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium">
                <input type="checkbox" checked={emailIsSupport} onChange={(e) => setEmailIsSupport(e.target.checked)} />
                Es soporte
              </label>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">{editingEmail ? "Actualizar" : "Grabar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {consulting && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{'extension' in (consulting as any) ? 'Detalle Extensión' : 'Detalle Correo'}</h2>
              <button onClick={() => setConsulting(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              {'extension' in (consulting as any) ? (
                <div className="grid grid-cols-1 gap-3">
                  <DetailRow label="Nombre de la extension" value={(consulting as DirectoryEntry).name} />
                  <DetailRow label="Número de extension" value={(consulting as DirectoryEntry).extension} />
                  <DetailRow label="Piso" value={(consulting as DirectoryEntry).floor?.join(", ") || "—"} />
                  <DetailRow label="Área" value={(consulting as DirectoryEntry).area || "—"} />
                  <DetailRow label="Tipo" value={(consulting as DirectoryEntry).type} />
                  <DetailRow label="Estado" value={(consulting as DirectoryEntry).active ? "Activo" : "Inactivo"} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <DetailRow label="Nombre completo" value={(consulting as InstitutionEmail).employeeName} />
                  <DetailRow label="Cargo" value={(consulting as InstitutionEmail).position} />
                  <DetailRow label="Email" value={(consulting as InstitutionEmail).email} />
                  <DetailRow label="Área" value={(consulting as InstitutionEmail).area} />
                </div>
              )}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={() => setConsulting(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DirectoryTable({ entries, onEdit, onConsult, onDelete }: { entries: DirectoryEntry[]; onEdit: (entry: DirectoryEntry) => void; onConsult: (entry: DirectoryEntry) => void; onDelete: (id: string) => Promise<void> }) {
  const [pisoFilter, setPisoFilter] = useState<string>("Todos");
  const [areaFilterDir, setAreaFilterDir] = useState<string>("Todos");
  const [colWidths, setColWidths] = useState({ name: 220, ext: 150, piso: 180, area: 160 });
  const pisos = Array.from(new Set(entries.flatMap(e => e.floor || []).filter(Boolean) as string[]));
  const areasDir = Array.from(new Set(entries.map(e => e.area).filter(Boolean) as string[]));
  const filteredByModule = entries.filter(e => {
    const matchesPiso = pisoFilter === "Todos" || (e.floor || []).includes(pisoFilter);
    const matchesArea = areaFilterDir === "Todos" || e.area === areaFilterDir;
    return matchesPiso && matchesArea;
  });
  const startResize = (col: keyof typeof colWidths) => (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = colWidths[col];
    const onMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX;
      setColWidths(prev => ({ ...prev, [col]: Math.max(90, startWidth + diff) }));
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center justify-end">
        <span className="text-sm font-semibold text-gray-600 mr-auto">Filtros:</span>
        <select value={pisoFilter} onChange={e=> setPisoFilter(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px] focus:outline-none focus:border-[#0778AC]">
          <option value="Todos">Piso: Todos</option>
          {pisos.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={areaFilterDir} onChange={e=> setAreaFilterDir(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px] focus:outline-none focus:border-[#0778AC]">
          <option value="Todos">Área: Todos</option>
          {areasDir.map(a=> <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <TableShell>
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col style={{ width: colWidths.name }} />
            <col style={{ width: colWidths.ext }} />
            <col style={{ width: colWidths.piso }} />
            <col style={{ width: colWidths.area }} />
            <col style={{ width: 140 }} />
          </colgroup>
          <thead><tr className="bg-gray-50 border-b-2 border-gray-100">
            <Th resizable onResize={startResize('name')}>Nombre de la extension</Th>
            <Th resizable onResize={startResize('ext')}>Extension</Th>
            <Th resizable onResize={startResize('piso')}>Piso</Th>
            <Th resizable onResize={startResize('area')}>Area</Th>
            <Th>Acciones</Th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filteredByModule.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm font-semibold"><div className="flex items-center gap-2 min-w-0"><Phone className="w-4 h-4 text-[#0778AC] flex-shrink-0" /><span className="truncate block" title={entry.name}>{entry.name}</span></div></td>
                <td className="p-4 text-sm"><span className="block truncate max-w-full break-all font-mono text-xs bg-gray-50 px-2 py-1 rounded border" title={entry.extension}>{entry.extension}</span></td>
                <td className="p-4 text-sm"><span className="block truncate" title={entry.floor?.join(", ")}>{entry.floor?.join(", ")}</span></td>
                <td className="p-4 text-sm"><span className="truncate block" title={entry.area || entry.type}>{entry.area || entry.type}</span></td>
                <Actions onEdit={() => onEdit(entry)} onConsult={() => onConsult(entry)} onDelete={() => onDelete(entry.id)} />
              </tr>
            ))}
            {filteredByModule.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay extensiones registradas.</td></tr>}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function EmailTable({ entries, onEdit, onConsult, onDelete }: { entries: InstitutionEmail[]; onEdit: (entry: InstitutionEmail) => void; onConsult: (entry: InstitutionEmail) => void; onDelete: (id: string) => Promise<void> }) {
  const [areaFilter, setAreaFilter] = useState("Todos");
  const [cargoFilter, setCargoFilter] = useState("Todos");
  const areas = Array.from(new Set(entries.map(e => e.area).filter(Boolean)));
  const cargos = Array.from(new Set(entries.map(e => e.position).filter(Boolean)));
  void areas; void cargos;
  const filtered = entries.filter(e => {
    const matchesName = true; // ya filtrado por búsqueda externa, aquí filtros adicionales
    const matchesArea = areaFilter === "Todos" || e.area === areaFilter;
    const matchesCargo = cargoFilter === "Todos" || e.position === cargoFilter;
    return matchesArea && matchesCargo;
  });
  const [colWidths, setColWidths] = useState({ name: 180, email: 220, area: 140, cargo: 150 });
  const startResize = (col: keyof typeof colWidths) => (e: React.MouseEvent) => {
    const startX = e.clientX; const startWidth = colWidths[col];
    const onMove = (ev: MouseEvent) => setColWidths(prev => ({ ...prev, [col]: Math.max(90, startWidth + (ev.clientX - startX)) }));
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center justify-end">
        <span className="text-sm font-semibold text-gray-600 mr-auto">Filtros:</span>
        <select value={areaFilter} onChange={e=> setAreaFilter(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px] focus:outline-none focus:border-[#0778AC]">
          <option value="Todos">Área: Todos</option>
          {Array.from(new Set(entries.map(e=> e.area).filter(Boolean) as string[])).map(a=> <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={cargoFilter} onChange={e=> setCargoFilter(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px] focus:outline-none focus:border-[#0778AC]">
          <option value="Todos">Cargo: Todos</option>
          {Array.from(new Set(entries.map(e=> e.position).filter(Boolean) as string[])).map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <TableShell>
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup><col style={{width:colWidths.name}}/><col style={{width:colWidths.email}}/><col style={{width:colWidths.area}}/><col style={{width:colWidths.cargo}}/><col style={{width:140}}/></colgroup>
          <thead><tr className="bg-gray-50 border-b-2 border-gray-100">
            <Th resizable onResize={startResize('name')}>Nombre</Th>
            <Th resizable onResize={startResize('email')}>Correo del funcionario</Th>
            <Th resizable onResize={startResize('area')}>Area</Th>
            <Th resizable onResize={startResize('cargo')}>Cargo</Th>
            <Th>Acciones</Th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm font-semibold"><div className="flex items-center gap-2 min-w-0"><Mail className="w-4 h-4 text-[#0778AC] flex-shrink-0" /><span className="truncate block" title={entry.employeeName}>{entry.employeeName}</span></div></td>
                <td className="p-4 text-sm"><span className="block truncate max-w-full break-all text-xs font-mono bg-blue-50 px-2 py-1 rounded border text-[#0778AC]" title={entry.email}>{entry.email}</span></td>
                <td className="p-4 text-sm"><span className="truncate block" title={entry.area}>{entry.area}</span></td>
                <td className="p-4 text-sm"><span className="truncate block" title={entry.position}>{entry.position}</span></td>
                <Actions onEdit={() => onEdit(entry)} onConsult={() => onConsult(entry)} onDelete={() => onDelete(entry.id)} />
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay correos registrados.</td></tr>}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"><div className="overflow-x-auto">{children}</div></div>;
}

function Th({ children, resizable, onResize }: { children: React.ReactNode; resizable?: boolean; onResize?: (e: React.MouseEvent) => void }) {
  return <th className="p-4 text-sm font-semibold text-gray-600 relative select-none bg-gray-50">{children}{resizable && <span onMouseDown={onResize} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#0778AC]/40" title="Arrastrar para redimensionar" />}</th>;
}

function Actions({ onEdit, onConsult, onDelete }: { onEdit: () => void; onConsult: () => void; onDelete: () => void }) {
  return (
    <td className="p-4">
      <div className="flex justify-center gap-2">
        <button title="Editar" onClick={onEdit} className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
        <button title="Consultar" onClick={onConsult} className="p-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg"><Eye className="w-4 h-4" /></button>
        <button title="Eliminar" onClick={onDelete} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
      </div>
    </td>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-gray-800 break-all">{value || "—"}</span>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
    </div>
  );
}
