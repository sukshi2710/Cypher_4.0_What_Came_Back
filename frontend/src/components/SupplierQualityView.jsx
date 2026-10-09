import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Search, Plus, Trash2 } from 'lucide-react';

const initialBatches = [
  { id: 'HB-09', supplier: 'SoundTech Corp', sku: 'Wireless Headphones', returns: 40, defectRate: '70%', mainReason: 'Defective audio driver', status: 'Critical Review' },
  { id: 'USC-42', supplier: 'ConnectPro Ltd', sku: 'USB-C Hub (4K)', returns: 18, defectRate: '42%', mainReason: 'Port connection failure', status: 'Warning' },
  { id: 'SWB-12', supplier: 'TimeWear Inc', sku: 'Smartwatch Band', returns: 5, defectRate: '12%', mainReason: 'Color mismatch', status: 'Normal' },
  { id: 'PWR-88', supplier: 'VoltMaster', sku: 'Fast Wall Charger', returns: 29, defectRate: '58%', mainReason: 'Overheating hazard', status: 'Critical Review' },
];

export default function SupplierQualityView() {
  const [batches, setBatches] = useState(() => {
    try {
      const saved = localStorage.getItem('gadgetbay_suppliers');
      return saved ? JSON.parse(saved) : initialBatches;
    } catch {
      return initialBatches;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({
    id: '',
    supplier: '',
    sku: '',
    returns: '',
    defectRate: '',
    mainReason: ''
  });

  useEffect(() => {
    localStorage.setItem('gadgetbay_suppliers', JSON.stringify(batches));
  }, [batches]);

  const handleTriggerAudit = (batchId) => {
    setBatches(batches.map((b) => (b.id === batchId ? { ...b, status: 'Audit Dispatched' } : b)));
  };

  const handleDelete = (batchId) => {
    setBatches(batches.filter((b) => b.id !== batchId));
  };

  const handleAddBatch = (e) => {
    e.preventDefault();
    if (!newBatch.id || !newBatch.supplier || !newBatch.returns || !newBatch.defectRate) return;

    const entry = {
      ...newBatch,
      returns: Number(newBatch.returns),
      defectRate: `${newBatch.defectRate}%`,
      status: Number(newBatch.defectRate) > 50 ? 'Critical Review' : 'Warning'
    };

    setBatches([entry, ...batches]);
    setNewBatch({ id: '', supplier: '', sku: '', returns: '', defectRate: '', mainReason: '' });
    setIsModalOpen(false);
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-teal-950 to-slate-900 p-6 text-slate-100 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-teal-800/40 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-teal-400 font-bold bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
            Supplier Quality Intelligence • Gadgetbay
          </span>
          <h1 className="text-2xl font-black text-white mt-2">Batch Defect & Supplier Risk Monitor</h1>
          <p className="text-slate-400 text-sm mt-1">Spotting return patterns that point to supplier quality issues and vendor liability.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <Plus size={16} /> Add Supplier Batch
          </button>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md flex flex-col gap-6">
        <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 flex-1 max-w-md text-slate-300 text-xs">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Batch ID, Supplier name, or SKU..."
              className="bg-transparent border-none outline-none w-full text-slate-200 placeholder-slate-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
            >
              <option value="All">All Risk Statuses</option>
              <option value="Critical Review">Critical Review</option>
              <option value="Warning">Warning</option>
              <option value="Normal">Normal</option>
              <option value="Audit Dispatched">Audit Dispatched</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Batch ID</th>
                <th className="p-3.5">Supplier Name</th>
                <th className="p-3.5">Product SKU</th>
                <th className="p-3.5">Returns Count</th>
                <th className="p-3.5">Defect Rate</th>
                <th className="p-3.5">Primary Reason</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-900/50 transition">
                    <td className="p-3.5 font-semibold text-white">{batch.id}</td>
                    <td className="p-3.5 font-medium">{batch.supplier}</td>
                    <td className="p-3.5 text-slate-300">{batch.sku}</td>
                    <td className="p-3.5 text-slate-200">{batch.returns}</td>
                    <td className="p-3.5 text-slate-200">{batch.defectRate}</td>
                    <td className="p-3.5 text-slate-300">{batch.mainReason}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          batch.status === 'Critical Review'
                            ? 'bg-rose-950 text-rose-400 border-rose-800/60'
                            : batch.status === 'Warning'
                              ? 'bg-amber-950 text-amber-400 border-amber-800/60'
                              : batch.status === 'Audit Dispatched'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleTriggerAudit(batch.id)}
                          className="text-teal-400 hover:text-teal-300 transition"
                          title="Trigger audit"
                        >
                          <ShieldAlert size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(batch.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                          title="Delete batch"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500 italic">
                    No matching supplier batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle size={18} /> Supplier Risk Intake
            </div>

            <form onSubmit={handleAddBatch} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Batch ID</label>
                <input
                  type="text"
                  required
                  value={newBatch.id}
                  onChange={(e) => setNewBatch({ ...newBatch, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Supplier</label>
                <input
                  type="text"
                  required
                  value={newBatch.supplier}
                  onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">SKU / Product</label>
                <input
                  type="text"
                  value={newBatch.sku}
                  onChange={(e) => setNewBatch({ ...newBatch, sku: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Returns</label>
                  <input
                    type="number"
                    required
                    value={newBatch.returns}
                    onChange={(e) => setNewBatch({ ...newBatch, returns: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Defect %</label>
                  <input
                    type="number"
                    required
                    value={newBatch.defectRate}
                    onChange={(e) => setNewBatch({ ...newBatch, defectRate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Primary Return Reason</label>
                <input
                  type="text"
                  value={newBatch.mainReason}
                  onChange={(e) => setNewBatch({ ...newBatch, mainReason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-teal-400 flex items-center gap-2">
                  <CheckCircle size={14} /> Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
