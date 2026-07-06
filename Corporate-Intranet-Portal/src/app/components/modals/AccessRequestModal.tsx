import { X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessRequestModal({ isOpen, onClose }: AccessRequestModalProps) {
  const { addAccessRequest } = useAuth();
  const [formData, setFormData] = useState({
    documentType: "",
    documentNumber: "",
    fullName: "",
    phone: "",
    position: ""
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAccessRequest(formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        documentType: "",
        documentNumber: "",
        fullName: "",
        phone: "",
        position: ""
      });
      onClose();
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0778AC] text-white px-6 py-5 flex justify-between items-center rounded-t-xl">
          <div>
              <h2 className="text-xl font-bold">Solicitar Acceso al Portal</h2>
              <p className="text-blue-100 text-xs mt-1">Complete el formulario para solicitar su cuenta institucional</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Solicitud Enviada
              </h3>
              <p className="text-gray-600">
                Su solicitud ha sido recibida. El área de TI revisará su solicitud y se comunicará con usted pronto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Documento */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  required
                >
                  <option value="">Seleccione...</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>

              {/* Número de Documento */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Número de Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  placeholder="Ingrese su número de documento"
                  required
                />
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  placeholder="Ingrese su nombre completo"
                  required
                />
              </div>

              {/* Número de Teléfono */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Número de Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  placeholder="Ingrese su número de teléfono"
                  required
                />
              </div>

              {/* Cargo dentro de la empresa */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Cargo dentro de la Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  placeholder="Ingrese su cargo"
                  required
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#0778AC] to-[#0778AC]/90 hover:from-[#0778AC]/90 hover:to-[#0778AC] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
