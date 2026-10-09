import React, { useState } from 'react';
import { Layers, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ReturnApprovalHub() {
  const totalBatch = 200;
  const [vendorCount, setVendorCount] = useState(120);
  const [refurbCount, setRefurbCount] = useState(80);
  const [approvalStatus, setApprovalStatus] = useState('Pending');

  // Financial constants based on Gadgetbay challenge brief
  const unitNewPrice = 2500;
  const unitCost = 1400;
  const vendorCredit = unitNewPrice * 0.60; // 60% credit = 1500
  const refurbResale = unitNewPrice * 0.75 - 250; // 75% minus 250 cost = 1625
  const liquidateRecovery = unitCost * 0.35; // 35% of cost = 490

  // Dynamic calculations
  const liquidatorCount = totalBatch - (vendorCount + refurbCount);
  const totalNetRecovery = (vendorCount * vendorCredit) + (refurbCount * refurbResale) + (liquidatorCount * liquidateRecovery);

  const handleVendorChange = (val) => {
    const newVendor = Number(val);
    if (newVendor + refurbCount > totalBatch) {
      setRefurbCount(totalBatch - newVendor);
    }
    setVendorCount(newVendor);
  };

  const handleRefurbChange = (val) => {
    const newRefurb = Number(val);
    if (vendorCount + newRefurb > totalBatch) {
      setVendorCount(totalBatch - newRefurb);
    }
    setRefurbCount(newRefurb);
  };

  const handleApprove = () => {
    setApprovalStatus('Approved & Dispatched to ERP');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-teal-950 to-slate-900 p-6 text-slate-100 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-teal-800/40 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-teal-400 font-bold bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
            Agent Optimization Engine • Challenge 10
          </span>
          <h1 className="text-2xl font-black text-white mt-2">Batch #HB-09: Wireless Headphones Route Splitter</h1>
        </div>
        <div className="text-right bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <p className="text-xs text-slate-400">Projected Net Recovery</p>
          <p className="text-2xl font-black text-teal-400">₹{totalNetRecovery.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive Splitter & Calculations */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6 backdrop-blur-md">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-teal-400" /> Dynamic Route Splitter (Total: {totalBatch} Units)
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-teal-950 text-teal-300 border border-teal-800 rounded-full">
              Grade B Condition
            </span>
          </div>

          {/* Interactive Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300">Vendor RTV Route</span>
                <span className="text-sm font-black text-teal-400">{vendorCount} units</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">Window closing in 3 days • 60% credit (₹1,500/ea)</p>
              <input 
                type="range" 
                min="0" 
                max={totalBatch} 
                value={vendorCount} 
                onChange={(e) => handleVendorChange(e.target.value)}
                className="w-full accent-teal-400 bg-slate-800 cursor-pointer"
              />
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300">Refurbishment Route</span>
                <span className="text-sm font-black text-emerald-400">{refurbCount} units</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">Costs ₹250/ea • Takes 5 days • 75% resale value</p>
              <input 
                type="range" 
                min="0" 
                max={totalBatch} 
                value={refurbCount} 
                onChange={(e) => handleRefurbChange(e.target.value)}
                className="w-full accent-emerald-400 bg-slate-800 cursor-pointer"
              />
            </div>
          </div>

          {/* Route Comparison Matrix */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Route Option</th>
                  <th className="p-3">Time-to-Cash</th>
                  <th className="p-3">Allocated Units</th>
                  <th className="p-3">Unit Yield</th>
                  <th className="p-3 text-right">Route Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-3 font-semibold text-white">Vendor Return (RTV)</td>
                  <td className="p-3 text-teal-400 font-medium">3 Days</td>
                  <td className="p-3 text-teal-300 font-bold">{vendorCount} units</td>
                  <td className="p-3">₹{vendorCredit}</td>
                  <td className="p-3 text-right font-bold">₹{(vendorCount * vendorCredit).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Refurbish &amp; Resell</td>
                  <td className="p-3 text-amber-400 font-medium">5 Days</td>
                  <td className="p-3 text-emerald-300 font-bold">{refurbCount} units</td>
                  <td className="p-3">₹{refurbResale}</td>
                  <td className="p-3 text-right font-bold">₹{(refurbCount * refurbResale).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-400">Liquidator Sale</td>
                  <td className="p-3 text-slate-400">Instant</td>
                  <td className="p-3 text-slate-300 font-bold">{liquidatorCount} units</td>
                  <td className="p-3">₹{liquidateRecovery}</td>
                  <td className="p-3 text-right font-bold text-slate-300">₹{(liquidatorCount * liquidateRecovery).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Column: Quality Signal & Approval Action */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between backdrop-blur-md">
          <div className="flex flex-col gap-4">
            
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm bg-amber-950/60 p-3 rounded-xl border border-amber-800/60">
              <AlertTriangle size={18} className="shrink-0" />
              <span>Supplier Quality Alert</span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">70% of returns</strong> in batch <span className="text-teal-400 font-mono">HB-09</span> report the exact same audio driver defect. The agent has flagged supplier <span className="text-white underline">SoundTech Corp</span>.
            </p>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 mt-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Manager Approval Status</span>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${approvalStatus.includes('Approved') ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                  {approvalStatus}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: REC-809</span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-6">
            <button 
              onClick={handleApprove}
              disabled={approvalStatus.includes('Approved')}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} /> {approvalStatus.includes('Approved') ? 'Dispatched to ERP' : 'Approve Agent Split'}
            </button>
            <button 
              onClick={() => { setVendorCount(120); setRefurbCount(80); setApprovalStatus('Pending'); }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Reset Optimal Split
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}