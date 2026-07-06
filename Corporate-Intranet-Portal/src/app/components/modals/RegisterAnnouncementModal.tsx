import { X, Plus, Send, Lock, User } from "lucide-react";
import { useState } from "react";
import { useAnnouncements } from "../../contexts/AnnouncementsContext";
import { useAuth } from "../../contexts/AuthContext";

interface RegisterAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirePassword?: boolean;
  isComunicaciones?: boolean;
}

export function RegisterAnnouncementModal({
  isOpen,
  onClose,
  requirePassword = true,
  isComunicaciones = false,
}: RegisterAnnouncementModalProps) {
  const { addAnnouncement, publishAnnouncement, announcements } = useAnnouncements();
  const { user } = useAuth();
  const [step, setStep] = useState<"auth" | "form">(requirePassword ? "auth" : "form");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dateError, setDateError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === user?.username) {
      setStep("form");
      setAuthError("");
    } else {
      setAuthError("Usuario incorrecto. Ingrese sus propias credenciales.");
    }
  };

  const validateDates = (): boolean => {
    const today = new Date();
    const startObj = new Date(startDate + "T" + (startTime || "00:00"));
    const endObj = new Date(endDate + "T" + (endTime || "23:59"));

    if (startObj < today) {
      setDateError("❌ La fecha y hora de inicio debe ser mayor a la actual.");
      return false;
    }

    if (endObj <= startObj) {
      setDateError("❌ La fecha y hora de fin debe ser posterior a la de inicio.");
      return false;
    }

    setDateError("");
    return true;
  };

  import("react").then(React => {
    React.useEffect(() => {
      if (dateError) setDateError("");
    }, [startDate, startTime, endDate, endTime]);
  });

  const handleSubmit = (e: React.FormEvent, publishDirectly: boolean = false) => {
    e.preventDefault();

    if (!validateDates()) return;

    addAnnouncement({
      title,
      description,
      startDate: new Date(`${startDate}T${startTime || "00:00"}`),
      endDate: new Date(`${endDate}T${endTime || "23:59"}`),
      createdBy: user?.fullName || username,
      published: publishDirectly,
    } as any);

    setSuccessMsg(
      publishDirectly 
        ? "✅ Anuncio publicado exitosamente." 
        : (isComunicaciones ? "✅ Anuncio registrado exitosamente." : "✅ Solicitud enviada al módulo de Comunicaciones.")
    );

    setTimeout(() => {
      resetForm();
      onClose();
    }, 2000);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setDateError("");
    setSuccessMsg("");
    setStep(requirePassword ? "auth" : "form");
    setUsername("");
    setPassword("");
    setAuthError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0778AC] p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              {isComunicaciones ? "Registrar / Publicar Anuncio" : "Solicitar Publicación de Anuncio"}
            </h2>
            {!isComunicaciones && (
              <p className="text-blue-100 text-xs mt-1">
                Su solicitud será enviada a Comunicaciones para aprobación
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-center text-gray-700 font-medium">{successMsg}</p>
            </div>
          ) : requirePassword && step === "auth" ? (
            <form onSubmit={handleAuth} className="space-y-4">
              <p className="text-gray-700 text-sm mb-4">
                Esta función requiere verificación. Por favor confirme su identidad.
              </p>

              {authError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0778AC]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
                    required
                    placeholder="Ingrese su usuario"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0778AC]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
                    required
                    placeholder="Ingrese su contraseña"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Continuar
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Anuncio o Comunicado *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
                  required
                  placeholder="Ej: Actualización del Sistema"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Anuncio o Comunicado *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all min-h-[100px]"
                  required
                  placeholder="Describa los detalles del anuncio o comunicado..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full border-2 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                      dateError
                        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                        : "border-gray-200 focus:border-[#CF3438] focus:ring-[#CF3438]/20"
                    }`}
                    required
                  />
                  {dateError && (
                    <p className="mt-1 text-xs text-red-600">{dateError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Fin *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className={`flex gap-3 pt-2 ${isComunicaciones ? "flex-col md:flex-row" : ""}`}>
                {/* Botón principal: Solicitar o Registrar */}
                <button
                  type="submit"
                  disabled={!!dateError}
                  className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isComunicaciones ? (
                    <>
                      <Plus className="w-5 h-5" />
                      Registrar Anuncio
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Solicitar Publicación
                    </>
                  )}
                </button>

                {/* Botón Publicar — solo para Comunicaciones */}
                {isComunicaciones && (
                  <button
                    type="button"
                    disabled={!!dateError || !title || !description || !startDate || !endDate}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!validateDates()) return;
                      const startDateTime = new Date(`${startDate}T${startTime || "00:00"}`);
                      const endDateTime = new Date(`${endDate}T${endTime || "23:59"}`);
                      addAnnouncement({
                        title,
                        description,
                        startDate: startDateTime,
                        endDate: endDateTime,
                        createdBy: user?.fullName || "",
                        published: true,
                      } as any);
                      setSuccessMsg("✅ Anuncio publicado exitosamente.");
                      setTimeout(() => {
                        resetForm();
                        onClose();
                      }, 2000);
                    }}
                    className="flex-1 bg-gradient-to-r from-[#0778AC] to-[#0996d3] hover:from-[#065a87] hover:to-[#0778AC] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    Publicar Anuncio
                  </button>
                )}
              </div>

              {!isComunicaciones && (
                <p className="text-xs text-gray-500 text-center">
                  * Su solicitud quedará pendiente hasta ser aprobada por el área de Comunicaciones.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
