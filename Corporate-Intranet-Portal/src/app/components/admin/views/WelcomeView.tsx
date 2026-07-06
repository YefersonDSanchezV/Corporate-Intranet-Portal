import { Shield, Users, LayoutGrid, Globe, ClipboardCheck, BriefcaseBusiness, Phone, Mail } from "lucide-react";
import { AdminView } from "../AdminSidebar";

const QUICK_STATS: Array<{ label: string; icon: any; color: string; desc: string; view: AdminView }> = [
  { label: "Usuarios", icon: Users, color: "bg-blue-500", desc: "Listar, consultar y editar usuarios", view: "usuarios" },
  { label: "Crear Usuario", icon: Users, color: "bg-sky-500", desc: "Registrar nuevos accesos", view: "crear-usuario" },
  { label: "Solicitudes", icon: ClipboardCheck, color: "bg-emerald-500", desc: "Autorizar o denegar accesos", view: "solicitudes" },
  { label: "Cargo", icon: BriefcaseBusiness, color: "bg-indigo-500", desc: "Permisos por cargo", view: "cargos" },
  { label: "Modulos", icon: LayoutGrid, color: "bg-purple-500", desc: "Configurar modulos del portal", view: "modulos" },
  { label: "Sitios de Redireccion", icon: Globe, color: "bg-green-500", desc: "Gestionar enlaces externos", view: "sitios" },
  { label: "Directorio de Extensiones", icon: Phone, color: "bg-rose-500", desc: "Administrar extensiones", view: "directorio-extensiones" },
  { label: "Directorio de Correos", icon: Mail, color: "bg-amber-500", desc: "Administrar correos institucionales", view: "directorio-correos" },
];

export function WelcomeView({ onViewChange }: { onViewChange: (view: AdminView) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 px-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#0778AC] rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC]">Intranet Institucional</h1>
            <p className="text-sm text-gray-500">Panel de Administracion</p>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#0778AC] via-[#CF3438] to-transparent w-48 mx-auto rounded-full mt-2" />
      </div>

      <p className="text-gray-600 text-center max-w-lg mb-10 text-sm md:text-base leading-relaxed">
        Bienvenido al Panel Administrativo. Desde aqui puede gestionar usuarios, cargos, modulos, sitios y directorios del portal institucional.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full max-w-5xl">
        {QUICK_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.view}
              onClick={() => onViewChange(stat.view)}
              className="bg-white rounded-lg border-2 border-gray-100 p-5 hover:border-[#0778AC]/30 hover:shadow-md transition-all group text-left"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{stat.label}</h3>
              <p className="text-xs text-gray-500">{stat.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
