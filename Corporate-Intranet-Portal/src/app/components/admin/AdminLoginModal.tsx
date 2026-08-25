import { User, Lock, LogIn, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { DEV_CREDENTIALS } from "../../utils/dev-credentials";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const { adminLogin } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = adminLogin(username, password);
    if (success) {
      setUsername("");
      setPassword("");
      onClose();
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  const handleClose = () => {
    setUsername("");
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] px-4">
      <div className="w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src="/logo.ico"
              alt="Logo"
              className="w-12 h-12 md:w-14 md:h-14 object-contain"
            />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Portal Institucional
            </h1>
          </div>
          <p className="text-white/70 text-xs md:text-sm font-medium italic">
            Conectando el conocimiento, optimizando la salud
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-100 p-6 md:p-8 relative">
          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl md:text-2xl font-semibold text-[#0778AC] mb-6 pb-3 border-b-2 border-[#CF3438]/20">
            Inicio de Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Usuario */}
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
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Contraseña */}
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
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Hint dev */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-semibold mb-1">
                Acceso Administrativo:
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>
                  <strong>Usuario:</strong> {DEV_CREDENTIALS.username}
                </p>
                <p>
                  <strong>Password:</strong> {DEV_CREDENTIALS.password}
                </p>
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white rounded-lg py-4 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl font-semibold"
            >
              <LogIn className="w-5 h-5" />
              <span className="text-base md:text-lg">INGRESAR</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
