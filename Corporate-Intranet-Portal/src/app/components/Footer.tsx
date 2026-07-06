export function Footer() {
  return (
    <footer className="bg-white border-t-2 border-[#0778AC] mt-8 md:mt-12 shadow-md">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Contacto TI */}
          <div>
            <h3 className="text-[#0778AC] font-semibold mb-3 pb-2 border-b-2 border-[#CF3438]/20 text-sm md:text-base">
              Contacto Área de Tecnología
            </h3>
            <div className="space-y-2 text-xs md:text-sm text-gray-600">
              <p>Email: soporte@icvc.com.co</p>
              <p>Teléfono: +57 (5) 123 4567</p>
              <p>Ext: 5000 - 5001</p>
            </div>
          </div>

          {/* Políticas */}
          <div>
            <h3 className="text-[#0778AC] font-semibold mb-3 pb-2 border-b-2 border-[#CF3438]/20 text-sm md:text-base">
              Políticas Institucionales
            </h3>
            <div className="space-y-2 text-xs md:text-sm text-gray-600">
              <p>Política de Privacidad</p>
              <p>Términos de Uso</p>
              <p>Manual de Usuario</p>
            </div>
          </div>

          {/* Versión */}
          <div>
            <h3 className="text-[#0778AC] font-semibold mb-3 pb-2 border-b-2 border-[#CF3438]/20 text-sm md:text-base">
              Versión del Portal
            </h3>
            <div className="text-xs md:text-sm text-gray-600">
              <p>Versión 1.0.0</p>
              <p className="text-xs text-gray-500 mt-2">2026 - Instituto Cardiovascular del Cesar</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}