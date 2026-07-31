import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import {
  Crown, Users, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  DollarSign, Search, RefreshCw, X, Save, Zap, Shield
} from 'lucide-react';
import api from '../../services/api';

interface Plan { id: number; name: string; badge_color: string; badge_label: string | null; price_monthly: number; price_quarterly: number; price_yearly: number; }
interface Subscription {
  id: number; school_id: number; plan_id: number;
  school: { id: number; business_name: string; email: string; logo: string | null };
  plan: { id: number; name: string; badge_color: string; badge_label: string | null };
  billing_cycle: string; amount: number; discount_pct: number; final_amount: number;
  start_date: string; end_date: string; status: string;
  payment_method: string | null; transaction_id: string | null; notes: string | null;
}
interface Overview {
  total: number; active: number; trial: number; expired: number;
  expiringSoon: number; totalRevenue: number; monthRevenue: number;
  planBreakdown: { plan_name: string; badge_color: string; count: number }[];
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  active:    { label: 'Active',    bg: 'bg-emerald-100', text: 'text-emerald-800' },
  trial:     { label: 'Trial',     bg: 'bg-blue-100',    text: 'text-blue-800' },
  expired:   { label: 'Expired',   bg: 'bg-rose-100',    text: 'text-rose-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100',   text: 'text-slate-600' },
  pending:   { label: 'Pending',   bg: 'bg-amber-100',   text: 'text-amber-800' },
  suspended: { label: 'Suspended', bg: 'bg-orange-100',  text: 'text-orange-800' },
};

const BILLING_OPTS = [
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (3 months)' },
  { value: 'yearly',    label: 'Yearly (12 months)' },
  { value: 'lifetime',  label: 'Lifetime' },
];

const selectSt = {
  control: (b: any) => ({ ...b, borderRadius: '8px', borderColor: '#cbd5e1', minHeight: '36px', fontSize: '13px', boxShadow: 'none', '&:hover': { borderColor: '#94a3b8' } }),
  valueContainer: (b: any) => ({ ...b, padding: '0 10px' }),
  input: (b: any) => ({ ...b, margin: '0', padding: '0' }),
  option: (b: any, s: any) => ({ ...b, backgroundColor: s.isFocused ? '#eff6ff' : 'white', fontSize: '13px', cursor: 'pointer' }),
  placeholder: (b: any) => ({ ...b, fontSize: '13px', color: '#94a3b8' }),
  singleValue: (b: any) => ({ ...b, fontSize: '13px', fontWeight: 600 }),
};

