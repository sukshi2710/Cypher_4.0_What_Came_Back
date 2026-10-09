import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, Download, Plus, CheckCircle2, Clock, XCircle, Trash2 } from 'lucide-react';

const initialReturns = [
  { id: 'RMA-9021', item: 'Wireless Headset', reason: 'Arrived too late', status: 'Successful', offer: '15% Discount', amount: 2500.00, platform: 'Amazon' },
  { id: 'RMA-9022', item: 'USB-C Hub (Batch HB-09)', reason: 'Incorrect item received', status: 'In progress', offer: 'Exchange', amount: 1200.00, platform: 'Flipkart' },
  { id: 'RMA-9023', item: 'Smartwatch Band', reason: 'Defective audio / hardware', status: 'Closed', offer: 'Store Credit', amount: 899.00, platform: 'Shopify' },
];

export default function DashboardReturns() {
  // 1. Dynamic State for data, search query, filter dropdowns, and modal visibility
  const [returnsList, setReturnsList] = useState(() => {
    const saved = localStorage.getItem('gadgetbay_returns');
    return saved ? JSON.parse(saved) : initialReturns;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState('All');
  const [activeTab, setActiveTab] = useState('Summary');
  
  // Modal state for adding a new dynamic return
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ item: '', reason: 'Defective', amount: '', platform: 'Amazon', offer: 'Refund' });

  // Save changes to localStorage so data persists across refreshes
  useEffect(() => {
    localStorage.setItem('gadgetbay_returns', JSON.stringify(returnsList));
  }, [returnsList]);

  // Handle adding a new return dynamically
  const handleAddReturn = (e) => {
    e.preventDefault();
    if (!newItem.item || !newItem.amount) return;

    const newEntry = {
      id: `RMA-${Math.floor(1000 + Math.random() * 9000)}`,
      item: newItem.item,
      reason: newItem.reason,
      status: 'In progress',
      offer: newItem.offer,
      amount: parseFloat(newItem.amount),
      platform: newItem.platform
    };

    setReturnsList([newEntry, ...returnsList]);
    setNewItem({ item: '', reason: 'Defective', amount: '', platform: 'Amazon', offer: 'Refund' });
    setIsModalOpen(false);
  };

  // Handle deleting a return item dynamically
  const handleDelete = (id) => {
    setReturnsList(returnsList.filter(item => item.id !== id));
  };

  // Filter logic based on search query and reason dropdown
  const filteredReturns = returnsList.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesReason = selectedReason === 'All' || item.reason.includes(selectedReason);
    return matchesSearch && matchesReason;
  });

  // Dynamic calculations for summary cards
  const totalRetainable = returnsList.length;
  const successfulRetentions = returnsList.filter(i => i.status === 'Successful').length;
  const totalAmount = returnsList.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-teal-950 to-slate-900 p-6 text-slate-100 flex flex-col gap-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-teal-800/40 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-teal-400 font-bold bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800">
            Gadgetbay Operations Hub
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white mt-2">Returns Analytics & ROI</h1>
          <p className="text-slate-400 text-sm mt-1">Turn return data into better decisions and maximize recovery value.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <Plus size={16} /> Simulate New Return
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-md flex flex-col gap-6">
        
        {/* Tabs Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {['Today', 'This week', 'This month', 'Summary', 'Custom'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition ${activeTab === tab ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={() => alert("Exporting dynamic dataset as CSV...")} className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 transition">
            <Download size={14} /> Export
          </button>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-slate-950/40 p-5 rounded-xl border border-slate-800/60 text-center">
          <div className="border-r border-slate-800 last:border-none pr-2">
            <p className="text-xs text-slate-400 font-medium">Retainable orders</p>
            <p className="text-2xl font-extrabold text-white mt-1">{totalRetainable}</p>
          </div>
          <div className="border-r border-slate-800 last:border-none pr-2">
            <p className="text-xs text-slate-400 font-medium">Successful retentions</p>
            <p className="text-2xl font-extrabold text-teal-400 mt-1">{successfulRetentions}</p>
          </div>
          <div className="border-r border-slate-800 last:border-none pr-2">
            <p className="text-xs text-slate-400 font-medium">Total return amount</p>
            <p className="text-2xl font-extrabold text-white mt-1">₹{totalAmount.toLocaleString()}</p>
          </div>
          <div className="border-r border-slate-800 last:border-none pr-2">
            <p className="text-xs text-slate-400 font-medium">Retention spend</p>
            <p className="text-2xl font-extrabold text-white mt-1">₹326.50</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Retention ROI</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">18.3</p>
          </div>
        </div>

        {/* Dynamic Search & Reason Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 flex-1 max-w-md text-slate-300">
            <Search size={15} className="text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RMA, item name, or reason dynamically..." 
              className="bg-transparent border-none outline-none w-full text-slate-200 placeholder-slate-500 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedReason} 
              onChange={(e) => setSelectedReason(e.target.value)}
              className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
            >
              <option value="All">All Return Reasons</option>
              <option value="Arrived">Arrived too late</option>
              <option value="Incorrect">Incorrect item</option>
              <option value="Defective">Defective</option>
            </select>
          </div>
        </div>

        {/* Dynamic Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">RMA ID</th>
                <th className="p-3.5">Return reason</th>
                <th className="p-3.5">Retention status</th>
                <th className="p-3.5">Retention offer</th>
                <th className="p-3.5">Platform</th>
                <th className="p-3.5 text-right">Refund Amount</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReturns.length > 0 ? (
                filteredReturns.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/50 transition">
                    <td className="p-3.5 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-teal-400 font-bold border border-slate-700">📦</div>
                      {row.item}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">{row.id}</td>
                    <td className="p-3.5 text-slate-200">{row.reason}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full font-medium ${
                        row.status === 'Successful' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                        row.status === 'In progress' ? 'bg-sky-950 text-sky-400 border border-sky-800/60' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{row.offer}</td>
                    <td className="p-3.5 text-teal-300 font-semibold">{row.platform}</td>
                    <td className="p-3.5 text-right font-semibold text-slate-200">₹{row.amount.toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleDelete(row.id)} className="text-slate-500 hover:text-rose-400 transition" title="Delete record">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500 italic">No matching return records found. Try clearing your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal for Simulating New Return */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">Simulate Incoming Return</h3>
            <form onSubmit={handleAddReturn} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Item Name / SKU</label>
                <input 
                  type="text" 
                  required
                  value={newItem.item}
                  onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                  placeholder="e.g., Wireless Earbuds HB-10" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Return Reason</label>
                <input 
                  type="text" 
                  required
                  value={newItem.reason}
                  onChange={(e) => setNewItem({...newItem, reason: e.target.value})}
                  placeholder="e.g., Defective audio driver" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Refund Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={newItem.amount}
                    onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                    placeholder="1500" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Platform</label>
                  <select 
                    value={newItem.platform}
                    onChange={(e) => setNewItem({...newItem, platform: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Shopify">Shopify</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-teal-400">Add Return</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}