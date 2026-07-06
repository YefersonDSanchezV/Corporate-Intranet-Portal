import { X, Plus, Search, Eye, Edit, Power, FileText, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface ProfessionalExperience {
  id: string;
  title: string;
  employmentType: string;
  currentJob: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
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
  profiles: string[];
  email: string;
  primaryPhone: string;
  secondaryPhone: string;
  portfolioLink: string;
  profileDescription: string;
  experiences: ProfessionalExperience[];
  academicFormations: AcademicFormation[];
  complementaryFormations: string[];
  competencies: string;
  languages: string;
  cvFile: File | null;
  status: "active" | "inactive" | "in_process";
  contractType: string;
  createdDate: Date;
  activatedDate: Date | null;
}

interface ContractManagementCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContractManagementCompleteModal({ isOpen, onClose }: ContractManagementCompleteModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "in_process">("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Formulario de nuevo contrato
  const [formData, setFormData] = useState({
    documentType: "",
    documentNumber: "",
    fullName: "",
    profile1: "",
    profile2: "",
    profile3: "",
    email: "",
    primaryPhone: "",
    secondaryPhone: "",
    portfolioLink: "",
    profileDescription: "",
    competencies: "",
    languages: "",
    contractType: "",
    cvFile: null as File | null
  });

  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
  const [academicFormations, setAcademicFormations] = useState<AcademicFormation[]>([]);
  const [complementaryFormations, setComplementaryFormations] = useState<string[]>([]);

  const addExperience = () => {
    setExperiences([...experiences, {
      id: Date.now().toString(),
      title: "",
      employmentType: "",
      currentJob: false,
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

  const updateExperience = (id: string, field: keyof ProfessionalExperience, value: any) => {
    setExperiences(experiences.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const addAcademicFormation = () => {
    setAcademicFormations([...academicFormations, {
      id: Date.now().toString(),
      title: "",
      status: "",
      institution: ""
    }]);
  };

  const updateAcademicFormation = (id: string, field: keyof AcademicFormation, value: string) => {
    setAcademicFormations(academicFormations.map(form =>
      form.id === id ? { ...form, [field]: value } : form
    ));
  };

  const removeAcademicFormation = (id: string) => {
    setAcademicFormations(academicFormations.filter(form => form.id !== id));
  };

  const addComplementaryFormation = () => {
    setComplementaryFormations([...complementaryFormations, ""]);
  };

  const updateComplementaryFormation = (index: number, value: string) => {
    const updated = [...complementaryFormations];
    updated[index] = value;
    setComplementaryFormations(updated);
  };

  const removeComplementaryFormation = (index: number) => {
    setComplementaryFormations(complementaryFormations.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profiles = [formData.profile1, formData.profile2, formData.profile3].filter(p => p.trim() !== "");

    const contract: Contract = {
      id: Date.now().toString(),
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      fullName: formData.fullName,
      profiles,
      email: formData.email,
      primaryPhone: formData.primaryPhone,
      secondaryPhone: formData.secondaryPhone,
      portfolioLink: formData.portfolioLink,
      profileDescription: formData.profileDescription,
      experiences,
      academicFormations,
      complementaryFormations: complementaryFormations.filter(f => f.trim() !== ""),
      competencies: formData.competencies,
      languages: formData.languages,
      cvFile: formData.cvFile,
      status: "in_process",
      contractType: formData.contractType,
      createdDate: new Date(),
      activatedDate: null
    };

    setContracts([...contracts, contract]);
    resetForm();
    setActiveTab("list");
  };

  const resetForm = () => {
    setFormData({
      documentType: "",
      documentNumber: "",
      fullName: "",
      profile1: "",
      profile2: "",
      profile3: "",
      email: "",
      primaryPhone: "",
      secondaryPhone: "",
      portfolioLink: "",
      profileDescription: "",
      competencies: "",
      languages: "",
      contractType: "",
      cvFile: null
    });
    setExperiences([]);
    setAcademicFormations([]);
    setComplementaryFormations([]);
  };

  const handleChangeStatus = (contractId: string, newStatus: "active" | "inactive" | "in_process") => {
    setContracts(contracts.map(contract => {
      if (contract.id === contractId) {
        return {
          ...contract,
          status: newStatus,
          activatedDate: newStatus === "active" && !contract.activatedDate ? new Date() : contract.activatedDate
        };
      }
      return contract;
    }));
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || contract.status === filterStatus;
    const matchesType = filterType === "all" || contract.contractType === filterType;

    let matchesYear = true;
    if (filterYear !== "all") {
      const yearToCheck = contract.activatedDate || contract.createdDate;
      matchesYear = yearToCheck.getFullYear().toString() === filterYear;
    }

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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto my-4">
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
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  />
                </div>
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
                        <th className="px-4 py-3 text-left">Fecha de Contratación</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.map((contract) => (
                        <tr key={contract.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{contract.fullName}</td>
                          <td className="px-4 py-3">{contract.profiles.join(", ")}</td>
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
                          <td className="px-4 py-3 capitalize">{contract.contractType}</td>
                          <td className="px-4 py-3">
                            {contract.status === "active" && contract.activatedDate
                              ? contract.activatedDate.toLocaleDateString()
                              : contract.status === "in_process"
                              ? "En contratación"
                              : contract.createdDate.toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Ver información"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <select
                                value={contract.status}
                                onChange={(e) => handleChangeStatus(contract.id, e.target.value as any)}
                                className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors text-xs font-semibold"
                                title="Cambiar estado"
                              >
                                <option value="in_process">En Proceso</option>
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                              </select>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Tipo de Documento del Empleado <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
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
                      Número de Documento del Empleado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Nombre del Empleado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Perfil del Empleado */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Perfil del Empleado</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Perfil Obligatorio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.profile1}
                      onChange={(e) => setFormData({ ...formData, profile1: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      placeholder="Ej: Médico Cardiólogo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Perfil Opcional 1
                    </label>
                    <input
                      type="text"
                      value={formData.profile2}
                      onChange={(e) => setFormData({ ...formData, profile2: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Perfil Opcional 2
                    </label>
                    <input
                      type="text"
                      value={formData.profile3}
                      onChange={(e) => setFormData({ ...formData, profile3: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Número de Contacto (Obligatorio) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.primaryPhone}
                      onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Número de Contacto (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={formData.secondaryPhone}
                      onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Link de Portafolio Web (Opcional)
                    </label>
                    <input
                      type="url"
                      value={formData.portfolioLink}
                      onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción del Perfil Profesional */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Descripción del Perfil Profesional</h3>
                <textarea
                  value={formData.profileDescription}
                  onChange={(e) => setFormData({ ...formData, profileDescription: e.target.value })}
                  rows={4}
                  maxLength={2000}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC] resize-none"
                  placeholder="Describa el perfil profesional del empleado..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.profileDescription.length}/2000 caracteres
                </p>
              </div>

              {/* Experiencia Profesional */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0778AC]">Experiencia Profesional</h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="bg-[#0778AC] hover:bg-[#0778AC]/90 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Experiencia
                  </button>
                </div>

                {experiences.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay experiencias agregadas</p>
                ) : (
                  <div className="space-y-6">
                    {experiences.map((exp, index) => (
                      <div key={exp.id} className="bg-white p-4 rounded-lg border-2 border-gray-300 relative">
                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <h4 className="font-semibold text-gray-800 mb-4">Experiencia {index + 1}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Título de la Experiencia Profesional
                            </label>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => updateExperience(exp.id, "title", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Tipo de Empleo
                            </label>
                            <select
                              value={exp.employmentType}
                              onChange={(e) => updateExperience(exp.id, "employmentType", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                            >
                              <option value="">Seleccione...</option>
                              <option value="Jornada completa">Jornada completa</option>
                              <option value="Jornada Parcial">Jornada Parcial</option>
                              <option value="Por cuenta propia">Por cuenta propia</option>
                              <option value="Autonomo">Autónomo</option>
                              <option value="Contrato por Obra o Servicio">Contrato por Obra o Servicio</option>
                              <option value="Practicas">Prácticas</option>
                              <option value="Practicas laboral">Prácticas laboral</option>
                              <option value="Trabajo por temporada">Trabajo por temporada</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`current-${exp.id}`}
                              checked={exp.currentJob}
                              onChange={(e) => updateExperience(exp.id, "currentJob", e.target.checked)}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`current-${exp.id}`} className="text-gray-700 font-medium text-sm">
                              Actualmente cuenta con el cargo
                            </label>
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              {exp.currentJob ? "Mes de Inicio" : "Mes de Inicio"}
                            </label>
                            <select
                              value={exp.startMonth}
                              onChange={(e) => updateExperience(exp.id, "startMonth", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                            >
                              <option value="">Mes...</option>
                              <option value="Enero">Enero</option>
                              <option value="Febrero">Febrero</option>
                              <option value="Marzo">Marzo</option>
                              <option value="Abril">Abril</option>
                              <option value="Mayo">Mayo</option>
                              <option value="Junio">Junio</option>
                              <option value="Julio">Julio</option>
                              <option value="Agosto">Agosto</option>
                              <option value="Septiembre">Septiembre</option>
                              <option value="Octubre">Octubre</option>
                              <option value="Noviembre">Noviembre</option>
                              <option value="Diciembre">Diciembre</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Año de Inicio
                            </label>
                            <input
                              type="number"
                              value={exp.startYear}
                              onChange={(e) => updateExperience(exp.id, "startYear", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                              min="1950"
                              max="2026"
                            />
                          </div>

                          {!exp.currentJob && (
                            <>
                              <div>
                                <label className="block text-gray-700 font-medium mb-2 text-sm">
                                  Mes Final
                                </label>
                                <select
                                  value={exp.endMonth}
                                  onChange={(e) => updateExperience(exp.id, "endMonth", e.target.value)}
                                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                                >
                                  <option value="">Mes...</option>
                                  <option value="Enero">Enero</option>
                                  <option value="Febrero">Febrero</option>
                                  <option value="Marzo">Marzo</option>
                                  <option value="Abril">Abril</option>
                                  <option value="Mayo">Mayo</option>
                                  <option value="Junio">Junio</option>
                                  <option value="Julio">Julio</option>
                                  <option value="Agosto">Agosto</option>
                                  <option value="Septiembre">Septiembre</option>
                                  <option value="Octubre">Octubre</option>
                                  <option value="Noviembre">Noviembre</option>
                                  <option value="Diciembre">Diciembre</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-gray-700 font-medium mb-2 text-sm">
                                  Año Final
                                </label>
                                <input
                                  type="number"
                                  value={exp.endYear}
                                  onChange={(e) => updateExperience(exp.id, "endYear", e.target.value)}
                                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                                  min="1950"
                                  max="2026"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Ubicación
                            </label>
                            <input
                              type="text"
                              value={exp.location}
                              onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                              placeholder="Ciudad, País"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Tipo de Ubicación
                            </label>
                            <select
                              value={exp.locationType}
                              onChange={(e) => updateExperience(exp.id, "locationType", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                            >
                              <option value="">Seleccione...</option>
                              <option value="presencial">Presencial</option>
                              <option value="hibrido">Híbrido</option>
                              <option value="remoto">Remoto</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Descripción de la Experiencia (máx. 2000 caracteres)
                            </label>
                            <textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, "description", e.target.value.slice(0, 2000))}
                              rows={3}
                              maxLength={2000}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC] resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{exp.description.length}/2000</p>
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Titular del Perfil o Cargos que Tuvo
                            </label>
                            <input
                              type="text"
                              value={exp.profileTitle}
                              onChange={(e) => updateExperience(exp.id, "profileTitle", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Aptitudes
                            </label>
                            <input
                              type="text"
                              value={exp.skills}
                              onChange={(e) => updateExperience(exp.id, "skills", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                              placeholder="Separadas por comas"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formación Académica */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0778AC]">Formación Académica</h3>
                  <button
                    type="button"
                    onClick={addAcademicFormation}
                    className="bg-[#0778AC] hover:bg-[#0778AC]/90 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Formación
                  </button>
                </div>

                {academicFormations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay formaciones académicas agregadas</p>
                ) : (
                  <div className="space-y-4">
                    {academicFormations.map((form, index) => (
                      <div key={form.id} className="bg-white p-4 rounded-lg border-2 border-gray-300 relative">
                        <button
                          type="button"
                          onClick={() => removeAcademicFormation(form.id)}
                          className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <h4 className="font-semibold text-gray-800 mb-4">Formación {index + 1}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Título de la Formación Académica
                            </label>
                            <input
                              type="text"
                              value={form.title}
                              onChange={(e) => updateAcademicFormation(form.id, "title", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Estado de la Formación
                            </label>
                            <select
                              value={form.status}
                              onChange={(e) => updateAcademicFormation(form.id, "status", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                            >
                              <option value="">Seleccione...</option>
                              <option value="Profesional">Profesional</option>
                              <option value="Tecnico">Técnico</option>
                              <option value="Tecnologo">Tecnólogo</option>
                              <option value="Bachiller Academico">Bachiller Académico</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-2 text-sm">
                              Centro de Educación
                            </label>
                            <input
                              type="text"
                              value={form.institution}
                              onChange={(e) => updateAcademicFormation(form.id, "institution", e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formación Complementaria (Opcional) */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0778AC]">Formación Complementaria (Opcional)</h3>
                  <button
                    type="button"
                    onClick={addComplementaryFormation}
                    className="bg-[#0778AC] hover:bg-[#0778AC]/90 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Formación
                  </button>
                </div>

                {complementaryFormations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay formaciones complementarias agregadas</p>
                ) : (
                  <div className="space-y-3">
                    {complementaryFormations.map((formation, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formation}
                          onChange={(e) => updateComplementaryFormation(index, e.target.value)}
                          className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                          placeholder="Nombre de la formación complementaria"
                        />
                        <button
                          type="button"
                          onClick={() => removeComplementaryFormation(index)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Competencias */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Competencias</h3>
                <textarea
                  value={formData.competencies}
                  onChange={(e) => setFormData({ ...formData, competencies: e.target.value })}
                  rows={3}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC] resize-none"
                  placeholder="Liste las competencias del empleado..."
                />
              </div>

              {/* Idiomas */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Idiomas</h3>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  placeholder="Ej: Español (Nativo), Inglés (Intermedio)"
                />
              </div>

              {/* Cargar CV en PDF */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Cargar CV (.pdf)</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0778AC] transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Haga clic para cargar el CV en formato PDF</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData({ ...formData, cvFile: e.target.files[0] });
                      }
                    }}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label
                    htmlFor="cv-upload"
                    className="inline-block bg-[#0778AC] hover:bg-[#0778AC]/90 text-white px-6 py-2 rounded-lg font-semibold cursor-pointer transition-all"
                  >
                    Seleccionar Archivo
                  </label>
                  {formData.cvFile && (
                    <p className="text-sm text-green-600 mt-3 font-semibold">
                      ✓ Archivo seleccionado: {formData.cvFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Tipo de Contrato */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-[#0778AC] mb-4">Tipo de Contrato</h3>
                <select
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
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

              {/* Botones */}
              <div className="flex gap-4 pt-4">
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