function AssignModal({ plans, onClose, onSave, editSub }: { plans: Plan[]; onClose: () => void; onSave: (d: any) => void; editSub?: Subscription | null }) {
  const [form, setForm] = useState({
    school_id: editSub?.school_id || '',
    plan_id: editSub?.plan_id || '',
    billing_cycle: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    discount_pct: 0,
    payment_method: '',
    transaction_id: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [schoolList, setSchoolList] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    api.get('/schools', { params: { per_page: 200 } })
      .then(r => {
        if (r.data.success) setSchoolList(r.data.data.map((s: any) => ({ value: String(s.id), label: `${s.business_name} (${s.email})` })));
      })
      .catch(() => setSchoolList([
        { value: '1', label: 'Delhi Public School (dps@example.com)' },
        { value: '2', label: 'St. Xavier College (xavier@example.com)' },
        { value: '3', label: 'Kendriya Vidyalaya (kv@example.com)' },
      ]));
  }, []);

  const selPlan = plans.find(p => p.id === Number(form.plan_id));
  const basePrice = selPlan ? (
    form.billing_cycle === 'monthly'   ? selPlan.price_monthly :
    form.billing_cycle === 'quarterly' ? selPlan.price_quarterly :
    form.billing_cycle === 'yearly'    ? selPlan.price_yearly : 0
  ) : 0;
  const finalPrice = Math.round(basePrice - (basePrice * form.discount_pct / 100));

  const handleSave = async () => {
    if (!form.school_id || !form.plan_id) { toast.error('School and Plan required'); return; }
    setSaving(true);
    await onSave({ ...form, school_id: Number(form.school_id), plan_id: Number(form.plan_id) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-purple-700 to-blue-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="text-sm font-bold flex items-center gap-2"><Crown className="w-4.5 h-4.5 text-amber-300" /> Assign Subscription Plan</div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">School *</label>
            <Select options={schoolList} onChange={o => setForm(p => ({ ...p, school_id: o?.value || '' }))}
              value={schoolList.find(s => s.value === String(form.school_id)) || null} placeholder="Search school..." styles={selectSt} classNamePrefix="react-select" isClearable />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Subscription Plan *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {plans.filter(p => p.price_monthly >= 0).map(p => {
                const isSelected = form.plan_id === String(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => setForm(prev => ({ ...prev, plan_id: String(p.id) }))}
                    className={`flex flex-col justify-between p-2 rounded-xl border-2 text-left cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50/80 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.badge_color }} />
                      <span className="font-bold text-slate-800 text-xs truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-[11px] font-semibold text-slate-500">₹{p.price_monthly.toLocaleString('en-IN')}/mo</span>
                      {p.badge_label && <span className="px-1 py-0.2 text-[8px] font-black rounded text-white flex-shrink-0" style={{ backgroundColor: p.badge_color }}>{p.badge_label}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Billing Cycle</label>
              <Select options={BILLING_OPTS} value={BILLING_OPTS.find(b => b.value === form.billing_cycle) || null} onChange={o => setForm(p => ({ ...p, billing_cycle: o?.value || 'monthly' }))} styles={selectSt} classNamePrefix="react-select" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discount %</label>
              <input type="number" min="0" max="100" value={form.discount_pct} onChange={e => setForm(p => ({ ...p, discount_pct: Number(e.target.value) }))} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white border">
                <option value="">— Select —</option>
                <option>UPI</option><option>Bank Transfer</option><option>Cash</option><option>Card</option><option>Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Transaction ID (optional)</label>
            <input value={form.transaction_id} onChange={e => setForm(p => ({ ...p, transaction_id: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500" placeholder="UTR / Ref No..." />
          </div>

          {selPlan && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <div className="text-xs text-blue-900">
                <span className="font-bold">{selPlan.name}</span> • <span className="capitalize">{form.billing_cycle}</span>
                {form.discount_pct > 0 && <span className="ml-2 text-emerald-700 font-bold">(-{form.discount_pct}% off)</span>}
              </div>
              <div className="text-lg font-black text-blue-900">₹{finalPrice.toLocaleString('en-IN')}</div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Assign Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionManagementPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pp] = useState(15);
  const [showAssign, setShowAssign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes, ovRes] = await Promise.all([
        api.get('/subscription-plans'),
        api.get('/school-subscriptions', { params: { page, per_page: pp, search, status: statusFilter || undefined } }),
        api.get('/school-subscriptions/overview'),
      ]);
      if (plansRes.data.success) setPlans(plansRes.data.data);
      if (subsRes.data.success) { setSubs(subsRes.data.data); setTotal(subsRes.data.total); }
      if (ovRes.data.success)   setOverview(ovRes.data.data);
    } catch {
      setPlans([
        { id:1, name:'Free', badge_color:'#64748b', badge_label:null, price_monthly:0, price_quarterly:0, price_yearly:0 },
        { id:2, name:'Basic', badge_color:'#22c55e', badge_label:null, price_monthly:999, price_quarterly:2699, price_yearly:9999 },
        { id:3, name:'Standard', badge_color:'#3b82f6', badge_label:null, price_monthly:2499, price_quarterly:6749, price_yearly:24999 },
        { id:4, name:'Premium', badge_color:'#f59e0b', badge_label:'Best Value', price_monthly:4999, price_quarterly:13499, price_yearly:49999 },
        { id:5, name:'Enterprise', badge_color:'#7c3aed', badge_label:'All Inclusive', price_monthly:9999, price_quarterly:26999, price_yearly:99999 },
      ]);
      const demoSubs: Subscription[] = [
        { id:1, school_id:1, plan_id:3, school:{id:1,business_name:'Delhi Public School',email:'admin@dps.edu',logo:null}, plan:{id:3,name:'Standard',badge_color:'#3b82f6',badge_label:null}, billing_cycle:'yearly', amount:24999, discount_pct:0, final_amount:24999, start_date:'2025-04-01', end_date:'2026-03-31', status:'active', payment_method:'Bank Transfer', transaction_id:'TXN12345', notes:null },
        { id:2, school_id:2, plan_id:4, school:{id:2,business_name:'St. Xavier School',email:'admin@xavier.edu',logo:null}, plan:{id:4,name:'Premium',badge_color:'#f59e0b',badge_label:'Best Value'}, billing_cycle:'monthly', amount:4999, discount_pct:10, final_amount:4499, start_date:'2026-07-01', end_date:'2026-07-31', status:'active', payment_method:'UPI', transaction_id:'UPI789', notes:null },
        { id:3, school_id:3, plan_id:2, school:{id:3,business_name:'Kendriya Vidyalaya',email:'admin@kv.edu',logo:null}, plan:{id:2,name:'Basic',badge_color:'#22c55e',badge_label:null}, billing_cycle:'monthly', amount:999, discount_pct:0, final_amount:999, start_date:'2026-06-01', end_date:'2026-06-30', status:'expired', payment_method:'Cash', transaction_id:null, notes:null },
        { id:4, school_id:4, plan_id:2, school:{id:4,business_name:'Modern Academy',email:'admin@modern.edu',logo:null}, plan:{id:2,name:'Basic',badge_color:'#22c55e',badge_label:null}, billing_cycle:'monthly', amount:999, discount_pct:0, final_amount:999, start_date:'2026-07-15', end_date:'2026-08-15', status:'trial', payment_method:null, transaction_id:null, notes:'Trial period' },
      ];
      setSubs(demoSubs); setTotal(demoSubs.length);
      setOverview({ total:4, active:2, trial:1, expired:1, expiringSoon:1, totalRevenue:185000, monthRevenue:42000, planBreakdown:[{plan_name:'Standard',badge_color:'#3b82f6',count:2},{plan_name:'Premium',badge_color:'#f59e0b',count:1},{plan_name:'Basic',badge_color:'#22c55e',count:1}] });
    } finally { setLoading(false); }
  }, [page, pp, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async (data: any) => {
    try {
      await api.post('/school-subscriptions/assign', data);
      toast.success('Plan assigned successfully!');
      setShowAssign(false);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to assign plan'); }
  };

  const handleCancel = async (sub: Subscription) => {
    if (!confirm(`Cancel subscription for "${sub.school.business_name}"?`)) return;
    try {
      await api.post(`/school-subscriptions/${sub.id}/cancel`);
      toast.success('Subscription cancelled');
      load();
    } catch { toast.error('Failed to cancel'); }
  };

  const daysLeft = (end: string) => {
    const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const tp = Math.ceil(total / pp) || 1;

  return (
    <div className="space-y-4 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Shield className="w-6 h-6 text-blue-600" /> Subscription Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage all school subscriptions, billing cycles, and plan assignments</p>
          </div>
          <button onClick={() => setShowAssign(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer shadow-md">
            <Crown className="w-4 h-4" /> Assign Plan to School
          </button>
        </div>

        {/* KPI Cards */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label:'Total', value:overview.total, bg:'bg-slate-50', border:'border-slate-200', text:'text-slate-800', icon:<Users className="w-4 h-4 text-slate-500" /> },
              { label:'Active', value:overview.active, bg:'bg-emerald-50', border:'border-emerald-200', text:'text-emerald-800', icon:<CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
              { label:'Trial', value:overview.trial, bg:'bg-blue-50', border:'border-blue-200', text:'text-blue-800', icon:<Zap className="w-4 h-4 text-blue-600" /> },
              { label:'Expired', value:overview.expired, bg:'bg-rose-50', border:'border-rose-200', text:'text-rose-800', icon:<XCircle className="w-4 h-4 text-rose-600" /> },
              { label:'Expiring ≤30d', value:overview.expiringSoon, bg:'bg-amber-50', border:'border-amber-200', text:'text-amber-800', icon:<AlertTriangle className="w-4 h-4 text-amber-600" /> },
              { label:'Total Revenue', value:`₹${overview.totalRevenue.toLocaleString('en-IN')}`, bg:'bg-purple-50', border:'border-purple-200', text:'text-purple-800', icon:<DollarSign className="w-4 h-4 text-purple-600" /> },
              { label:'This Month', value:`₹${overview.monthRevenue.toLocaleString('en-IN')}`, bg:'bg-teal-50', border:'border-teal-200', text:'text-teal-800', icon:<TrendingUp className="w-4 h-4 text-teal-600" /> },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-3`}>
                <div className="flex items-center gap-1.5 mb-1">{c.icon}<div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</div></div>
                <div className={`text-lg font-black ${c.text}`}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Plan Breakdown */}
        {overview?.planBreakdown && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Active Subscribers by Plan</div>
            <div className="flex items-center gap-4 flex-wrap">
              {overview.planBreakdown.map(pb => (
                <div key={pb.plan_name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pb.badge_color }} />
                  <span className="text-sm font-bold text-slate-700">{pb.plan_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">{pb.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1" style={{ minWidth: '180px' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school name or email..." className="w-full pl-9 pr-3 h-9 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-700 cursor-pointer">
            <option value="">All Status</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg border border-rose-200 cursor-pointer">Clear</button>
          )}
          <button onClick={load} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 cursor-pointer ml-auto"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['School','Plan','Billing Cycle','Amount','Period','Status','Days Left','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="py-12 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-slate-400 text-xs">Loading subscriptions...</p></td></tr>
                ) : subs.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-400"><Crown className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="font-bold">No subscriptions found</p></td></tr>
                ) : subs.map(sub => {
                  const st = STATUS_CFG[sub.status] || STATUS_CFG.pending;
                  const dl = daysLeft(sub.end_date);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                            {sub.school.business_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 whitespace-nowrap">{sub.school.business_name}</div>
                            <div className="text-[10px] text-slate-400">{sub.school.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.plan.badge_color }} />
                          <span className="font-bold text-slate-700">{sub.plan.name}</span>
                          {sub.plan.badge_label && <span className="px-1.5 py-0.5 text-[8px] font-black rounded text-white" style={{ backgroundColor: sub.plan.badge_color }}>{sub.plan.badge_label}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize font-medium">{sub.billing_cycle}</td>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-800">₹{sub.final_amount.toLocaleString('en-IN')}</div>
                        {sub.discount_pct > 0 && <div className="text-[10px] text-emerald-600 font-bold">{sub.discount_pct}% off</div>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">{sub.start_date} → {sub.end_date}</td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>{st.label}</span></td>
                      <td className="px-4 py-3">
                        {dl > 0 ? (
                          <div>
                            <div className={`font-black text-sm ${dl <= 7 ? 'text-rose-600' : dl <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>{dl}d</div>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1">
                              <div className={`h-1.5 rounded-full ${dl <= 7 ? 'bg-rose-500' : dl <= 30 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (dl / 365) * 100)}%` }} />
                            </div>
                          </div>
                        ) : <span className="text-rose-600 font-bold text-xs">Expired</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowAssign(true)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer" title="Reassign">
                            <Crown className="w-4 h-4" />
                          </button>
                          {sub.status === 'active' && (
                            <button onClick={() => handleCancel(sub)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer" title="Cancel">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between bg-slate-50">
            <span className="text-xs text-slate-500">Total: <strong>{total}</strong> subscriptions</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page===1} className="px-2.5 py-1 border border-slate-300 rounded text-xs hover:bg-white disabled:opacity-40 cursor-pointer">First</button>
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-2.5 py-1 border border-slate-300 rounded text-xs hover:bg-white disabled:opacity-40 cursor-pointer">Prev</button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold">{page}/{tp}</span>
              <button onClick={() => setPage(p=>Math.min(tp,p+1))} disabled={page===tp} className="px-2.5 py-1 border border-slate-300 rounded text-xs hover:bg-white disabled:opacity-40 cursor-pointer">Next</button>
              <button onClick={() => setPage(tp)} disabled={page===tp} className="px-2.5 py-1 border border-slate-300 rounded text-xs hover:bg-white disabled:opacity-40 cursor-pointer">Last</button>
            </div>
          </div>
        </div>
      </div>

      {showAssign && <AssignModal plans={plans} onClose={() => setShowAssign(false)} onSave={handleAssign} />}
    </div>
  );
}
