import { XCircle } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../../api/client";
import { usersApi } from "../../api/users";

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessRequestModal({ isOpen, onClose }: AccessRequestModalProps) {
  const [primerNombre, setPrimerNombre] = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [identificacion, setIdentificacion] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [cargo, setCargo] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setPrimerNombre("");
    setSegundoNombre("");
    setPrimerApellido("");
    setSegundoApellido("");
    setIdentificacion("");
    setEmail("");
    setCelular("");
    setCargo("");
    setFechaNacimiento("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await usersApi.createAccessRequestRaw({
        primerNombre: primerNombre.trim(),
        segundoNombre: segundoNombre.trim() || null,
        primerApellido: primerApellido.trim(),
        segundoApellido: segundoApellido.trim(),
        identificacion: Number(identificacion),
        correo: email.trim(),
        celular: celular.trim(),
        cargo: cargo.trim(),
        fechaNacimiento,
      } as any);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        reset();
        onClose();
      }, 2500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      if (msg && msg.toLowerCase().includes("ya se encuentra creado")) {
        setError("usuario ya se encuentra creado en el sistema");
      } else {
        setError(msg || "No se pudo enviar la solicitud");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-bold text-white text-lg">Solicitar Acceso</h3>
            <p className="text-white/70 text-xs mt-0.5">Complete los datos para solicitar su cuenta institucional</p>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Solicitud Enviada</h3>
              <p className="text-gray-600">Su solicitud ha sido recibida. El área de TI revisará su solicitud y se comunicará con usted pronto.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {error && <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

              <FormField label="Primer Nombre *" value={primerNombre} onChange={setPrimerNombre} required placeholder="Ej: Juan" />
              <FormField label="Segundo Nombre" value={segundoNombre} onChange={setSegundoNombre} placeholder="Opcional" />

              <FormField label="Primer Apellido *" value={primerApellido} onChange={setPrimerApellido} required placeholder="Ej: Pérez" />
              <FormField label="Segundo apellido *" value={segundoApellido} onChange={setSegundoApellido} required placeholder="Ej: Gómez" />

              <FormField label="Numero de Identificación *" value={identificacion} onChange={setIdentificacion} required type="text" placeholder="Ej: 1234567890" />
              <FormField label="Email Corporativo *" value={email} onChange={setEmail} required type="email" placeholder="Ej: juan.perez@icvc.com.co" />

              <FormField label="Numero de Celular *" value={celular} onChange={setCelular} required placeholder="Ej: 3001234567" />
              <FormField label="Cargo del Usuario *" value={cargo} onChange={setCargo} required placeholder="Ej: Auxiliar de Enfermería" />

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Nacimiento *</label>
                <input type="date" required value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
                <button type="button" onClick={() => { reset(); onClose(); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={loading} className="bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                  {loading ? "Enviando..." : "Solicitar acceso"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
    </div>
  );
}
