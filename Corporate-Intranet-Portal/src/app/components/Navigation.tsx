import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

interface MenuItem {
  name: string;
  children?: string[];
}

const PUBLIC_MENU: MenuItem[] = [
  { name: "Inicio" },
  { name: "Area Asistencial" },
  { name: "Area Administrativa" },
  { name: "Gestion Institucional" },
  { name: "Soporte" },
  { name: "Directorio" },
  { name: "Innovacion Analitica" },
];

export function Navigation({ activeModule, onModuleChange }: NavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleModuleChange = (module: string) => {
    onModuleChange(module);
    setShowMobileMenu(false);
    setActiveDropdown(null);
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <nav className="bg-[#0778AC] shadow-md relative z-40">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => handleModuleChange("Inicio")} className="h-12 px-2 flex items-center">
          </button>
          <ul className="flex gap-1 flex-wrap items-center">
            {PUBLIC_MENU.map((item, index) => (
              <li key={index} className="relative group">
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`flex items-center gap-1 px-4 lg:px-5 py-4 transition-all font-medium text-sm lg:text-base ${
                        item.children.includes(activeModule) || activeDropdown === item.name
                          ? "bg-[#CF3438] text-white shadow-lg"
                          : "bg-[#0778AC] hover:bg-[#CF3438] text-white/90 hover:text-white"
                      }`}
                    >
                      {item.name}
                      <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === item.name ? "rotate-180" : ""}`} />
                    </button>
                    {activeDropdown === item.name && (
                      <div className="absolute top-full left-0 mt-0 w-56 bg-white shadow-xl border-t-4 border-[#CF3438] rounded-b-lg overflow-hidden py-2" onMouseLeave={() => setActiveDropdown(null)}>
                        {item.children.map((child) => (
                          <button key={child} onClick={() => handleModuleChange(child)} className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${activeModule === child ? "bg-[#f0f4f8] text-[#CF3438] border-l-4 border-[#CF3438]" : "text-gray-700 hover:bg-gray-100 hover:text-[#0778AC]"}`}>
                            {child}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleModuleChange(item.name)}
                    className={`px-4 lg:px-5 py-4 transition-all font-medium text-sm lg:text-base ${
                      activeModule === item.name ? "bg-[#CF3438] text-white shadow-lg" : "bg-[#0778AC] hover:bg-[#CF3438] text-white/90 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:hidden">
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="w-full flex items-center justify-between py-4 text-white font-medium">
            <span className="flex items-center gap-3">
              {activeModule}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showMobileMenu ? "rotate-180" : ""}`} />
          </button>

          {showMobileMenu && (
            <div className="absolute left-0 right-0 top-full bg-white shadow-lg z-50 border-t-2 border-[#CF3438]">
              <ul className="divide-y divide-gray-200">
                {PUBLIC_MENU.map((item) => (
                  <li key={item.name} className="flex flex-col">
                    <button
                      onClick={() => handleModuleChange(item.name)}
                      className={`w-full text-left px-4 py-4 transition-colors ${
                        activeModule === item.name ? "bg-[#CF3438] text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
