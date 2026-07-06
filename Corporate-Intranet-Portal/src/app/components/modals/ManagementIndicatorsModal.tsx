import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface ManagementIndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManagementIndicatorsModal({ isOpen, onClose }: ManagementIndicatorsModalProps) {
  const satisfactionData = [
    { month: "Ene", value: 92 },
    { month: "Feb", value: 94 },
    { month: "Mar", value: 96 },
  ];

  const areaPerformanceData = [
    { area: "Urgencias", performance: 95 },
    { area: "UCI", performance: 92 },
    { area: "Quirófano", performance: 98 },
    { area: "Cardiología", performance: 96 },
    { area: "Laboratorio", performance: 88 },
  ];

  const eventsData = [
    { name: "Resueltos", value: 65, color: "#22c55e" },
    { name: "En proceso", value: 25, color: "#f59e0b" },
    { name: "Pendientes", value: 10, color: "#ef4444" },
  ];

  const kpiCards = [
    {
      title: "Satisfacción del Paciente",
      value: "96%",
      change: "+4%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Eventos Adversos",
      value: "12",
      change: "-8",
      trend: "down",
      icon: TrendingDown,
      color: "text-red-600"
    },
    {
      title: "Cumplimiento Protocolos",
      value: "98%",
      change: "+2%",
      trend: "up",
      icon: Activity,
      color: "text-blue-600"
    },
    {
      title: "Tiempo Espera Promedio",
      value: "18 min",
      change: "-5 min",
      trend: "down",
      icon: TrendingDown,
      color: "text-green-600"
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0778AC] text-xl flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Dashboard de Indicadores de Gestión
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información del modal
          </DialogDescription>
          <p className="text-sm text-gray-600 mt-2">
            Monitoreo de indicadores reportados por el personal de las áreas
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi, index) => (
              <div
                key={index}
                className="p-4 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${kpi.trend === "up" ? "bg-green-100" : "bg-red-100"}`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <span className={`text-sm font-semibold ${kpi.color}`}>
                    {kpi.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{kpi.value}</h3>
                <p className="text-sm text-gray-600">{kpi.title}</p>
              </div>
            ))}
          </div>

          {/* Satisfaction Trend */}
          <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0778AC]" />
              Tendencia de Satisfacción del Paciente
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0778AC" 
                  strokeWidth={3}
                  name="Satisfacción (%)"
                  dot={{ fill: "#CF3438", r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance by Area */}
            <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#CF3438]" />
                Desempeño por Área
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={areaPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" angle={-15} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="performance" fill="#0778AC" name="Desempeño (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Events Distribution */}
            <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#CF3438]" />
                Distribución de Eventos
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Table */}
          <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">
              Resumen de Indicadores por Área
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Área</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Cumplimiento</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Eventos</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { area: "Urgencias", cumplimiento: "95%", eventos: 3, estado: "Óptimo" },
                    { area: "UCI", cumplimiento: "92%", eventos: 5, estado: "Bueno" },
                    { area: "Quirófano", cumplimiento: "98%", eventos: 1, estado: "Excelente" },
                    { area: "Cardiología", cumplimiento: "96%", eventos: 2, estado: "Óptimo" },
                    { area: "Laboratorio", cumplimiento: "88%", eventos: 6, estado: "Requiere Atención" },
                  ].map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{row.area}</td>
                      <td className="p-3 text-center font-semibold text-[#0778AC]">{row.cumplimiento}</td>
                      <td className="p-3 text-center text-gray-700">{row.eventos}</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          row.estado === "Excelente" ? "bg-green-100 text-green-800" :
                          row.estado === "Óptimo" ? "bg-blue-100 text-blue-800" :
                          row.estado === "Bueno" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
