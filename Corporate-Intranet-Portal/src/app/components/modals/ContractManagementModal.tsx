import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { FileText, Search, Filter } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useState } from "react";
import { Badge } from "../ui/badge";

interface ContractManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContractManagementModal({ isOpen, onClose }: ContractManagementModalProps) {
  const [searchName, setSearchName] = useState("");
  const [searchDocument, setSearchDocument] = useState("");
  const [filterDate, setFilterDate] = useState("all");

  const contracts = [
    {
      name: "Juan Carlos Pérez Gómez",
      document: "1.234.567.890",
      position: "Médico Cardiólogo",
      contractType: "Indefinido",
      startDate: "01/01/2020",
      status: "Activo"
    },
    {
      name: "María Fernanda López Torres",
      document: "9.876.543.210",
      position: "Enfermera Jefe",
      contractType: "Indefinido",
      startDate: "15/03/2018",
      status: "Activo"
    },
    {
      name: "Carlos Alberto Ruiz Mendoza",
      document: "5.555.555.555",
      position: "Ingeniero de Sistemas",
      contractType: "Indefinido",
      startDate: "10/06/2019",
      status: "Activo"
    },
    {
      name: "Ana María Gómez Silva",
      document: "7.777.777.777",
      position: "Auxiliar Administrativa",
      contractType: "Fijo",
      startDate: "01/02/2024",
      status: "Activo"
    },
    {
      name: "Luis Eduardo Martínez",
      document: "3.333.333.333",
      position: "Técnico en Radiología",
      contractType: "Fijo",
      startDate: "20/08/2023",
      status: "Activo"
    },
    {
      name: "Sandra Patricia Torres",
      document: "6.666.666.666",
      position: "Química Farmacéutica",
      contractType: "Indefinido",
      startDate: "05/04/2017",
      status: "Activo"
    },
    {
      name: "Jorge Alberto Silva Ramírez",
      document: "4.444.444.444",
      position: "Médico Internista",
      contractType: "Indefinido",
      startDate: "12/09/2021",
      status: "Activo"
    },
    {
      name: "Diana Carolina Rojas Pérez",
      document: "8.888.888.888",
      position: "Coordinadora de Calidad",
      contractType: "Indefinido",
      startDate: "25/11/2019",
      status: "Activo"
    },
  ];

  const filteredContracts = contracts.filter(contract => {
    const matchesName = contract.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesDocument = contract.document.includes(searchDocument);
    
    let matchesDate = true;
    if (filterDate !== "all") {
      const year = contract.startDate.split("/")[2];
      matchesDate = year === filterDate;
    }

    return matchesName && matchesDocument && matchesDate;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#CF3438] text-xl">
            Gestión de Contratos - Empleados ICVC
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información del modal
          </DialogDescription>
          <p className="text-sm text-gray-600 mt-2">
            Módulo de consulta de contratos laborales - Acceso restringido al área administrativa
          </p>
        </DialogHeader>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4">
          <p className="text-sm text-yellow-800 font-medium">
            🔒 Acceso restringido: Este módulo solo está disponible para el personal del área de Gestión Administrativa
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="w-5 h-5 text-[#0778AC]" />
            Filtros de búsqueda
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Buscar por nombre</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nombre del empleado"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Buscar por documento</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Número de documento"
                  value={searchDocument}
                  onChange={(e) => setSearchDocument(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Filtrar por año de contratación</label>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los años</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                  <SelectItem value="2019">2019</SelectItem>
                  <SelectItem value="2018">2018</SelectItem>
                  <SelectItem value="2017">2017</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3 py-4">
          <p className="text-sm text-gray-600">
            Mostrando {filteredContracts.length} de {contracts.length} contratos
          </p>
          
          {filteredContracts.map((contract, index) => (
            <div
              key={index}
              className="p-4 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-[#0778AC] to-[#0891d1] rounded-lg p-3 shadow-md">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{contract.name}</h3>
                    <p className="text-sm text-gray-600">CC: {contract.document}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border border-green-300">
                  {contract.status}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Cargo</p>
                  <p className="font-medium text-gray-800">{contract.position}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de contrato</p>
                  <p className="font-medium text-gray-800">{contract.contractType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha de contratación</p>
                  <p className="font-medium text-gray-800">{contract.startDate}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredContracts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron contratos con los filtros aplicados
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
