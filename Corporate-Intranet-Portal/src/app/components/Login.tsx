import { User, Lock, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { AccessRequestModal } from "./modals/AccessRequestModal";
import { PasswordResetModal } from "./modals/PasswordResetModal";

export function Login() {
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => {
    // Detectar si venimos de un refresco (sesión caducada)
    const sessionStarted = sessionStorage.getItem("intranet_session_started");
    if (sessionStarted && !user) {
      return "Su sesión ha caducado";
    }
    return "";
  });
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        sessionStorage.setItem("intranet_session_started", "true");
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] via-white to-[#f0f4f8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src="/logo.ico" alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            <h1 className="text-2xl md:text-4xl font-bold text-[#0778AC]">Portal Institucional</h1>
          </div>
          <p className="text-[#CF3438] text-xs md:text-sm font-medium italic">
            Conectando el conocimiento, optimizando la salud
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-100 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-semibold text-[#0778AC] mb-6 pb-3 border-b-2 border-[#CF3438]/20">
            Inicio de Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Campo Usuario */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                Nombre de Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0778AC]" />
                <input
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0778AC]" />
                <input
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white rounded-lg py-4 transition-all flex items-center justify-center gap-3 mt-8 shadow-lg hover:shadow-xl font-semibold disabled:opacity-60"
            >
              <LogIn className="w-5 h-5" />
              <span className="text-base md:text-lg">{loading ? "INGRESANDO..." : "INGRESAR"}</span>
            </button>
          </form>

          {/* Enlaces adicionales */}
          <div className="mt-6 pt-6 border-t-2 border-gray-100 space-y-2 text-center">
            <button
              onClick={() => setShowPasswordResetModal(true)}
              className="text-sm text-[#0778AC] hover:text-[#CF3438] transition-colors block w-full"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <button
              onClick={() => setShowAccessRequestModal(true)}
              className="text-sm text-[#0778AC] hover:text-[#CF3438] transition-colors block w-full"
            >
              Solicitar acceso al portal
            </button>
          </div>
        </div>

      </div>

      {/* Modales */}
      <AccessRequestModal
        isOpen={showAccessRequestModal}
        onClose={() => setShowAccessRequestModal(false)}
      />
      <PasswordResetModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
      />
    </div>
  );
}