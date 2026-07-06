import { X, Plus, History, Pencil, FileX, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface ContractHistory {
  contractNo: string;
  type: string;
  startDate: string;
  endDate?: string;
  observation: string;
}

interface TerminationContract {
  id: string;
  docNumber: string;
  name: string;
  position: string;
  contractType: string;
  startDate: string;
  endDate: string;
  history: ContractHistory[];
  status?: string;
}

interface IndefiniteContract {
  id: string;
  docNumber: string;
  name: string;
  position: string;
  contractType: string;
  startDate: string;
  history: ContractHistory[];
}

interface LiquidatedContract {
  id: string;
  docNumber: string;
  name: string;
  subgroup: string;
  group: string;
  salary: string;
  startDate: string;
  contractType: string;
  endDate: string;
  status: "Liquidado" | "No Liquidado";
}

// ─────────────────────────────────────────────
// DATOS MOCK
// ─────────────────────────────────────────────
const INITIAL_TERMINATION: TerminationContract[] = [
  {
    id: "1",
    docNumber: "1.001.234.567",
    name: "Andrés Felipe Ramos",
    position: "Auxiliar de Enfermería",
    contractType: "Obra o Labor",
    startDate: "2025-01-15",
    endDate: "2026-06-30",
    history: [
      { contractNo: "001", type: "Término Fijo", startDate: "2024-01-15", endDate: "2024-12-31", observation: "Primer contrato" },
      { contractNo: "002", type: "Obra o Labor", startDate: "2025-01-15", endDate: "2026-06-30", observation: "Renovación por proyecto" },
    ],
  },
  {
    id: "2",
    docNumber: "1.002.345.678",
    name: "Carolina Jiménez Torres",
    position: "Bacterióloga",
    contractType: "Término Fijo",
    startDate: "2025-03-01",
    endDate: "2026-02-28",
    history: [
      { contractNo: "001", type: "Término Fijo", startDate: "2025-03-01", endDate: "2026-02-28", observation: "Contrato inicial" },
    ],
  },
];

const INITIAL_INDEFINITE: IndefiniteContract[] = [
  {
    id: "1",
    docNumber: "1.010.111.222",
    name: "Luis Hernando Pérez",
    position: "Médico General",
    contractType: "Término Indefinido",
    startDate: "2020-06-01",
    history: [
      { contractNo: "001", type: "Término Fijo", startDate: "2020-06-01", endDate: "2021-05-31", observation: "Contrato inicial" },
      { contractNo: "002", type: "Término Indefinido", startDate: "2021-06-01", observation: "Conversión a indefinido" },
    ],
  },
];

const INITIAL_LIQUIDATED: LiquidatedContract[] = [
  {
    id: "1",
    docNumber: "1.020.222.333",
    name: "Sandra Milena Gómez",
    subgroup: "Asistencial",
    group: "Salud",
    salary: "$2.500.000",
    startDate: "2022-01-01",
    contractType: "Término Fijo",
    endDate: "2024-12-31",
    status: "Liquidado",
  },
];

// ─────────────────────────────────────────────
// TIPOS DE SUBMODAL
// ─────────────────────────────────────────────
type SubModalType =
  | { kind: "none" }
  | { kind: "history_term"; contract: TerminationContract }
  | { kind: "edit_term"; contract: TerminationContract }
  | { kind: "end_term"; contract: TerminationContract }
  | { kind: "load_term" }
  | { kind: "history_indef"; contract: IndefiniteContract }
  | { kind: "edit_indef"; contract: IndefiniteContract }
  | { kind: "end_indef"; contract: IndefiniteContract }
  | { kind: "load_indef" }
  | { kind: "detail_liq"; contract: LiquidatedContract }
  | { kind: "load_liq" };

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
interface ContractMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContractMatrixModal({ isOpen, onClose }: ContractMatrixModalProps) {
  const [activeTab, setActiveTab] = useState<"termination" | "indefinite" | "liquidated">("termination");
  const [subModal, setSubModal] = useState<SubModalType>({ kind: "none" });

  const [termContracts, setTermContracts] = useState<TerminationContract[]>(() => {
    const saved = localStorage.getItem('intranet_termContracts');
    const base = saved ? JSON.parse(saved) : INITIAL_TERMINATION;
    return base.map((c: TerminationContract) => {
      const isExpired = new Date(c.endDate) < new Date();
      return { ...c, status: isExpired ? "Liquidado" : "Vigente" };
    });
  });

  const [indefContracts, setIndefContracts] = useState<IndefiniteContract[]>(() => {
    const saved = localStorage.getItem('intranet_indefContracts');
    return saved ? JSON.parse(saved) : INITIAL_INDEFINITE;
  });

  const [liqContracts, setLiqContracts] = useState<LiquidatedContract[]>(() => {
    const saved = localStorage.getItem('intranet_liqContracts');
    return saved ? JSON.parse(saved) : INITIAL_LIQUIDATED;
  });

  import("react").then(React => {
    React.useEffect(() => {
      localStorage.setItem('intranet_termContracts', JSON.stringify(termContracts));
    }, [termContracts]);
    React.useEffect(() => {
      localStorage.setItem('intranet_indefContracts', JSON.stringify(indefContracts));
    }, [indefContracts]);
    React.useEffect(() => {
      localStorage.setItem('intranet_liqContracts', JSON.stringify(liqContracts));
    }, [liqContracts]);
  });

  if (!isOpen) return null;

  const closeSubModal = () => setSubModal({ kind: "none" });

  // Handlers para contratos con terminación
  const handleAddTermContract = (data: Omit<TerminationContract, "id" | "history">) => {
    const newContract: TerminationContract = {
      ...data,
      id: Date.now().toString(),
      history: [{ contractNo: "001", type: data.contractType, startDate: data.startDate, endDate: data.endDate, observation: "Registro inicial" }],
    };
    setTermContracts((prev) => [newContract, ...prev]);
    closeSubModal();
  };

  const handleEndTermContract = (id: string, action: "finalize" | "renew", formData: Record<string, string>) => {
    setTermContracts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const histNo = String(c.history.length + 1).padStart(3, "0");
        const newEntry: ContractHistory = {
          contractNo: histNo,
          type: action === "renew" ? formData.newType || c.contractType : c.contractType,
          startDate: action === "renew" ? formData.newStartDate : c.startDate,
          endDate: formData.endDate,
          observation: formData.observation,
        };
        return { ...c, endDate: formData.endDate, history: [...c.history, newEntry] };
      })
    );
    closeSubModal();
  };

  const handleAddIndefContract = (data: Omit<IndefiniteContract, "id" | "history">) => {
    const newContract: IndefiniteContract = {
      ...data,
      id: Date.now().toString(),
      history: [{ contractNo: "001", type: data.contractType, startDate: data.startDate, observation: "Registro inicial" }],
    };
    setIndefContracts((prev) => [newContract, ...prev]);
    closeSubModal();
  };

  const handleEndIndefContract = (id: string, formData: Record<string, string>) => {
    setIndefContracts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const histNo = String(c.history.length + 1).padStart(3, "0");
        const newEntry: ContractHistory = {
          contractNo: histNo, type: c.contractType, startDate: c.startDate,
          endDate: formData.endDate, observation: formData.observation,
        };
        return { ...c, history: [...c.history, newEntry] };
      })
    );
    closeSubModal();
  };

  const handleToggleLiqStatus = (id: string) => {
    setLiqContracts((prev) =>
      prev.map((c) => c.id === id ? { ...c, status: c.status === "Liquidado" ? "No Liquidado" : "Liquidado" } : c)
    );
  };

  const handleAddLiqContract = (data: Omit<LiquidatedContract, "id">) => {
    setLiqContracts((prev) => [{ ...data, id: Date.now().toString() }, ...prev]);
    closeSubModal();
  };

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 md:p-5 text-white flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Matriz de Contratos</h2>
              <p className="text-white/80 text-xs mt-1">Gestión de contratos del personal institucional</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0 overflow-x-auto">
            {[
              { key: "termination", label: "Contratos con Terminaciones" },
              { key: "indefinite", label: "Contratos Indefinidos" },
              { key: "liquidated", label: "Contratos Liquidados" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-5 py-3 font-medium text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "border-[#0778AC] text-[#0778AC] bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* ═══════════════ TAB 1: Terminaciones ═══════════════ */}
            {activeTab === "termination" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-gray-700">Empleados con contrato de terminación</h3>
                  <button
                    onClick={() => setSubModal({ kind: "load_term" })}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-4 py-2 rounded-lg font-medium text-sm shadow transition-all"
                  >
                    <Plus className="w-4 h-4" /> Cargar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        {["Nombre", "Cargo", "Fecha Inicial", "Fecha Final", "Tipo Contrato", "Acciones"].map((h) => (
                          <th key={h} className="text-left py-3 px-3 text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {termContracts.map((c) => (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 font-medium text-gray-800">{c.name}</td>
                          <td className="py-3 px-3 text-gray-600">{c.position}</td>
                          <td className="py-3 px-3 text-gray-600">{c.startDate}</td>
                          <td className="py-3 px-3 text-gray-600">{c.endDate}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.contractType}</span>
                              {c.status === "Liquidado" && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Liquidado</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSubModal({ kind: "history_term", contract: c })}
                                title="Ver Historial"
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSubModal({ kind: "edit_term", contract: c })}
                                title="Editar"
                                className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSubModal({ kind: "end_term", contract: c })}
                                title="Finalizar / Renovar"
                                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                              >
                                <FileX className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════════ TAB 2: Indefinidos ═══════════════ */}
            {activeTab === "indefinite" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-gray-700">Empleados con contrato indefinido</h3>
                  <button
                    onClick={() => setSubModal({ kind: "load_indef" })}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-4 py-2 rounded-lg font-medium text-sm shadow transition-all"
                  >
                    <Plus className="w-4 h-4" /> Cargar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        {["Nombre", "Cargo", "Fecha Inicial", "Tipo Contrato", "Acciones"].map((h) => (
                          <th key={h} className="text-left py-3 px-3 text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {indefContracts.map((c) => (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 font-medium text-gray-800">{c.name}</td>
                          <td className="py-3 px-3 text-gray-600">{c.position}</td>
                          <td className="py-3 px-3 text-gray-600">{c.startDate}</td>
                          <td className="py-3 px-3">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{c.contractType}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSubModal({ kind: "history_indef", contract: c })} title="Ver Historial" className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                                <History className="w-4 h-4" />
                              </button>
                              <button onClick={() => setSubModal({ kind: "edit_indef", contract: c })} title="Editar" className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => setSubModal({ kind: "end_indef", contract: c })} title="Finalizar" className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
                                <FileX className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════════ TAB 3: Liquidados ═══════════════ */}
            {activeTab === "liquidated" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-gray-700">Contratos liquidados</h3>
                  <button
                    onClick={() => setSubModal({ kind: "load_liq" })}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-4 py-2 rounded-lg font-medium text-sm shadow transition-all"
                  >
                    <Plus className="w-4 h-4" /> Cargar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        {["No. Documento", "Nombre", "Subgrupo", "Grupo", "Salario", "Fecha Inicial", "Tipo", "Fecha Terminación", "Estado", "Acciones"].map((h) => (
                          <th key={h} className="text-left py-2 px-2 text-gray-600 font-semibold text-xs whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {liqContracts.map((c) => (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-2 text-xs text-gray-600">{c.docNumber}</td>
                          <td className="py-2 px-2 font-medium text-gray-800 text-xs">{c.name}</td>
                          <td className="py-2 px-2 text-xs text-gray-600">{c.subgroup}</td>
                          <td className="py-2 px-2 text-xs text-gray-600">{c.group}</td>
                          <td className="py-2 px-2 text-xs text-gray-600">{c.salary}</td>
                          <td className="py-2 px-2 text-xs text-gray-600">{c.startDate}</td>
                          <td className="py-2 px-2 text-xs text-gray-600">{c.contractType}</td>
                          <td className="py-2 px-2 text-xs text-gray-600">{c.endDate}</td>
                          <td className="py-2 px-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "Liquidado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSubModal({ kind: "detail_liq", contract: c })} title="Ver Detalle" className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleToggleLiqStatus(c.id)} title="Cambiar Estado" className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SUB-MODALES
      ═══════════════════════════════════════════════ */}

      {/* Historial — Terminaciones */}
      {subModal.kind === "history_term" && (
        <HistorySubModal
          title="Historial de Contratos"
          staticInfo={[
            { label: "Empleado", value: subModal.contract.name },
            { label: "Cargo Actual", value: subModal.contract.position },
            { label: "Fecha Inicial", value: subModal.contract.startDate },
            { label: "Fecha Final", value: subModal.contract.endDate },
            { label: "Tipo Contrato", value: subModal.contract.contractType },
          ]}
          history={subModal.contract.history}
          onClose={closeSubModal}
        />
      )}

      {/* Historial — Indefinidos */}
      {subModal.kind === "history_indef" && (
        <HistorySubModal
          title="Historial de Contratos"
          staticInfo={[
            { label: "Empleado", value: subModal.contract.name },
            { label: "Cargo Actual", value: subModal.contract.position },
            { label: "Fecha Inicial", value: subModal.contract.startDate },
            { label: "Tipo Contrato", value: subModal.contract.contractType },
          ]}
          history={subModal.contract.history}
          onClose={closeSubModal}
        />
      )}

      {/* Editar — Terminaciones */}
      {subModal.kind === "edit_term" && (
        <EditTermSubModal
          contract={subModal.contract}
          onSave={(updated) => {
            setTermContracts((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
            closeSubModal();
          }}
          onClose={closeSubModal}
        />
      )}

      {/* Editar — Indefinidos */}
      {subModal.kind === "edit_indef" && (
        <EditIndefSubModal
          contract={subModal.contract}
          onSave={(updated) => {
            setIndefContracts((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
            closeSubModal();
          }}
          onClose={closeSubModal}
        />
      )}

      {/* Finalizar/Renovar — Terminaciones */}
      {subModal.kind === "end_term" && (
        <EndTermSubModal
          contract={subModal.contract}
          onClose={closeSubModal}
          onSubmit={(action, data) => handleEndTermContract(subModal.contract.id, action, data)}
        />
      )}

      {/* Finalizar — Indefinidos */}
      {subModal.kind === "end_indef" && (
        <EndIndefSubModal
          contract={subModal.contract}
          onClose={closeSubModal}
          onSubmit={(data) => handleEndIndefContract(subModal.contract.id, data)}
        />
      )}

      {/* Cargar — Terminaciones */}
      {subModal.kind === "load_term" && (
        <LoadTermSubModal onClose={closeSubModal} onSave={handleAddTermContract} />
      )}

      {/* Cargar — Indefinidos */}
      {subModal.kind === "load_indef" && (
        <LoadIndefSubModal onClose={closeSubModal} onSave={handleAddIndefContract} />
      )}

      {/* Detalle — Liquidados */}
      {subModal.kind === "detail_liq" && (
        <LiqDetailSubModal contract={subModal.contract} onClose={closeSubModal} />
      )}

      {/* Cargar — Liquidados */}
      {subModal.kind === "load_liq" && (
        <LoadLiqSubModal
          existingContracts={[...termContracts, ...indefContracts] as any[]}
          onClose={closeSubModal}
          onSave={handleAddLiqContract}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// SUB-MODALES COMPONENTES
// ─────────────────────────────────────────────

function SubModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-[#CF3438] to-[#e74c3c] p-4 text-white flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-gray-100">
      <span className="text-xs font-semibold text-gray-500 sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}

// Historial
function HistorySubModal({ title, staticInfo, history, onClose }: { title: string; staticInfo: { label: string; value: string }[]; history: ContractHistory[]; onClose: () => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  return (
    <SubModalWrapper title={title} onClose={onClose}>
      <div className="mb-5 bg-gray-50 rounded-lg p-4 space-y-1">
        {staticInfo.map((info) => (
          <InfoRow key={info.label} label={info.label} value={info.value} />
        ))}
      </div>
      <h4 className="font-semibold text-[#0778AC] mb-3">Historial de Contratos</h4>
      <div className="space-y-2">
        {history.map((h, idx) => (
          <div key={idx} className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              <span className="font-semibold text-sm text-gray-700">Contrato #{h.contractNo}</span>
              {expandedIdx === idx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {expandedIdx === idx && (
              <div className="px-4 py-3 space-y-1 bg-white">
                <InfoRow label="No. Contrato" value={h.contractNo} />
                <InfoRow label="Tipo" value={h.type} />
                <InfoRow label="Inicio" value={h.startDate} />
                {h.endDate && <InfoRow label="Termina" value={h.endDate} />}
                <InfoRow label="Observación" value={h.observation} />
              </div>
            )}
          </div>
        ))}
      </div>
    </SubModalWrapper>
  );
}

// Editar — Terminaciones
function EditTermSubModal({ contract, onSave, onClose }: { contract: TerminationContract; onSave: (c: TerminationContract) => void; onClose: () => void }) {
  const [name, setName] = useState(contract.name);
  const [position, setPosition] = useState(contract.position);
  const [startDate, setStartDate] = useState(contract.startDate);
  const [endDate, setEndDate] = useState(contract.endDate);
  const [contractType, setContractType] = useState(contract.contractType);

  const CONTRACT_TYPES = ["Término Fijo", "Obra o Labor", "Prestación de Servicios", "Aprendizaje"];

  return (
    <SubModalWrapper title="Editar Contrato" onClose={onClose}>
      <Form fields={[]} onSubmit={() => onSave({ ...contract, name, position, startDate, endDate, contractType })} onClose={onClose}>
        <Field label="Nombre del Empleado" value={name} onChange={setName} />
        <Field label="Cargo Actual" value={position} onChange={setPosition} />
        <Field label="Fecha Inicial del Contrato" value={startDate} onChange={setStartDate} type="date" />
        <Field label="Fecha Final del Contrato" value={endDate} onChange={setEndDate} type="date" />
        <SelectField label="Tipo de Contrato" value={contractType} onChange={setContractType} options={CONTRACT_TYPES} />
      </Form>
    </SubModalWrapper>
  );
}

// Editar — Indefinidos
function EditIndefSubModal({ contract, onSave, onClose }: { contract: IndefiniteContract; onSave: (c: IndefiniteContract) => void; onClose: () => void }) {
  const [name, setName] = useState(contract.name);
  const [position, setPosition] = useState(contract.position);
  const [startDate, setStartDate] = useState(contract.startDate);
  const [contractType, setContractType] = useState(contract.contractType);
  return (
    <SubModalWrapper title="Editar Contrato Indefinido" onClose={onClose}>
      <Form fields={[]} onSubmit={() => onSave({ ...contract, name, position, startDate, contractType })} onClose={onClose}>
        <Field label="Nombre del Empleado" value={name} onChange={setName} />
        <Field label="Cargo Actual" value={position} onChange={setPosition} />
        <Field label="Fecha Inicial del Contrato" value={startDate} onChange={setStartDate} type="date" />
        <Field label="Tipo de Contrato" value={contractType} onChange={setContractType} />
      </Form>
    </SubModalWrapper>
  );
}

// Finalizar/Renovar — Terminaciones
function EndTermSubModal({ contract, onClose, onSubmit }: { contract: TerminationContract; onClose: () => void; onSubmit: (action: "finalize" | "renew", data: Record<string, string>) => void }) {
  const [action, setAction] = useState<"none" | "finalize" | "renew">("none");
  const [endDate, setEndDate] = useState("");
  const [observation, setObservation] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newType, setNewType] = useState("Término Fijo");
  const CONTRACT_TYPES = ["Término Fijo", "Obra o Labor", "Prestación de Servicios", "Aprendizaje", "Indefinido"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action === "none") return;
    onSubmit(action, { endDate, observation, newPosition, newStartDate, newType });
  };

  return (
    <SubModalWrapper title="Finalizar o Renovar Contrato" onClose={onClose}>
      <div className="mb-5 bg-gray-50 rounded-lg px-4 py-3">
        <p className="text-sm font-semibold text-gray-700 mb-1">Empleado: <span className="font-normal">{contract.name}</span></p>
        <p className="text-sm font-semibold text-gray-700">Cargo: <span className="font-normal">{contract.position}</span></p>
      </div>
      <p className="text-center font-semibold text-gray-700 mb-4">¿Desea Finalizar o Renovar el Contrato Vigente?</p>
      <div className="flex gap-3 mb-6">
        <button onClick={() => setAction("finalize")} className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${action === "finalize" ? "border-[#CF3438] bg-red-50 text-[#CF3438]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>Finalizar</button>
        <button onClick={() => setAction("renew")} className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${action === "renew" ? "border-[#0778AC] bg-blue-50 text-[#0778AC]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>Renovar</button>
      </div>
      {action !== "none" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Fecha de Finalización del Contrato *" value={endDate} onChange={setEndDate} type="date" required />
          <Field label="Observación" value={observation} onChange={setObservation} textarea />
          {action === "renew" && (
            <>
              <Field label="Nuevo Cargo del Empleado" value={newPosition} onChange={setNewPosition} />
              <Field label="Fecha Inicial del Nuevo Contrato" value={newStartDate} onChange={setNewStartDate} type="date" />
              <SelectField label="Tipo del Nuevo Contrato" value={newType} onChange={setNewType} options={CONTRACT_TYPES} />
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm hover:border-gray-300 transition-all">Cancelar</button>
            <button type="submit" className={`flex-1 text-white py-2.5 rounded-lg font-semibold text-sm transition-all ${action === "finalize" ? "bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438]" : "bg-gradient-to-r from-[#0778AC] to-[#0996d3] hover:from-[#065a87] hover:to-[#0778AC]"}`}>
              {action === "finalize" ? "Confirmar Finalización" : "Confirmar Renovación"}
            </button>
          </div>
        </form>
      )}
    </SubModalWrapper>
  );
}

// Finalizar — Indefinidos
function EndIndefSubModal({ contract, onClose, onSubmit }: { contract: IndefiniteContract; onClose: () => void; onSubmit: (data: Record<string, string>) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [observation, setObservation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ endDate, observation });
  };

  return (
    <SubModalWrapper title="Finalizar Contrato Indefinido" onClose={onClose}>
      <div className="mb-5 bg-gray-50 rounded-lg px-4 py-3">
        <p className="text-sm font-semibold text-gray-700 mb-1">Empleado: <span className="font-normal">{contract.name}</span></p>
        <p className="text-sm font-semibold text-gray-700">Cargo: <span className="font-normal">{contract.position}</span></p>
      </div>
      <p className="text-center font-semibold text-gray-700 mb-4">¿Desea Finalizar el Contrato Vigente?</p>
      <div className="flex gap-3 mb-6">
        <button onClick={() => setConfirm(true)} className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${confirm ? "border-[#CF3438] bg-red-50 text-[#CF3438]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>Finalizar</button>
      </div>
      {confirm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Fecha de Finalización del Contrato *" value={endDate} onChange={setEndDate} type="date" required />
          <Field label="Observación" value={observation} onChange={setObservation} textarea />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm hover:border-gray-300 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white py-2.5 rounded-lg font-semibold text-sm transition-all">Confirmar Finalización</button>
          </div>
        </form>
      )}
    </SubModalWrapper>
  );
}

// Cargar — Terminaciones
function LoadTermSubModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<TerminationContract, "id" | "history">) => void }) {
  const [docNumber, setDocNumber] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [contractType, setContractType] = useState("Término Fijo");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const CONTRACT_TYPES = ["Término Fijo", "Obra o Labor", "Prestación de Servicios", "Aprendizaje"];
  return (
    <SubModalWrapper title="Cargar Contrato con Terminación" onClose={onClose}>
      <Form fields={[]} onSubmit={() => onSave({ docNumber, name, position, contractType, startDate, endDate })} onClose={onClose}>
        <Field label="Número de Documento del Empleado *" value={docNumber} onChange={setDocNumber} required />
        <Field label="Nombre del Empleado *" value={name} onChange={setName} required />
        <Field label="Cargo del Empleado *" value={position} onChange={setPosition} required />
        <SelectField label="Tipo de Contrato *" value={contractType} onChange={setContractType} options={CONTRACT_TYPES} />
        <Field label="Fecha Inicio del Contrato *" value={startDate} onChange={setStartDate} type="date" required />
        <Field label="Fecha Final del Contrato *" value={endDate} onChange={setEndDate} type="date" required />
      </Form>
    </SubModalWrapper>
  );
}

// Cargar — Indefinidos
function LoadIndefSubModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<IndefiniteContract, "id" | "history">) => void }) {
  const [docNumber, setDocNumber] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [contractType, setContractType] = useState("Término Indefinido");
  const [startDate, setStartDate] = useState("");
  return (
    <SubModalWrapper title="Cargar Contrato Indefinido" onClose={onClose}>
      <Form fields={[]} onSubmit={() => onSave({ docNumber, name, position, contractType, startDate })} onClose={onClose}>
        <Field label="Número de Documento del Empleado *" value={docNumber} onChange={setDocNumber} required />
        <Field label="Nombre del Empleado *" value={name} onChange={setName} required />
        <Field label="Cargo del Empleado *" value={position} onChange={setPosition} required />
        <Field label="Tipo de Contrato" value={contractType} onChange={setContractType} />
        <Field label="Fecha Inicio del Contrato *" value={startDate} onChange={setStartDate} type="date" required />
      </Form>
    </SubModalWrapper>
  );
}

// Detalle — Liquidados
function LiqDetailSubModal({ contract, onClose }: { contract: LiquidatedContract; onClose: () => void }) {
  return (
    <SubModalWrapper title="Detalle de Contrato Liquidado" onClose={onClose}>
      <div className="space-y-1">
        <InfoRow label="No. Documento" value={contract.docNumber} />
        <InfoRow label="Nombre" value={contract.name} />
        <InfoRow label="Subgrupo" value={contract.subgroup} />
        <InfoRow label="Grupo" value={contract.group} />
        <InfoRow label="Salario" value={contract.salary} />
        <InfoRow label="Fecha Inicial" value={contract.startDate} />
        <InfoRow label="Tipo de Contrato" value={contract.contractType} />
        <InfoRow label="Fecha de Terminación" value={contract.endDate} />
        <InfoRow label="Estado" value={contract.status} />
      </div>
    </SubModalWrapper>
  );
}

// Cargar — Liquidados (con búsqueda)
function LoadLiqSubModal({ existingContracts, onClose, onSave }: { existingContracts: any[]; onClose: () => void; onSave: (data: Omit<LiquidatedContract, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [subgroup, setSubgroup] = useState("");
  const [group, setGroup] = useState("");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState<"Liquidado" | "No Liquidado">("No Liquidado");

  const filtered = existingContracts.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (c: any) => {
    setSelected(c);
    setSearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    onSave({
      docNumber,
      name: selected.name,
      subgroup,
      group,
      salary,
      startDate: selected.startDate,
      contractType: selected.contractType,
      endDate: selected.endDate || "Indefinido",
      status,
    });
  };

  return (
    <SubModalWrapper title="Cargar Contrato Liquidado" onClose={onClose}>
      {!selected ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">Busque el empleado por nombre para pre-cargar sus datos:</p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre del empleado..."
              className="w-full border-2 border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
            />
          </div>
          {search && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center py-4 text-gray-400 text-sm">Sin resultados</p>
              ) : (
                filtered.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(c)}
                    className="w-full text-left px-4 py-3 border-b last:border-0 border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.position} — {c.contractType}</p>
                  </button>
                ))
              )}
            </div>
          )}
          <button type="button" onClick={onClose} className="mt-4 w-full border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm hover:border-gray-300 transition-all">Cancelar</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-2">
            <p className="text-sm font-semibold text-gray-700">Empleado seleccionado: <span className="font-normal">{selected.name}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{selected.position} · {selected.contractType}</p>
          </div>
          <Field label="Número de Documento *" value={docNumber} onChange={setDocNumber} required />
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">Nombre Completo</label>
            <input type="text" value={selected.name} readOnly className="w-full border-2 border-gray-100 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">Cargo</label>
            <input type="text" value={selected.position} readOnly className="w-full border-2 border-gray-100 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <Field label="Subgrupo *" value={subgroup} onChange={setSubgroup} required />
          <Field label="Grupo *" value={group} onChange={setGroup} required />
          <Field label="Salario *" value={salary} onChange={setSalary} placeholder="Ej: $2.500.000" required />
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">Estado del Contrato</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] transition-all">
              <option>No Liquidado</option>
              <option>Liquidado</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSelected(null)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm hover:border-gray-300 transition-all">← Buscar otro</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white py-2.5 rounded-lg font-semibold text-sm transition-all">Guardar Contrato</button>
          </div>
        </form>
      )}
    </SubModalWrapper>
  );
}

// ─────────────────────────────────────────────
// HELPERS DE FORMULARIO
// ─────────────────────────────────────────────
function Form({ children, onSubmit, onClose, fields }: { children: React.ReactNode; onSubmit: () => void; onClose: () => void; fields: any[] }) {
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {children}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm hover:border-gray-300 transition-all">Cancelar</button>
        <button type="submit" className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white py-2.5 rounded-lg font-semibold text-sm transition-all">Guardar</button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required = false, textarea = false, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; textarea?: boolean; placeholder?: string }) {
  const cls = "w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all";
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls + " resize-none"} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
