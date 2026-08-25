import { Shield, Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import logoHorizontal from "figma:asset/6ef2d928c798be9d11874d97c17b9dc21123e3d6.png";
import { useAnnouncements } from "../contexts/AnnouncementsContext";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { AdminLoginModal } from "./admin/AdminLoginModal";

export function Header() {
  const { notificationCount, clearNotifications, publishedAnnouncements } = useAnnouncements();
  const { isAdminAuthenticated, openAdminPanel } = useAdminAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleAdminButtonClick = () => {
    if (isAdminAuthenticated) {
      openAdminPanel();
    } else {
      setShowAdminLogin(true);
    }
  };

  return (
    <>
      <header className="bg-white shadow-md px-4 md:px-8 py-3 md:py-4 border-b-2 border-[#CF3438]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex-1 flex items-center gap-3">
            <img
              src={logoHorizontal}
              alt="Instituto Cardiovascular del Cesar"
              className="h-10 md:h-12 lg:h-14 w-auto"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Campanita de Notificaciones */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                }}
                className="p-2 bg-gray-100 rounded-full text-[#0778AC] hover:bg-[#0778AC] hover:text-white transition-all shadow-sm relative"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#CF3438] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                    {notificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 top-full mt-4 w-80 md:w-96 bg-white border-2 border-gray-200 rounded-xl z-[100] shadow-2xl overflow-hidden">
                    <div className="bg-[#0778AC] p-4 text-white flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Notificaciones
                      </h3>
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors"
                      >
                        Limpiar todo
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {publishedAnnouncements.length > 0 ? (
                        publishedAnnouncements.map((ann) => (
                          <div
                            key={ann.id}
                            className="border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-default"
                          >
                            <h4 className="text-sm font-bold text-gray-800 mb-1">
                              {ann.title}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {ann.description}
                            </p>
                            <p className="text-[10px] text-[#0778AC] mt-2 font-medium">
                              Vence:{" "}
                              {new Date(ann.endDate).toLocaleDateString(
                                "es-ES",
                                { day: "2-digit", month: "short" }
                              )}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-gray-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">No tienes anuncios nuevos</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Botón Panel Administrativo — Desktop */}
            <div className="hidden md:block">
              <button
                onClick={handleAdminButtonClick}
                className={`flex items-center gap-2 border-2 rounded-lg px-4 py-2 font-semibold text-sm transition-all shadow-sm ${
                  isAdminAuthenticated
                    ? "bg-[#0778AC] border-[#0778AC] text-white hover:bg-[#065a87]"
                    : "bg-white border-[#0778AC] text-[#0778AC] hover:bg-[#f0f4f8]"
                }`}
              >
                <Shield className="w-4 h-4" />
                Panel Administrativo
              </button>
            </div>

            {/* Hamburguesa mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-[#0778AC] hover:bg-[#f0f4f8] rounded-lg transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {showMobileMenu && (
                <>
                  <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowMobileMenu(false)}
                  />
                  <div className="fixed top-[60px] right-0 w-64 bg-white shadow-xl z-50 border-l-2 border-gray-200">
                    <div className="p-4">
                      <button
                        onClick={() => {
                          setShowMobileMenu(false);
                          handleAdminButtonClick();
                        }}
                        className={`w-full flex items-center justify-center gap-2 border-2 rounded-lg px-4 py-3 font-semibold text-sm transition-all ${
                          isAdminAuthenticated
                            ? "bg-[#0778AC] border-[#0778AC] text-white"
                            : "bg-white border-[#0778AC] text-[#0778AC]"
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        Panel Administrativo
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal de login para el panel */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
      />
    </>
  );
}