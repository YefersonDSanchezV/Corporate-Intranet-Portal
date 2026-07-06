import { Clock, User, IdCard } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function RecentAccessSection() {
  const { accessRecords } = useAuth();

  if (accessRecords.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8 shadow-md">
        <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-3 border-b-2 border-[#CF3438]/20">
          Accesos Recientes
        </h2>
        <p className="text-gray-500 text-sm text-center py-4">
          No hay accesos recientes registrados
        </p>
      </div>
    );
  }

  // Mostrar solo los primeros 3 registros
  const displayedRecords = accessRecords.slice(0, 3);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8 shadow-md">
      <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-3 border-b-2 border-[#CF3438]/20">
        Accesos Recientes
      </h2>

      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
        {displayedRecords.map((record, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-[#f0f4f8] to-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              {/* Módulo */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                  {record.moduleName}
                </h3>
              </div>

              {/* Fecha y Hora */}
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                <Clock className="w-4 h-4 text-[#CF3438]" />
                <span>
                  {format(record.accessTime, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                </span>
              </div>
            </div>

            {/* Información del usuario */}
            <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-3 h-3 md:w-4 md:h-4 text-[#0778AC]" />
                <span>{record.userName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <IdCard className="w-3 h-3 md:w-4 md:h-4 text-[#0778AC]" />
                <span>{record.userIdentification}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
