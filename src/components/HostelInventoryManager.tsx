import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  LayoutDashboard, Package, ClipboardList, Wrench, ShoppingCart,
  Plus, Search, Filter, AlertTriangle, Check, X, ChevronRight,
  TrendingUp, Users, Activity, BarChart2, Archive, Tag,
  RefreshCw, Star, Edit2, Trash2, ArrowRight, ArrowLeft,
  Calendar, DollarSign, Building2, Zap, Sofa, Wind,
  UtensilsCrossed, Dumbbell, CheckCircle2, Clock, Info
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'assets' | 'issues' | 'maintenance' | 'procurement';
type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Disposed';
type IssueStatus = 'Issued' | 'Returned' | 'Overdue' | 'Lost';
type MaintStatus = 'Reported' | 'In Progress' | 'Completed' | 'Cancelled';
type ProcStatus = 'Pending' | 'Approved' | 'Rejected' | 'Ordered' | 'Received';
type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

interface Asset {
  id: number;
  asset_code: string;
  name: string;
  category: string;
  category_id: number;
  block_location: string;
  quantity_total: number;
  quantity_available: number;
  quantity_issued: number;
  quantity_maintenance: number;
  condition: AssetCondition;
  purchase_price: number;
  vendor_name: string;
  purchase_date: string;
  warranty_expiry: string;
  low_stock_threshold: number;
  is_low_stock: boolean;
  notes?: string;
}

interface Issue {
  id: number;
  asset_code: string;
  asset_name: string;
  category: string;
  issued_to_name: string;
  room_number: string;
  block_floor: string;
  quantity: number;
  issued_at: string;
  expected_return_date?: string;
  returned_at?: string;
  status: IssueStatus;
  condition_on_issue: string;
  condition_on_return?: string;
  issue_notes?: string;
  return_notes?: string;
}

interface MaintenanceLog {
  id: number;
  asset_code: string;
  asset_name: string;
  category: string;
  issue_type: string;
  description: string;
  estimated_cost?: number;
  actual_cost?: number;
  vendor_name?: string;
  technician_name?: string;
  priority: Priority;
  status: MaintStatus;
  reported_at: string;
  completed_at?: string;
  resolution_notes?: string;
}

interface Procurement {
  id: number;
  request_number: string;
  item_name: string;
  category: string;
  quantity_requested: number;
  estimated_unit_price?: number;
  estimated_total?: number;
  vendor_name?: string;
  priority: Priority;
  status: ProcStatus;
  reason?: string;
  requested_by?: string;
  approved_by?: string;
  requested_at: string;
  approved_at?: string;
  expected_delivery?: string;
  received_at?: string;
}

interface DashStats {
  total_assets: number;
  available: number;
  issued: number;
  maintenance: number;
  total_records: number;
  total_value: string;
  pending_maint: number;
  pending_proc: number;
}

// ─── CONFIGS ─────────────────────────────────────────────────────────────────

