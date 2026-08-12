import { useState } from 'react';
import toast from 'react-hot-toast';
import { Crown, CheckCircle2, Users, Edit3, Save, X } from 'lucide-react';

interface SaaSPlan {
  id: number;
  name: string;
  price: number;
  billing_cycle: string;
  max_students: number;
  features: string[];
  active_subscribers: number;
}

export default function SaaSPlansManagementPage() {
  const [plans, setPlans] = useState<SaaSPlan[]>([
    { id: 1, name: 'Basic ERP Tier', price: 2999, billing_cycle: 'monthly', max_students: 500, features: ['Student & Teacher Attendance', 'Basic Fee Receipts', 'Report Cards', 'Notice Board'], active_subscribers: 2 },
    { id: 2, name: 'Pro Enterprise Tier', price: 6999, billing_cycle: 'monthly', max_students: 2500, features: ['All Basic Features', 'Transport & Fleet Tracking', 'Hostel & Mess Outpass', 'Digital Library Barcode', 'Staff Payroll HRMS'], active_subscribers: 3 },
    { id: 3, name: 'Multi-Branch SaaS Tier', price: 14999, billing_cycle: 'monthly', max_students: 10000, features: ['All Pro Features', 'Dedicated Isolated MySQL DB', 'Custom Domain Branding', 'Priority 24/7 SLA Support', 'Unlimited Storage & S3 CDN'], active_subscribers: 1 },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCapacity, setEditCapacity] = useState<number>(0);

  const handleStartEdit = (p: SaaSPlan) => {
    setEditingId(p.id);
    setEditPrice(p.price);
    setEditCapacity(p.max_students);
  };

  const handleSaveEdit = (id: number) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, price: editPrice, max_students: editCapacity } : p));
    setEditingId(null);
    toast.success('SaaS Plan pricing & capacity updated!');
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-400/30">
              <Crown className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-white">SaaS Subscription Plans & Pricing</h1>
          </div>
          <p className="text-xs text-slate-400">Manage master SaaS pricing tiers, student capacity limits, and active subscriber analytics.</p>
        </div>
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(p => {
          const isEditing = editingId === p.id;
          return (
            <div key={p.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold rounded-full text-[10px] uppercase">
                    {p.billing_cycle}
                  </span>
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> {p.active_subscribers} Active Subscribers
                  </span>
                </div>

                <h3 className="text-lg font-black text-white">{p.name}</h3>

                {isEditing ? (
                  <div className="my-3 space-y-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Monthly Price (₹)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Max Student Capacity</label>
                      <input
                        type="number"
                        value={editCapacity}
                        onChange={e => setEditCapacity(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white text-sm font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="my-3">
                    <div className="text-3xl font-black text-amber-400">
                      ₹{p.price.toLocaleString()}
                      <span className="text-xs text-slate-400 font-normal"> / month</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Capacity Limit: <strong className="text-white font-bold">{p.max_students.toLocaleString()} Students</strong></p>
                  </div>
                )}

                <ul className="mt-5 space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(p.id)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEdit(p)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Edit Plan Pricing
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
