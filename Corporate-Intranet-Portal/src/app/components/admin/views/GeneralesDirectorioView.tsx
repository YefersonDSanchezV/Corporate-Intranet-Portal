import { Edit2, Eye, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../../../api/client";
import { DirectoryEntry, InstitutionEmail, useSystem } from "../../../contexts/SystemContext";

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
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [isSupport, setIsSupport] = useState(false);

  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeArea, setEmployeeArea] = useState("");
  const [employeePosition, setEmployeePosition] = useState("");

  const reset = () => {
    setExtName("");
    setExtension("");
    setArea("");
    setFloor("");
    setIsSupport(false);
    setEmployeeName("");
    setEmployeeEmail("");
    setEmployeeArea("");
    setEmployeePosition("");
    setEditingExtension(null);
    setEditingEmail(null);
  };

  const editExtension = (entry: DirectoryEntry) => {
    setEditingExtension(entry);
    setExtName(entry.name);
    setExtension(entry.extension);
    setArea(entry.area || "");
    setFloor(entry.floor?.join(", ") || "");
    setIsSupport(Boolean(entry.isSupport));
    setShowForm(true);
  };

  const editEmail = (entry: InstitutionEmail) => {
    setEditingEmail(entry);
    setEmployeeName(entry.employeeName);
    setEmployeeEmail(entry.email);
    setEmployeeArea(entry.area);
    setEmployeePosition(entry.position);
    setShowForm(true);
  };

  const saveExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: DirectoryEntry = {
      id: editingExtension?.id || Date.now().toString(),
      name: extName,
      extension,
      area,
      floor: floor.split(",").map((item) => item.trim()).filter(Boolean),
      isSupport,
      type: isSupport ? "administrativo" : "asistencial",
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
    };
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
        <button onClick={() => { reset(); setShowForm(!showForm); }} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" />
          {showForm ? "Ver listado" : isExtension ? "Nueva extension" : "Nuevo correo"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl">
          {isExtension ? (
            <form onSubmit={saveExtension} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Nombre de la extension" value={extName} onChange={setExtName} required />
              <FormField label="Extension" value={extension} onChange={setExtension} required />
              <FormField label="Area" value={area} onChange={setArea} required />
              <FormField label="Piso" value={floor} onChange={setFloor} required />
              <label className="md:col-span-2 flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium">
                <input type="checkbox" checked={isSupport} onChange={(e) => setIsSupport(e.target.checked)} />
                Es soporte
              </label>
              <SubmitButton label={editingExtension ? "Guardar cambios" : "Crear extension"} />
            </form>
          ) : (
            <form onSubmit={saveEmail} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Nombre del funcionario" value={employeeName} onChange={setEmployeeName} required />
              <FormField label="Correo del funcionario" value={employeeEmail} onChange={setEmployeeEmail} type="email" required />
              <FormField label="Area" value={employeeArea} onChange={setEmployeeArea} required />
              <FormField label="Cargo" value={employeePosition} onChange={setEmployeePosition} required />
              <SubmitButton label={editingEmail ? "Guardar cambios" : "Crear correo"} />
            </form>
          )}
        </div>
      ) : isExtension ? (
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

      {consulting && (
        <div className="fixed inset-0 z-[200] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-[#0778AC] mb-4">Detalle</h2>
            <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(consulting, null, 2)}</pre>
            <div className="flex justify-end mt-6"><button onClick={() => setConsulting(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold">Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function DirectoryTable({ entries, onEdit, onConsult, onDelete }: { entries: DirectoryEntry[]; onEdit: (entry: DirectoryEntry) => void; onConsult: (entry: DirectoryEntry) => void; onDelete: (id: string) => Promise<void> }) {
  return (
    <TableShell>
      <thead><tr className="bg-gray-50 border-b-2 border-gray-100"><Th>Nombre de la extension</Th><Th>Extension</Th><Th>Piso</Th><Th>Area</Th><Th>Acciones</Th></tr></thead>
      <tbody className="divide-y divide-gray-100">
        {entries.map((entry) => (
          <tr key={entry.id} className="hover:bg-gray-50">
            <td className="p-4 text-sm font-semibold"><Phone className="inline w-4 h-4 mr-2 text-[#0778AC]" />{entry.name}</td>
            <td className="p-4 text-sm">{entry.extension}</td>
            <td className="p-4 text-sm">{entry.floor?.join(", ")}</td>
            <td className="p-4 text-sm">{entry.area || entry.type}</td>
            <Actions onEdit={() => onEdit(entry)} onConsult={() => onConsult(entry)} onDelete={() => onDelete(entry.id)} />
          </tr>
        ))}
        {entries.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay extensiones registradas.</td></tr>}
      </tbody>
    </TableShell>
  );
}

function EmailTable({ entries, onEdit, onConsult, onDelete }: { entries: InstitutionEmail[]; onEdit: (entry: InstitutionEmail) => void; onConsult: (entry: InstitutionEmail) => void; onDelete: (id: string) => Promise<void> }) {
  return (
    <TableShell>
      <thead><tr className="bg-gray-50 border-b-2 border-gray-100"><Th>Nombre</Th><Th>Correo del funcionario</Th><Th>Area</Th><Th>Cargo</Th><Th>Acciones</Th></tr></thead>
      <tbody className="divide-y divide-gray-100">
        {entries.map((entry) => (
          <tr key={entry.id} className="hover:bg-gray-50">
            <td className="p-4 text-sm font-semibold"><Mail className="inline w-4 h-4 mr-2 text-[#0778AC]" />{entry.employeeName}</td>
            <td className="p-4 text-sm">{entry.email}</td>
            <td className="p-4 text-sm">{entry.area}</td>
            <td className="p-4 text-sm">{entry.position}</td>
            <Actions onEdit={() => onEdit(entry)} onConsult={() => onConsult(entry)} onDelete={() => onDelete(entry.id)} />
          </tr>
        ))}
        {entries.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay correos registrados.</td></tr>}
      </tbody>
    </TableShell>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left border-collapse">{children}</table></div></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-4 text-sm font-semibold text-gray-600">{children}</th>;
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

function FormField({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  return <div className="md:col-span-2 flex justify-end"><button type="submit" className="bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-3 rounded-lg font-semibold">{label}</button></div>;
}
