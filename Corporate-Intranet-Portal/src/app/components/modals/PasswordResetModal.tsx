import { X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const { addPasswordResetRequest } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    details: ""
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPasswordResetRequest(formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        username: "",
        details: ""
      });
      onClose();
    }, 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
              <h2 className="text-xl font-bold">Restaurar Contraseña</h2>
              <p className="text-blue-100 text-xs mt-1">Solicite la recuperación de su clave de acceso</p>
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
              <p className="text-gray-600 mb-4">
                Su solicitud de restauración de contraseña ha sido recibida.
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-900 font-semibold mb-2">
                  Importante:
                </p>
                <p className="text-sm text-blue-800">
                  Luego de enviar la solicitud de restauración de contraseña, comuníquese con el área de sistemas
                  para que sea más rápido renovar su acceso.
                </p>
                <p className="text-sm text-blue-800 font-bold mt-2">
                  EXT 342
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre de Usuario */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nombre de Usuario <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438]"
                  placeholder="Ingrese su nombre de usuario"
                  required
                />
              </div>

              {/* Detalles de solicitud */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Detalles de Solicitud de Restauración de Contraseña <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438] resize-none"
                  placeholder="Describa la razón de su solicitud (ej: olvidé mi contraseña, cuenta bloqueada, etc.)"
                  required
                />
              </div>

              {/* Mensaje Informativo */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900 font-semibold mb-2">
                  Importante:
                </p>
                <p className="text-sm text-yellow-800">
                  Luego de enviar la solicitud de restauración de contraseña, comuníquese con el área de sistemas
                  para que sea más rápido renovar su acceso.
                </p>
                <p className="text-sm text-yellow-800 font-bold mt-2">
                  EXT 342
                </p>
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
                  className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
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
