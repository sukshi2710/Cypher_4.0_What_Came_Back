import { useState } from "react";
import DashboardReturns from "./components/DashboardReturns";
import ReturnApprovalHub from "./components/ReturnApprovalHub";
import SupplierQualityView from "./components/SupplierQualityView";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "approval" | "suppliers">("dashboard");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">WHAT CAME BACK</h1>
              <p className="text-xs text-slate-400">Intelligent E-Commerce Returns & Recovery Platform</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("approval")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "approval"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              Approval Hub
            </button>
            <button
              onClick={() => setActiveTab("suppliers")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "suppliers"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              Supplier Quality
            </button>
          </nav>
        </div>
      </header>

      {/* Dynamic Content Body */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "dashboard" && <DashboardReturns />}
        {activeTab === "approval" && <ReturnApprovalHub />}
        {activeTab === "suppliers" && <SupplierQualityView />}
      </main>
    </div>
  );
}
