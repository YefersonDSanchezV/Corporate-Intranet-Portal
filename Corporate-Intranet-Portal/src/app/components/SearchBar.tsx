import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="mb-6 md:mb-8">
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-[#0778AC]" />
        <input
          type="text"
          placeholder="Buscar aplicaciones o recursos..."
          className="w-full bg-white border-2 border-gray-200 rounded-lg pl-10 md:pl-14 pr-4 py-3 md:py-4 text-base md:text-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all shadow-sm"
        />
      </div>
    </div>
  );
}