const conditionConfig: Record<AssetCondition, { color: string; bg: string; border: string; dot: string }> = {
  Excellent: { color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Good:      { color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    dot: 'bg-blue-500'    },
  Fair:      { color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   dot: 'bg-amber-500'   },
  Poor:      { color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200',    dot: 'bg-rose-500'    },
  Disposed:  { color: 'text-slate-500',   bg: 'bg-slate-100',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
};

const issueStatusConfig: Record<IssueStatus, { color: string; bg: string; border: string; dot: string }> = {
  Issued:   { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  Returned: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Overdue:  { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500 animate-pulse' },
  Lost:     { color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',   dot: 'bg-slate-400' },
};

const maintStatusConfig: Record<MaintStatus, { color: string; bg: string; border: string }> = {
  Reported:    { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  'In Progress':{ color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  Completed:   { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Cancelled:   { color: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200' },
};

const procStatusConfig: Record<ProcStatus, { color: string; bg: string; border: string }> = {
  Pending:  { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  Approved: { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  Rejected: { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  Ordered:  { color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  Received: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const priorityConfig: Record<Priority, { color: string; bg: string; border: string }> = {
  Low:    { color: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-200' },
  Medium: { color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  High:   { color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200' },
  Urgent: { color: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200' },
};

const categoryIconMap: Record<string, React.ElementType> = {
  Furniture: Sofa, Electronics: Zap, Appliances: Wind,
  Kitchen: UtensilsCrossed, Sports: Dumbbell, Fixtures: Wrench,
};

// ─── BADGE COMPONENTS ─────────────────────────────────────────────────────────

const CondBadge: React.FC<{ cond: AssetCondition }> = ({ cond }) => {
  const c = conditionConfig[cond] ?? conditionConfig.Good;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1 h-1 rounded-full ${c.dot}`} /> {cond}
    </span>
  );
};

const IssueBadge: React.FC<{ status: IssueStatus }> = ({ status }) => {
  const c = issueStatusConfig[status] ?? issueStatusConfig.Issued;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1 h-1 rounded-full ${c.dot}`} /> {status}
    </span>
  );
};

const MaintBadge: React.FC<{ status: MaintStatus }> = ({ status }) => {
  const c = maintStatusConfig[status] ?? maintStatusConfig.Reported;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      {status}
    </span>
  );
};

const ProcBadge: React.FC<{ status: ProcStatus }> = ({ status }) => {
  const c = procStatusConfig[status] ?? procStatusConfig.Pending;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      {status}
    </span>
  );
};

const PriBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const c = priorityConfig[priority] ?? priorityConfig.Medium;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${c.color} ${c.bg} ${c.border}`}>
      {priority}
    </span>
  );
};

// ─── DASHBOARD TAB ───────────────────────────────────────────────────────────

interface DashboardTabProps {
  stats: DashStats;
  lowStock: any[];
  categoryBreakdown: any[];
  conditionSummary: Record<string, number>;
  recentActivity: any[];
  loading: boolean;
  onTabChange: (t: TabId) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ stats, lowStock, categoryBreakdown, conditionSummary, recentActivity, loading, onTabChange }) => {
  const maxCatQty = Math.max(...categoryBreakdown.map(c => c.qty), 1);
  return (
    <div className="space-y-2">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {[
          { label: 'Total Assets', value: stats.total_assets, sub: `${stats.total_records} item types`, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'Available',    value: stats.available,    sub: 'Ready to issue',                    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Issued',       value: stats.issued,       sub: 'Currently out',                    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
          { label: 'Maintenance',  value: stats.maintenance,  sub: 'Being repaired',                   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2 flex flex-col justify-center`}>
            <span className={`text-lg font-black ${s.color} leading-none`}>{s.value}</span>
            <span className={`text-[8px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-none`}>{s.label}</span>
            <span className="text-[8px] text-slate-500 font-semibold leading-none mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" /> Low stock alerts
          </h3>
          {lowStock.length === 0 ? (
            <div className="text-center py-4 text-[9px] text-slate-400 font-semibold flex flex-col items-center gap-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              All stock levels are healthy ✓
            </div>
          ) : (
            <div className="space-y-1.5">
              {lowStock.map(a => (
                <div key={a.id} className="flex justify-between items-center p-1.5 bg-rose-50/50 border border-rose-100 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{a.name}</p>
                    <p className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">{a.category} · {a.code}</p>
                  </div>
                  <span className="text-[9px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {a.available} / {a.threshold} min
                  </span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => onTabChange('assets')} className="w-full mt-2 py-1 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-lg text-[9px] transition">
            View all assets →
          </button>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <BarChart2 className="w-2.5 h-2.5" /> By category
          </h3>
          <div className="space-y-1.5">
            {categoryBreakdown.filter(c => c.count > 0).map(c => {
              const Icon = categoryIconMap[c.name] || Package;
              const pct = (c.qty / maxCatQty) * 100;
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-[9px] font-semibold text-slate-600 w-20 truncate">{c.name}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 w-6 text-right">{c.qty}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Condition Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" /> Asset condition
          </h3>
          <div className="space-y-1">
            {(['Excellent', 'Good', 'Fair', 'Poor'] as AssetCondition[]).map(cond => {
              const count = conditionSummary[cond] ?? 0;
              const total = Object.values(conditionSummary).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              const c = conditionConfig[cond];
              return (
                <div key={cond} className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold w-16 ${c.color}`}>{cond}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.dot}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 w-8 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick actions</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Issue Asset',    tab: 'issues'       as TabId, icon: ArrowRight,    color: 'bg-indigo-600 text-white border-indigo-600' },
              { label: 'Log Maint.',     tab: 'maintenance'  as TabId, icon: Wrench,         color: 'bg-amber-500 text-white border-amber-500' },
              { label: 'Add Asset',      tab: 'assets'       as TabId, icon: Plus,           color: 'bg-emerald-600 text-white border-emerald-600' },
              { label: 'Procure',        tab: 'procurement'  as TabId, icon: ShoppingCart,   color: 'bg-slate-700 text-white border-slate-700' },
            ].map(a => {
              const Icon = a.icon;
              return (
                <button key={a.label} onClick={() => onTabChange(a.tab)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl border font-bold text-[9px] cursor-pointer transition hover:opacity-90 ${a.color}`}>
                  <Icon className="w-3 h-3" /> {a.label}
                </button>
              );
            })}
          </div>

          {/* Summary badges */}
          <div className="flex gap-1.5 mt-2">
            <div className="flex-1 text-center p-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-black text-amber-700">{stats.pending_maint}</p>
              <p className="text-[8px] font-bold text-amber-600 uppercase">Maint. pending</p>
            </div>
            <div className="flex-1 text-center p-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm font-black text-indigo-700">{stats.pending_proc}</p>
              <p className="text-[8px] font-bold text-indigo-600 uppercase">Proc. pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Activity className="w-3 h-3" /> Recent issue / return activity
        </h3>
        {recentActivity.length === 0 ? (
          <div className="text-center py-3 text-[9px] text-slate-400 font-semibold">No activity yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivity.map(r => (
              <div key={r.id} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0 gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{r.asset_name}</p>
                  <p className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">
                    {r.action} → {r.person} · Rm {r.room} · {r.date}
                  </p>
                </div>
                <IssueBadge status={r.status as IssueStatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ASSET REGISTER TAB ──────────────────────────────────────────────────────

interface AssetRegisterProps {
  assets: Asset[];
  categories: any[];
  loading: boolean;
  onRefresh: () => void;
}

const AssetRegister: React.FC<AssetRegisterProps> = ({ assets, categories, loading, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterCond, setFilterCond] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '', category_id: '', block_location: '', quantity_total: '1',
    condition: 'Good', purchase_price: '', vendor_name: '',
    purchase_date: '', warranty_expiry: '', low_stock_threshold: '2', description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.asset_code.toLowerCase().includes(search.toLowerCase());
    const matchCat  = filterCat === 'all' || String(a.category_id) === filterCat;
    const matchCond = filterCond === 'all' || a.condition === filterCond;
    return matchSearch && matchCat && matchCond;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Asset name required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/inventory/assets', {
        ...form,
        quantity_total: Number(form.quantity_total),
        low_stock_threshold: Number(form.low_stock_threshold),
        purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
        category_id: form.category_id || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddForm(false);
        setForm({ name: '', category_id: '', block_location: '', quantity_total: '1', condition: 'Good', purchase_price: '', vendor_name: '', purchase_date: '', warranty_expiry: '', low_stock_threshold: '2', description: '' });
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    try {
      const res = await api.delete(`/school/hostel/inventory/assets/${id}`);
      if (res.data.success) { toast.success('Asset removed.'); onRefresh(); }
    } catch { toast.error('Failed to remove.'); }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-32">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All categories</option>
          {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        <select value={filterCond} onChange={e => setFilterCond(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All conditions</option>
          {['Excellent', 'Good', 'Fair', 'Poor', 'Disposed'].map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <Plus className="w-3 h-3" /> Add Asset
        </button>
      </div>

      {/* Add Asset Form */}
      {showAddForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <Plus className="w-3 h-3 text-indigo-500" /> Add new asset
          </h3>
          <form onSubmit={handleAdd} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Asset name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Single Bed with Mattress"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Block / Location</label>
                <input value={form.block_location} onChange={e => setForm(f => ({ ...f, block_location: e.target.value }))}
                  placeholder="Block A, Common Hall..."
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Total Qty *</label>
                <input type="number" min="1" value={form.quantity_total} onChange={e => setForm(f => ({ ...f, quantity_total: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Condition</label>
                <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500">
                  {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Purchase Price (₹)</label>
                <input type="number" min="0" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Vendor</label>
                <input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
                  placeholder="Vendor name"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Low Stock Alert (qty)</label>
                <input type="number" min="0" value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl border-0 transition disabled:opacity-60">
                <ArrowRight className="w-3 h-3" /> {submitting ? 'Adding...' : 'Add Asset'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assets Table */}
      {loading ? (
        <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">Loading assets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">No assets found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(a => (
            <div key={a.id} className={`bg-white border rounded-xl p-2.5 shadow-xs ${a.is_low_stock ? 'border-rose-200' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-bold text-slate-400 tracking-wider">{a.asset_code}</span>
                    <span className="text-[8px] text-slate-400">·</span>
                    <span className="text-[8px] font-semibold text-slate-500">{a.category}</span>
                    {a.is_low_stock && (
                      <span className="text-[8px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                        <AlertTriangle className="w-2 h-2" /> Low stock
                      </span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-900 mt-0.5 leading-tight">{a.name}</h4>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">{a.block_location} · Vendor: {a.vendor_name || '—'}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <CondBadge cond={a.condition} />
                  <button onClick={() => handleDelete(a.id, a.name)}
                    className="p-0.5 hover:bg-rose-50 rounded transition cursor-pointer border-0 bg-transparent">
                    <Trash2 className="w-3 h-3 text-slate-300 hover:text-rose-500" />
                  </button>
                </div>
              </div>
              {/* Qty breakdown */}
              <div className="grid grid-cols-4 gap-1.5 mt-1.5 pt-1.5 border-t border-slate-100">
                {[
                  { label: 'Total',    value: a.quantity_total,       color: 'text-slate-700' },
                  { label: 'Avail.',   value: a.quantity_available,   color: 'text-emerald-700' },
                  { label: 'Issued',   value: a.quantity_issued,      color: 'text-blue-700' },
                  { label: 'Maint.',   value: a.quantity_maintenance, color: 'text-amber-700' },
                ].map(q => (
                  <div key={q.label} className="text-center">
                    <p className={`text-[11px] font-black ${q.color} leading-none`}>{q.value}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{q.label}</p>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              {a.quantity_total > 0 && (
                <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(a.quantity_available / a.quantity_total) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ISSUE / RETURN TAB ───────────────────────────────────────────────────────

interface IssueReturnProps {
  issues: Issue[];
  assets: Asset[];
  loading: boolean;
  onRefresh: () => void;
}

const IssueReturn: React.FC<IssueReturnProps> = ({ issues, assets, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [form, setForm] = useState({
    asset_id: '', issued_to_name: '', room_number: '',
    block_floor: '', quantity: '1', condition_on_issue: 'Good',
    expected_return_date: '', issue_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedAsset = assets.find(a => String(a.id) === form.asset_id);

  const filtered = issues.filter(i => {
    const matchSearch = i.issued_to_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.room_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset_id) { toast.error('Select an asset'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/inventory/issues', {
        ...form,
        asset_id: Number(form.asset_id),
        quantity: Number(form.quantity),
        expected_return_date: form.expected_return_date || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowIssueForm(false);
        setForm({ asset_id: '', issued_to_name: '', room_number: '', block_floor: '', quantity: '1', condition_on_issue: 'Good', expected_return_date: '', issue_notes: '' });
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (issueId: number, assetName: string) => {
    const condition = prompt(`Condition of "${assetName}" on return?\n(Excellent / Good / Fair / Poor / Damaged)`) as any;
    if (!condition) return;
    const notes = prompt('Return notes (optional):') || '';
    try {
      const res = await api.post(`/school/hostel/inventory/issues/${issueId}/return`, {
        condition_on_return: condition,
        return_notes: notes,
      });
      if (res.data.success) { toast.success('Asset returned!'); onRefresh(); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to process return.'); }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-32">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by person, room, asset..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All status</option>
          {['Issued', 'Returned', 'Overdue', 'Lost'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowIssueForm(!showIssueForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <ArrowRight className="w-3 h-3" /> Issue Asset
        </button>
      </div>

      {/* Issue Form */}
      {showIssueForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <ArrowRight className="w-3 h-3 text-indigo-500" /> Issue asset to student / room
          </h3>
          <form onSubmit={handleIssue} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Select Asset *</label>
                <select value={form.asset_id} onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" required>
                  <option value="">Choose asset...</option>
                  {assets.filter(a => a.quantity_available > 0).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.asset_code}) — {a.quantity_available} avail.</option>
                  ))}
                </select>
                {selectedAsset && (
                  <p className="text-[8px] text-emerald-700 font-semibold mt-0.5">{selectedAsset.quantity_available} unit(s) available</p>
                )}
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Issued To *</label>
                <input value={form.issued_to_name} onChange={e => setForm(f => ({ ...f, issued_to_name: e.target.value }))}
                  placeholder="Student name" required
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Room No. *</label>
                <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                  placeholder="e.g. 204" required
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Condition</label>
                <select value={form.condition_on_issue} onChange={e => setForm(f => ({ ...f, condition_on_issue: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500">
                  {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Expected Return</label>
                <input type="date" value={form.expected_return_date} onChange={e => setForm(f => ({ ...f, expected_return_date: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl border-0 transition disabled:opacity-60">
                <ArrowRight className="w-3 h-3" /> {submitting ? 'Issuing...' : 'Issue Asset'}
              </button>
              <button type="button" onClick={() => setShowIssueForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Issues List */}
      {loading ? (
        <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">No issue records found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(i => (
            <div key={i.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="text-[8px] font-bold text-slate-400 tracking-wider block">{i.asset_code} · {i.category}</span>
                  <h4 className="text-[11px] font-bold text-slate-900 mt-0.5 leading-tight">{i.asset_name}</h4>
                </div>
                <IssueBadge status={i.status} />
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1.5 text-[9px] text-slate-500 font-semibold border-t border-slate-100 pt-1.5">
                <div>Issued to: <span className="text-slate-800 font-bold">{i.issued_to_name}</span></div>
                <div>Room: <span className="text-slate-800 font-bold">{i.room_number}</span></div>
                <div>Issued: <span className="text-slate-800 font-bold">{i.issued_at}</span></div>
                <div>Return by: <span className="text-slate-800 font-bold">{i.expected_return_date || '—'}</span></div>
                <div>Qty: <span className="text-slate-800 font-bold">{i.quantity}</span></div>
                <div>Cond. issued: <span className="text-slate-800 font-bold">{i.condition_on_issue}</span></div>
              </div>
              {i.status === 'Issued' && (
                <button onClick={() => handleReturn(i.id, i.asset_name)}
                  className="w-full mt-1.5 py-1 flex items-center justify-center gap-1 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-lg cursor-pointer transition">
                  <ArrowLeft className="w-3 h-3" /> Mark Return
                </button>
              )}
              {i.status === 'Returned' && i.condition_on_return && (
                <p className="mt-1 text-[8px] text-slate-400 font-semibold">
                  Returned: {i.returned_at} · Condition: {i.condition_on_return}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAINTENANCE TAB ─────────────────────────────────────────────────────────

interface MaintenanceTabProps {
  logs: MaintenanceLog[];
  assets: Asset[];
  totalCost: string;
  loading: boolean;
  onRefresh: () => void;
}

const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ logs, assets, totalCost, loading, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    asset_id: '', issue_type: 'Repair', description: '',
    priority: 'Medium' as Priority, estimated_cost: '', vendor_name: '', technician_name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = logs.filter(l => filterStatus === 'all' || l.status === filterStatus);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset_id || !form.description.trim()) { toast.error('Asset and description required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/inventory/maintenance', {
        ...form,
        asset_id: Number(form.asset_id),
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        setForm({ asset_id: '', issue_type: 'Repair', description: '', priority: 'Medium', estimated_cost: '', vendor_name: '', technician_name: '' });
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: MaintStatus) => {
    const cost = status === 'Completed' ? prompt('Actual cost (₹)?') : null;
    const tech = status === 'Completed' ? prompt('Technician name?') : null;
    try {
      const res = await api.post(`/school/hostel/inventory/maintenance/${id}/status`, {
        status,
        actual_cost: cost ? Number(cost) : undefined,
        technician_name: tech || undefined,
      });
      if (res.data.success) { toast.success(res.data.message); onRefresh(); }
    } catch { toast.error('Failed to update.'); }
  };

  return (
    <div className="space-y-2">
      {/* Summary + Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="flex-1 flex items-center gap-2">
          <div className="text-[9px] font-bold text-slate-500">
            Total repair cost: <span className="text-emerald-700 font-black">₹{totalCost}</span>
          </div>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All status</option>
          {['Reported', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-amber-600 transition">
          <Plus className="w-3 h-3" /> Log Maintenance
        </button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <Wrench className="w-3 h-3 text-amber-500" /> Log maintenance request
          </h3>
          <form onSubmit={handleLog} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Asset *</label>
                <select value={form.asset_id} onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-amber-500" required>
                  <option value="">Choose asset...</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.asset_code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Issue Type</label>
                <select value={form.issue_type} onChange={e => setForm(f => ({ ...f, issue_type: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-amber-500">
                  {['Repair', 'Servicing', 'Replacement', 'Inspection'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-amber-500">
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Description *</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-amber-500 resize-none h-10" required />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Est. Cost (₹)</label>
                <input type="number" min="0" value={form.estimated_cost} onChange={e => setForm(f => ({ ...f, estimated_cost: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Vendor</label>
                <input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
                  placeholder="Repair vendor name"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-xl border-0 transition disabled:opacity-60">
                <ArrowRight className="w-3 h-3" /> {submitting ? 'Logging...' : 'Log Maintenance'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Logs */}
      {loading ? (
        <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">No maintenance records found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="text-[8px] font-bold text-slate-400 tracking-wider block">{m.asset_code} · {m.issue_type}</span>
                  <h4 className="text-[11px] font-bold text-slate-900 mt-0.5 leading-tight">{m.asset_name}</h4>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5 truncate">{m.description}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <MaintBadge status={m.status} />
                  <PriBadge priority={m.priority} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1.5 text-[9px] text-slate-500 font-semibold border-t border-slate-100 pt-1.5">
                <div>Reported: <span className="text-slate-800 font-bold">{m.reported_at}</span></div>
                <div>Vendor: <span className="text-slate-800 font-bold">{m.vendor_name || '—'}</span></div>
                <div>Est. cost: <span className="text-slate-800 font-bold">{m.estimated_cost ? `₹${m.estimated_cost}` : '—'}</span></div>
                <div>Actual: <span className="text-slate-800 font-bold">{m.actual_cost ? `₹${m.actual_cost}` : '—'}</span></div>
              </div>
              {(m.status === 'Reported' || m.status === 'In Progress') && (
                <div className="flex gap-1.5 mt-1.5">
                  {m.status === 'Reported' && (
                    <button onClick={() => handleStatusUpdate(m.id, 'In Progress')}
                      className="flex-1 py-1 text-center border border-amber-200 hover:bg-amber-50 text-amber-700 font-bold text-[9px] rounded-lg cursor-pointer transition">
                      Start Work
                    </button>
                  )}
                  <button onClick={() => handleStatusUpdate(m.id, 'Completed')}
                    className="flex-1 py-1 text-center border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-lg cursor-pointer transition">
                    Mark Complete
                  </button>
                  <button onClick={() => handleStatusUpdate(m.id, 'Cancelled')}
                    className="py-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-[9px] rounded-lg cursor-pointer transition">
                    Cancel
                  </button>
                </div>
              )}
              {m.status === 'Completed' && m.completed_at && (
                <p className="mt-1 text-[8px] text-slate-400 font-semibold">Completed: {m.completed_at} · Tech: {m.technician_name || '—'}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PROCUREMENT TAB ─────────────────────────────────────────────────────────

interface ProcurementTabProps {
  procurements: Procurement[];
  categories: any[];
  loading: boolean;
  onRefresh: () => void;
}

const ProcurementTab: React.FC<ProcurementTabProps> = ({ procurements, categories, loading, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    item_name: '', category_id: '', description: '', quantity_requested: '1',
    estimated_unit_price: '', vendor_name: '', priority: 'Medium' as Priority,
    reason: '', requested_by: '', expected_delivery: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = procurements.filter(p => filterStatus === 'all' || p.status === filterStatus);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_name.trim()) { toast.error('Item name required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/inventory/procurement', {
        ...form,
        quantity_requested: Number(form.quantity_requested),
        estimated_unit_price: form.estimated_unit_price ? Number(form.estimated_unit_price) : undefined,
        category_id: form.category_id || undefined,
        expected_delivery: form.expected_delivery || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        setForm({ item_name: '', category_id: '', description: '', quantity_requested: '1', estimated_unit_price: '', vendor_name: '', priority: 'Medium', reason: '', requested_by: '', expected_delivery: '' });
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to raise request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: ProcStatus) => {
    const approver = ['Approved', 'Ordered'].includes(status) ? prompt('Approved by?') : null;
    const notes = prompt('Admin notes (optional):') || '';
    try {
      const res = await api.post(`/school/hostel/inventory/procurement/${id}/status`, {
        status,
        approved_by: approver || undefined,
        admin_notes: notes || undefined,
      });
      if (res.data.success) { toast.success(res.data.message); onRefresh(); }
    } catch { toast.error('Failed to update.'); }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="flex-1 text-[9px] font-bold text-slate-500">
          {procurements.filter(p => p.status === 'Pending').length} pending approvals
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All status</option>
          {['Pending', 'Approved', 'Rejected', 'Ordered', 'Received'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-slate-800 transition">
          <Plus className="w-3 h-3" /> New Request
        </button>
      </div>

      {/* Procurement Form */}
      {showForm && (
        <div className="bg-white border border-slate-300 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <ShoppingCart className="w-3 h-3 text-slate-600" /> Raise procurement request
          </h3>
          <form onSubmit={handleCreate} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Item Name *</label>
                <input value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
                  placeholder="e.g. Ceiling Fan (48 inch)" required
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-slate-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-slate-500">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Quantity *</label>
                <input type="number" min="1" value={form.quantity_requested} onChange={e => setForm(f => ({ ...f, quantity_requested: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-slate-500" required />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Unit Price (₹)</label>
                <input type="number" min="0" value={form.estimated_unit_price} onChange={e => setForm(f => ({ ...f, estimated_unit_price: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-slate-500" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-slate-500">
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Requested By</label>
                <input value={form.requested_by} onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))}
                  placeholder="Your name / designation"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-slate-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Reason</label>
                <textarea rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Why is this purchase needed?"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-slate-500 resize-none h-10" />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl border-0 transition disabled:opacity-60">
                <ArrowRight className="w-3 h-3" /> {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Procurement List */}
      {loading ? (
        <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">No procurement requests found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="text-[8px] font-bold text-slate-400 tracking-wider block">{p.request_number} · {p.category}</span>
                  <h4 className="text-[11px] font-bold text-slate-900 mt-0.5 leading-tight">{p.item_name}</h4>
                  {p.reason && <p className="text-[8px] text-slate-400 font-semibold mt-0.5 truncate">{p.reason}</p>}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <ProcBadge status={p.status} />
                  <PriBadge priority={p.priority} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1.5 text-[9px] text-slate-500 font-semibold border-t border-slate-100 pt-1.5">
                <div>Qty: <span className="text-slate-800 font-bold">{p.quantity_requested}</span></div>
                <div>Est. total: <span className="text-slate-800 font-bold">{p.estimated_total ? `₹${p.estimated_total}` : '—'}</span></div>
                <div>Requested by: <span className="text-slate-800 font-bold">{p.requested_by || '—'}</span></div>
                <div>Approved by: <span className="text-slate-800 font-bold">{p.approved_by || '—'}</span></div>
                <div>Date: <span className="text-slate-800 font-bold">{p.requested_at}</span></div>
                <div>Delivery: <span className="text-slate-800 font-bold">{p.expected_delivery || '—'}</span></div>
              </div>
              {p.status === 'Pending' && (
                <div className="flex gap-1.5 mt-1.5">
                  <button onClick={() => handleStatusUpdate(p.id, 'Approved')}
                    className="flex-1 py-1 text-center border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-lg cursor-pointer transition">
                    Approve
                  </button>
                  <button onClick={() => handleStatusUpdate(p.id, 'Rejected')}
                    className="flex-1 py-1 text-center border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-[9px] rounded-lg cursor-pointer transition">
                    Reject
                  </button>
                </div>
              )}
              {p.status === 'Approved' && (
                <button onClick={() => handleStatusUpdate(p.id, 'Ordered')}
                  className="w-full mt-1.5 py-1 text-center border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold text-[9px] rounded-lg cursor-pointer transition">
                  Mark as Ordered
                </button>
              )}
              {p.status === 'Ordered' && (
                <button onClick={() => handleStatusUpdate(p.id, 'Received')}
                  className="w-full mt-1.5 py-1 text-center border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-lg cursor-pointer transition flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Mark as Received
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const HostelInventoryManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Dashboard
  const [dashStats, setDashStats]     = useState<DashStats>({ total_assets: 0, available: 0, issued: 0, maintenance: 0, total_records: 0, total_value: '0', pending_maint: 0, pending_proc: 0 });
  const [lowStock, setLowStock]       = useState<any[]>([]);
  const [catBreakdown, setCatBreakdown] = useState<any[]>([]);
  const [condSummary, setCondSummary] = useState<Record<string, number>>({});
  const [recentAct, setRecentAct]     = useState<any[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  // Assets
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [categories, setCategories]   = useState<any[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);

  // Issues
  const [issues, setIssues]           = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);

  // Maintenance
  const [maintLogs, setMaintLogs]     = useState<MaintenanceLog[]>([]);
  const [maintCost, setMaintCost]     = useState('0.00');
  const [maintLoading, setMaintLoading] = useState(true);

  // Procurement
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [procLoading, setProcLoading] = useState(true);

  const fetchDashboard = async () => {
    setDashLoading(true);
    try {
      const res = await api.get('/school/hostel/inventory/dashboard');
      if (res.data.success) {
        const d = res.data.data;
        setDashStats(d.stats);
        setLowStock(d.low_stock_alerts);
        setCatBreakdown(d.category_breakdown);
        setCondSummary(d.condition_summary);
        setRecentAct(d.recent_activity);
      }
    } catch (err) { console.error('Dashboard fetch error:', err); }
    finally { setDashLoading(false); }
  };

  const fetchAssets = async () => {
    setAssetsLoading(true);
    try {
      const [assRes, catRes] = await Promise.all([
        api.get('/school/hostel/inventory/assets'),
        api.get('/school/hostel/inventory/categories'),
      ]);
      if (assRes.data.success) setAssets(assRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) { console.error('Assets fetch error:', err); }
    finally { setAssetsLoading(false); }
  };

  const fetchIssues = async () => {
    setIssuesLoading(true);
    try {
      const res = await api.get('/school/hostel/inventory/issues');
      if (res.data.success) setIssues(res.data.data);
    } catch (err) { console.error('Issues fetch error:', err); }
    finally { setIssuesLoading(false); }
  };

  const fetchMaintenance = async () => {
    setMaintLoading(true);
    try {
      const res = await api.get('/school/hostel/inventory/maintenance');
      if (res.data.success) {
        setMaintLogs(res.data.data);
        setMaintCost(res.data.total_cost ?? '0.00');
      }
    } catch (err) { console.error('Maintenance fetch error:', err); }
    finally { setMaintLoading(false); }
  };

  const fetchProcurements = async () => {
    setProcLoading(true);
    try {
      const res = await api.get('/school/hostel/inventory/procurement');
      if (res.data.success) setProcurements(res.data.data);
    } catch (err) { console.error('Procurement fetch error:', err); }
    finally { setProcLoading(false); }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAssets();
    fetchIssues();
    fetchMaintenance();
    fetchProcurements();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'assets') fetchAssets();
    else if (activeTab === 'issues') { fetchIssues(); fetchAssets(); }
    else if (activeTab === 'maintenance') { fetchMaintenance(); fetchAssets(); }
    else if (activeTab === 'procurement') { fetchProcurements(); }
  }, [activeTab]);

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
    { id: 'assets',      label: 'Assets',     icon: Archive },
    { id: 'issues',      label: 'Issue/Return',icon: RefreshCw,  badge: issues.filter(i => i.status === 'Issued').length || undefined },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench,     badge: maintLogs.filter(m => m.status === 'Reported' || m.status === 'In Progress').length || undefined },
    { id: 'procurement', label: 'Procurement', icon: ShoppingCart, badge: procurements.filter(p => p.status === 'Pending').length || undefined },
  ];

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <Archive className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Inventory &amp; Asset Management</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">Shri Ram Boys Hostel · {dashStats.total_records} asset types · ₹{dashStats.total_value} total value</p>
          </div>
        </div>
        {lowStock.length > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-rose-50 text-rose-700 border-rose-200 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" /> {lowStock.length} low stock
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-0.5 border-b border-slate-200 pb-0.5 flex-shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition duration-150 cursor-pointer text-[10px] shadow-xs relative ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}>
              <Icon className={`w-2.5 h-2.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
              {tab.badge && (
                <span className="ml-0.5 px-1 py-0.2 bg-rose-500 text-white text-[8px] font-black rounded-full leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={dashStats} lowStock={lowStock} categoryBreakdown={catBreakdown}
            conditionSummary={condSummary} recentActivity={recentAct}
            loading={dashLoading} onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'assets' && (
          <AssetRegister assets={assets} categories={categories} loading={assetsLoading} onRefresh={fetchAssets} />
        )}
        {activeTab === 'issues' && (
          <IssueReturn issues={issues} assets={assets} loading={issuesLoading} onRefresh={() => { fetchIssues(); fetchAssets(); fetchDashboard(); }} />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceTab logs={maintLogs} assets={assets} totalCost={maintCost} loading={maintLoading} onRefresh={() => { fetchMaintenance(); fetchDashboard(); }} />
        )}
        {activeTab === 'procurement' && (
          <ProcurementTab procurements={procurements} categories={categories} loading={procLoading} onRefresh={() => { fetchProcurements(); fetchDashboard(); }} />
        )}
      </div>
    </div>
  );
};

export default HostelInventoryManager;
