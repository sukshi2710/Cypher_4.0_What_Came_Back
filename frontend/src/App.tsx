import { useState } from 'react';
import { LayoutDashboard, SlidersHorizontal, ShieldAlert } from 'lucide-react';

// Import your dynamic view components
import DashboardReturns from './components/DashboardReturns';
import ReturnApprovalHub from './components/ReturnApprovalHub';
import SupplierQualityView from './components/SupplierQualityView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-teal-500/20">
              G
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white">Gadgetbay</h2>
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Returns Agent v2.6</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard size={18} /> Dashboard &amp; ROI
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'routes'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <SlidersHorizontal size={18} /> Route Splitter &amp; Approvals
            </button>

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'suppliers'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert size={18} /> Supplier Quality (HB-09)
            </button>
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs">
              SR
            </div>
            <div>
              <p className="text-xs font-bold text-white">Sneha Reddy</p>
              <p className="text-[10px] text-slate-400">Returns &amp; Recovery Lead</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        {activeTab === 'dashboard' && <DashboardReturns />}
        {activeTab === 'routes' && <ReturnApprovalHub />}
        {activeTab === 'suppliers' && <SupplierQualityView />}
      </main>

    </div>
  );
}