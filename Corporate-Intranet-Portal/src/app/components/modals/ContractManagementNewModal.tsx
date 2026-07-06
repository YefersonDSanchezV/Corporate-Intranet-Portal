import { X, Plus, Search, Eye, Edit, Power, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface ProfessionalExperience {
  id: string;
  title: string;
  employmentType: string;
  current: boolean;
  startMonth?: string;
  startYear: string;
  endMonth?: string;
  endYear?: string;
  location: string;
  locationType: string;
  description: string;
  profileTitle: string;
  skills: string;
}

interface AcademicFormation {
  id: string;
  title: string;
  status: string;
  institution: string;
}

interface Contract {
  id: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  profile: string[];
  email: string;
  primaryPhone: string;
  secondaryPhone?: string;
  portfolioLink?: string;
  profileDescription: string;
  experiences: ProfessionalExperience[];
  academicFormation: AcademicFormation[];
  complementaryFormation: string[];
  competencies: string;
  languages: string;
  cvFile?: File;
  status: "active" | "inactive" | "in_process";
  contractType: string;
  createdDate: Date;
}

interface ContractManagementNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContractManagementNewModal({ isOpen, onClose }: ContractManagementNewModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "in_process">("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Formulario de nuevo contrato
  const [newContract, setNewContract] = useState({
    documentType: "",
    documentNumber: "",
    fullName: "",
    profile: ["", "", ""],
    email: "",
    primaryPhone: "",
    secondaryPhone: "",
    portfolioLink: "",
    profileDescription: "",
    competencies: "",
    languages: "",
    contractType: ""
  });

  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
  const [academicFormations, setAcademicFormations] = useState<AcademicFormation[]>([]);
  const [complementaryFormations, setComplementaryFormations] = useState<string[]>([]);

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();

    const contract: Contract = {
      id: Date.now().toString(),
      ...newContract,
      profile: newContract.profile.filter(p => p.trim() !== ""),
      experiences,
      academicFormation: academicFormations,
      complementaryFormation: complementaryFormations,
      status: "in_process",
      createdDate: new Date()
    };

    setContracts([...contracts, contract]);
    resetForm();
    setActiveTab("list");
  };

  const resetForm = () => {
    setNewContract({
      documentType: "",
      documentNumber: "",
      fullName: "",
      profile: ["", "", ""],
      email: "",
      primaryPhone: "",
      secondaryPhone: "",
      portfolioLink: "",
      profileDescription: "",
      competencies: "",
      languages: "",
      contractType: ""
    });
    setExperiences([]);
    setAcademicFormations([]);
    setComplementaryFormations([]);
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      id: Date.now().toString(),
      title: "",
      employmentType: "",
      current: false,
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      location: "",
      locationType: "",
      description: "",
      profileTitle: "",
      skills: ""
    }]);
  };

  const addAcademicFormation = () => {
    setAcademicFormations([...academicFormations, {
      id: Date.now().toString(),
      title: "",
      status: "",
      institution: ""
    }]);
  };

  const addComplementaryFormation = () => {
    setComplementaryFormations([...complementaryFormations, ""]);
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.documentNumber.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || contract.status === filterStatus;
    const matchesType = filterType === "all" || contract.contractType === filterType;
    const matchesYear = filterYear === "all" || contract.createdDate.getFullYear().toString() === filterYear;

    return matchesSearch && matchesStatus && matchesType && matchesYear;
  });

  if (!isOpen) return null;

  // Solo permitir acceso a administrativo_rrhh
  if (user?.role !== "administrativo_rrhh" && user?.role !== "admin" && user?.role !== "root") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-[#CF3438] mb-4">Acceso Denegado</h2>
          <p className="text-gray-700 mb-6">
            Esta función solo está disponible para el personal de Recursos Humanos.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0778AC] to-[#0778AC]/90 text-white px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
          <h2 className="text-xl font-semibold">Gestión de Contratos</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 border-b-2 border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === "list"
                  ? "bg-white text-[#0778AC] border-b-4 border-[#0778AC]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Consultar Contratos
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === "create"
                  ? "bg-white text-[#0778AC] border-b-4 border-[#0778AC]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Registrar Contrato
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "list" ? (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="in_process">En Proceso</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="indefinido">Indefinido</option>
                  <option value="fijo">Fijo</option>
                  <option value="temporal">Temporal</option>
                  <option value="prestacion">Prestación de Servicios</option>
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                >
                  <option value="all">Todos los años</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>

              {/* Tabla */}
              {filteredContracts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0778AC] text-white">
                        <th className="px-4 py-3 text-left">Nombre</th>
                        <th className="px-4 py-3 text-left">Perfil</th>
                        <th className="px-4 py-3 text-left">Estado</th>
                        <th className="px-4 py-3 text-left">Tipo de Contrato</th>
                        <th className="px-4 py-3 text-left">Fecha</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.map((contract) => (
                        <tr key={contract.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{contract.fullName}</td>
                          <td className="px-4 py-3">{contract.profile.join(", ")}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              contract.status === "active"
                                ? "bg-green-100 text-green-800"
                                : contract.status === "inactive"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {contract.status === "active" ? "Activo" : contract.status === "inactive" ? "Inactivo" : "En Proceso"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{contract.contractType}</td>
                          <td className="px-4 py-3">
                            {contract.status === "active"
                              ? contract.createdDate.toLocaleDateString()
                              : "En contratación"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors" title="Ver">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="Editar">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Cambiar estado">
                                <Power className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay contratos registrados</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateContract} className="space-y-6">
              {/* Información Personal */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Tipo de Documento <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newContract.documentType}
                      onChange={(e) => setNewContract({ ...newContract, documentType: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="PP">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Número de Documento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newContract.documentNumber}
                      onChange={(e) => setNewContract({ ...newContract, documentNumber: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newContract.fullName}
                      onChange={(e) => setNewContract({ ...newContract, fullName: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Perfil */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Perfil del Empleado</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Perfil Obligatorio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newContract.profile[0]}
                      onChange={(e) => {
                        const newProfiles = [...newContract.profile];
                        newProfiles[0] = e.target.value;
                        setNewContract({ ...newContract, profile: newProfiles });
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Perfil Opcional 1
                    </label>
                    <input
                      type="text"
                      value={newContract.profile[1]}
                      onChange={(e) => {
                        const newProfiles = [...newContract.profile];
                        newProfiles[1] = e.target.value;
                        setNewContract({ ...newContract, profile: newProfiles });
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Perfil Opcional 2
                    </label>
                    <input
                      type="text"
                      value={newContract.profile[2]}
                      onChange={(e) => {
                        const newProfiles = [...newContract.profile];
                        newProfiles[2] = e.target.value;
                        setNewContract({ ...newContract, profile: newProfiles });
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    />
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newContract.email}
                      onChange={(e) => setNewContract({ ...newContract, email: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Número de Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newContract.primaryPhone}
                      onChange={(e) => setNewContract({ ...newContract, primaryPhone: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Número de Contacto Opcional
                    </label>
                    <input
                      type="tel"
                      value={newContract.secondaryPhone}
                      onChange={(e) => setNewContract({ ...newContract, secondaryPhone: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Link de Portafolio Web (Opcional)
                    </label>
                    <input
                      type="url"
                      value={newContract.portfolioLink}
                      onChange={(e) => setNewContract({ ...newContract, portfolioLink: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción del Perfil */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Descripción del Perfil Profesional</h3>
                <textarea
                  value={newContract.profileDescription}
                  onChange={(e) => setNewContract({ ...newContract, profileDescription: e.target.value })}
                  rows={4}
                  maxLength={2000}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC] resize-none"
                  placeholder="Describa el perfil profesional..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {newContract.profileDescription.length}/2000 caracteres
                </p>
              </div>

              {/* Tipo de Contrato */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Tipo de Contrato</h3>
                <select
                  value={newContract.contractType}
                  onChange={(e) => setNewContract({ ...newContract, contractType: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  required
                >
                  <option value="">Seleccione...</option>
                  <option value="indefinido">Indefinido</option>
                  <option value="fijo">Fijo</option>
                  <option value="temporal">Temporal</option>
                  <option value="prestacion">Prestación de Servicios</option>
                </select>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Por razones de espacio, los campos de experiencia profesional, formación académica,
                  competencias, idiomas y carga de CV se mostrarían en pantallas adicionales en la implementación completa.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab("list");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#0778AC] to-[#0778AC]/90 hover:from-[#0778AC]/90 hover:to-[#0778AC] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Guardar Contrato
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
