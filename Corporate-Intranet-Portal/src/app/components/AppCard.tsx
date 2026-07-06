import { LucideIcon } from "lucide-react";

interface AppCardProps {
  title: React.ReactNode;
  icon: LucideIcon;
  size?: "large" | "medium";
  onClick?: () => void;
}

export function AppCard({ title, icon: Icon, size = "medium", onClick }: AppCardProps) {
  const sizeClasses = size === "large" 
    ? "p-4 md:p-6 lg:p-8 min-h-[120px] md:min-h-[140px]" 
    : "p-4 md:p-6 min-h-[100px] md:min-h-[120px]";
  
  const iconSize = size === "large" ? "w-8 h-8 md:w-10 md:h-10" : "w-6 h-6 md:w-8 md:h-8";

  return (
    <button 
      onClick={onClick}
      className={`bg-white border-2 border-gray-200 hover:border-[#CF3438] hover:shadow-lg transition-all rounded-lg ${sizeClasses} w-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center group`}
    >
      <div className="bg-gradient-to-br from-[#CF3438] to-[#e74c3c] rounded-lg p-3 md:p-4 group-hover:scale-110 transition-transform shadow-md">
        <Icon className={`${iconSize} text-white`} />
      </div>
      <span className="text-sm md:text-base text-gray-800 font-medium group-hover:text-[#0778AC] transition-colors">{title}</span>
    </button>
  );
}