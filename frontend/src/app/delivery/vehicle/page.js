"use client";

import { useState } from "react";
import {
  Wrench,
  Fuel,
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bike,
  Shield,
  FileText,
  ChevronRight,
  Settings,
  Thermometer,
  Battery,
  Zap,
} from "lucide-react";

export default function VehiclePage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Demo vehicle data
  const vehicle = {
    type: "Electric Scooter",
    model: "Ather 450X",
    plate: "KA-01-AB-1234",
    year: 2024,
    color: "Matte Black",
    battery: 72,
    range: "48 km",
    totalKm: "3,842 km",
    lastService: "Sep 15, 2024",
    nextService: "Dec 15, 2024",
    nextServiceKm: "5,000 km",
    insurance: {
      provider: "ICICI Lombard",
      expiry: "Mar 22, 2025",
      policyNo: "IL-2024-98765",
      status: "active",
    },
    documents: [
      { name: "Driving License", expiry: "Feb 2028", status: "valid" },
      { name: "Vehicle Registration", expiry: "Jan 2034", status: "valid" },
      { name: "Insurance", expiry: "Mar 2025", status: "valid" },
      { name: "PUC Certificate", expiry: "Nov 2024", status: "expiring_soon" },
    ],
    maintenanceLog: [
      {
        date: "Sep 15, 2024",
        type: "Routine Service",
        description: "Brake pad replacement, tire rotation, general checkup",
        cost: 1200,
        status: "completed",
      },
      {
        date: "Jul 28, 2024",
        type: "Tire Change",
        description: "Front tire replaced with MRF tubeless",
        cost: 800,
        status: "completed",
      },
      {
        date: "Jun 10, 2024",
        type: "Battery Health Check",
        description: "Battery cells inspected, firmware updated",
        cost: 0,
        status: "completed",
      },
      {
        date: "Dec 15, 2024",
        type: "Scheduled Service",
        description: "5000 km service — full checkup",
        cost: null,
        status: "upcoming",
      },
    ],
    coolingBags: {
      total: 3,
      inUse: 1,
      status: "good",
    },
  };

  const batteryColor =
    vehicle.battery > 60
      ? "text-green-600"
      : vehicle.battery > 30
      ? "text-amber-500"
      : "text-red-500";

  const batteryBg =
    vehicle.battery > 60
      ? "from-green-500 to-emerald-400"
      : vehicle.battery > 30
      ? "from-amber-500 to-yellow-400"
      : "from-red-500 to-red-400";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Vehicle Status
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your vehicle health and documents
        </p>
      </div>

      {/* Vehicle Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Vehicle Visual */}
          <div className="md:w-[280px] bg-gradient-to-br from-gray-900 to-gray-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 border border-white/20 rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-60 h-60 border border-white/10 rounded-full"></div>
            </div>
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                <Bike size={40} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">{vehicle.model}</p>
                <p className="text-gray-400 text-sm mt-1">{vehicle.plate}</p>
                <div className="mt-3 px-4 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                  Active
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Stats */}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Battery */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Battery size={16} className={batteryColor} />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Battery
                  </span>
                </div>
                <p className={`text-3xl font-extrabold ${batteryColor}`}>
                  {vehicle.battery}%
                </p>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${batteryBg} transition-all duration-1000`}
                    style={{ width: `${vehicle.battery}%` }}
                  ></div>
                </div>
              </div>

              {/* Range */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-blue-500" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Range Left
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900">
                  {vehicle.range}
                </p>
                <p className="text-xs text-gray-500">Estimated</p>
              </div>

              {/* Total KM */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge size={16} className="text-purple-500" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Odometer
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900">
                  {vehicle.totalKm}
                </p>
                <p className="text-xs text-gray-500">Total distance</p>
              </div>

              {/* Next Service */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-amber-500" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Next Service
                  </span>
                </div>
                <p className="text-xl font-extrabold text-gray-900">
                  {vehicle.nextService}
                </p>
                <p className="text-xs text-gray-500">
                  at {vehicle.nextServiceKm}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1.5">
        {[
          { id: "overview", label: "Overview", icon: Settings },
          { id: "maintenance", label: "Maintenance Log", icon: Wrench },
          { id: "documents", label: "Documents", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#2D6A2E] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cooling Equipment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              Cooling Equipment
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100/60">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Thermometer size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Insulated Cooling Bags
                    </p>
                    <p className="text-xs text-gray-500">
                      {vehicle.coolingBags.inUse} in use •{" "}
                      {vehicle.coolingBags.total} total
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded-full uppercase">
                  Good
                </span>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Insurance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Provider</span>
                <span className="text-sm font-semibold text-gray-900">
                  {vehicle.insurance.provider}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Policy No.</span>
                <span className="text-sm font-mono font-medium text-gray-700">
                  {vehicle.insurance.policyNo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Valid Until</span>
                <span className="text-sm font-semibold text-gray-900">
                  {vehicle.insurance.expiry}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded-full uppercase">
                  <CheckCircle2 size={12} />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              Maintenance History
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {vehicle.maintenanceLog.map((log, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    log.status === "upcoming"
                      ? "bg-amber-100"
                      : "bg-green-100"
                  }`}
                >
                  {log.status === "upcoming" ? (
                    <Clock size={18} className="text-amber-600" />
                  ) : (
                    <CheckCircle2 size={18} className="text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">
                      {log.type}
                    </p>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        log.status === "upcoming"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {log.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{log.date}</p>
                </div>
                <div className="text-right shrink-0">
                  {log.cost !== null ? (
                    <p className="text-sm font-bold text-gray-900">
                      ₹{log.cost}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">—</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Documents</h3>
            <button className="px-4 py-2 bg-[#2D6A2E] text-white text-sm font-medium rounded-xl hover:bg-[#245824] transition-colors">
              Upload Document
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {vehicle.documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <FileText size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires: {doc.expiry}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                      doc.status === "valid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {doc.status === "valid" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <AlertTriangle size={12} />
                    )}
                    {doc.status === "valid" ? "Valid" : "Expiring Soon"}
                  </span>
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
