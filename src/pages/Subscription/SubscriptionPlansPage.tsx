import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Crown, Plus, Edit2, Trash2, Check, X, ToggleLeft, ToggleRight,
  Star, Zap, Shield, Users, BookOpen, Bus, Home, CreditCard, Bell,
  Smartphone, Fingerprint, Code, BarChart3, Palette, Headphones,
  MessageSquare, GraduationCap, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../../services/api';

interface Feature { key: string; label: string; icon: any; }
interface Plan {
  id: number; name: string; slug: string; description: string;
  badge_color: string; badge_label: string | null;
  price_monthly: number; price_quarterly: number; price_yearly: number;
  trial_days: number; max_students: number; max_teachers: number;
  max_admins: number; max_branches: number;
  features: Record<string, boolean>;
  is_popular: boolean; is_active: boolean; sort_order: number;
  subscriptions_count?: number; active_subscriptions_count?: number;
}

const FEATURE_DEFS: Feature[] = [
  { key: 'student_module',        label: 'Student Module',        icon: GraduationCap },
  { key: 'fee_module',            label: 'Fee Management',        icon: CreditCard },
  { key: 'attendance_module',     label: 'Attendance Module',     icon: Check },
  { key: 'exam_module',           label: 'Exam & Results',        icon: BookOpen },
  { key: 'library_module',        label: 'Library Module',        icon: BookOpen },
  { key: 'hostel_module',         label: 'Hostel Management',     icon: Home },
  { key: 'transport_module',      label: 'Transport Module',      icon: Bus },
  { key: 'payroll_module',        label: 'Payroll & HR',          icon: DollarSign },
  { key: 'communication_module',  label: 'Communication Hub',     icon: MessageSquare },
  { key: 'sms_alerts',            label: 'SMS Alerts',            icon: Bell },
  { key: 'mobile_app',            label: 'Mobile App Access',     icon: Smartphone },
  { key: 'biometric_integration', label: 'Biometric Integration', icon: Fingerprint },
  { key: 'multi_branch',          label: 'Multi-Branch Support',  icon: Users },
  { key: 'api_access',            label: 'API Access',            icon: Code },
  { key: 'custom_reports',        label: 'Custom Reports',        icon: BarChart3 },
  { key: 'white_label',           label: 'White Label',           icon: Palette },
  { key: 'priority_support',      label: 'Priority Support',      icon: Headphones },
];

const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly'] as const;
const fmt = (n: number) => n < 0 ? 'Unlimited' : n.toLocaleString('en-IN');
const fmtINR = (n: number) => n === 0 ? 'Free' : `₹${n.toLocaleString('en-IN')}`;

const EMPTY_PLAN: Partial<Plan> = {
  name: '', description: '', badge_color: '#3b82f6', badge_label: '',
  price_monthly: 0, price_quarterly: 0, price_yearly: 0, trial_days: 0,
  max_students: 100, max_teachers: 10, max_admins: 2, max_branches: 1,
  features: Object.fromEntries(FEATURE_DEFS.map(f => [f.key, false])),
  is_popular: false, is_active: true, sort_order: 99,
};

function PlanModal({ plan, onClose, onSave }: { plan: Partial<Plan>; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState<Partial<Plan>>({ ...EMPTY_PLAN, ...plan });
  const [saving, setSaving] = useState(false);

  const setF = (k: keyof Plan, v: any) => setForm(p => ({ ...p, [k]: v }));
  const toggleFeature = (key: string) => setForm(p => ({ ...p, features: { ...(p.features || {}), [key]: !(p.features?.[key]) } }));

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error('Plan name required'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl my-4">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl text-white">
          <div className="text-base font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" />{plan.id ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}</div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Plan Name *</label>
              <input value={form.name || ''} onChange={e => setF('name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g. Premium" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Badge Label</label>
              <input value={form.badge_label || ''} onChange={e => setF('badge_label', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g. Most Popular" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => setF('description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Pricing */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">Pricing (₹)</label>
            <div className="grid grid-cols-3 gap-3">
              {['Monthly', 'Quarterly', 'Yearly'].map((l, i) => {
                const k = (['price_monthly','price_quarterly','price_yearly'] as const)[i];
                return (
                  <div key={k}>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">{l}</label>
                    <input type="number" min="0" value={(form as any)[k] || 0} onChange={e => setF(k, Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Limits */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">Limits (-1 = Unlimited)</label>
            <div className="grid grid-cols-4 gap-3">
              {[['max_students','Students'],['max_teachers','Teachers'],['max_admins','Admins'],['max_branches','Branches']].map(([k, l]) => (
                <div key={k}>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">{l}</label>
                  <input type="number" value={(form as any)[k] || 0} onChange={e => setF(k as keyof Plan, Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Badge Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.badge_color || '#3b82f6'} onChange={e => setF('badge_color', e.target.value)} className="h-9 w-14 rounded cursor-pointer border border-slate-300" />
                <input value={form.badge_color || ''} onChange={e => setF('badge_color', e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Trial Days</label>
              <input type="number" min="0" value={form.trial_days || 0} onChange={e => setF('trial_days', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Sort Order</label>
              <input type="number" min="1" value={form.sort_order || 1} onChange={e => setF('sort_order', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_popular || false} onChange={e => setF('is_popular', e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
              <span className="text-sm font-semibold text-slate-700">Mark as Popular</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active !== false} onChange={e => setF('is_active', e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-sm font-semibold text-slate-700">Active Plan</span>
            </label>
          </div>

          {/* Features */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">Feature Access</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FEATURE_DEFS.map(f => {
                const enabled = form.features?.[f.key] || false;
                const Icon = f.icon;
                return (
                  <button key={f.key} type="button" onClick={() => toggleFeature(f.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${enabled ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{f.label}</span>
                    {enabled && <Check className="w-3 h-3 ml-auto text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold cursor-pointer flex items-center gap-2 disabled:opacity-60">
            <Crown className="w-4 h-4" />{saving ? 'Saving...' : plan.id ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<Partial<Plan> | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscription-plans/stats');
      if (res.data.success) setPlans(res.data.data);
    } catch {
      setPlans([
        { id:1, name:'Free', slug:'free', description:'Perfect for small schools.', badge_color:'#64748b', badge_label:null, price_monthly:0, price_quarterly:0, price_yearly:0, trial_days:0, max_students:50, max_teachers:5, max_admins:1, max_branches:1, features:{student_module:true,attendance_module:true}, is_popular:false, is_active:true, sort_order:1, subscriptions_count:12, active_subscriptions_count:8 },
        { id:2, name:'Basic', slug:'basic', description:'For growing schools.', badge_color:'#22c55e', badge_label:null, price_monthly:999, price_quarterly:2699, price_yearly:9999, trial_days:14, max_students:200, max_teachers:20, max_admins:2, max_branches:1, features:{student_module:true,attendance_module:true,fee_module:true,exam_module:true}, is_popular:false, is_active:true, sort_order:2, subscriptions_count:28, active_subscriptions_count:22 },
        { id:3, name:'Standard', slug:'standard', description:'Complete school suite.', badge_color:'#3b82f6', badge_label:null, price_monthly:2499, price_quarterly:6749, price_yearly:24999, trial_days:14, max_students:500, max_teachers:50, max_admins:5, max_branches:2, features:{student_module:true,attendance_module:true,fee_module:true,exam_module:true,library_module:true,hostel_module:true,communication_module:true,custom_reports:true}, is_popular:true, is_active:true, sort_order:3, subscriptions_count:45, active_subscriptions_count:41 },
        { id:4, name:'Premium', slug:'premium', description:'All modules + SMS & payroll.', badge_color:'#f59e0b', badge_label:'Best Value', price_monthly:4999, price_quarterly:13499, price_yearly:49999, trial_days:14, max_students:1500, max_teachers:150, max_admins:10, max_branches:5, features:{student_module:true,fee_module:true,hostel_module:true,transport_module:true,library_module:true,payroll_module:true,attendance_module:true,exam_module:true,communication_module:true,sms_alerts:true,mobile_app:true,biometric_integration:true,multi_branch:true,custom_reports:true}, is_popular:false, is_active:true, sort_order:4, subscriptions_count:18, active_subscriptions_count:17 },
        { id:5, name:'Enterprise', slug:'enterprise', description:'Unlimited + white label.', badge_color:'#7c3aed', badge_label:'All Inclusive', price_monthly:9999, price_quarterly:26999, price_yearly:99999, trial_days:30, max_students:-1, max_teachers:-1, max_admins:-1, max_branches:-1, features:Object.fromEntries(FEATURE_DEFS.map(f=>[f.key,true])), is_popular:false, is_active:true, sort_order:5, subscriptions_count:5, active_subscriptions_count:5 },
      ]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleSave = async (data: any) => {
    try {
      if (editPlan?.id) {
        await api.put(`/subscription-plans/${editPlan.id}`, data);
        toast.success('Plan updated!');
      } else {
        await api.post('/subscription-plans', data);
        toast.success('Plan created!');
      }
      setEditPlan(null);
      loadPlans();
    } catch { toast.error('Failed to save plan'); }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/subscription-plans/${plan.id}`);
      toast.success('Plan deleted');
      loadPlans();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Cannot delete plan'); }
  };

  const handleToggle = async (plan: Plan) => {
    try {
      await api.put(`/subscription-plans/${plan.id}`, { is_active: !plan.is_active });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed to toggle plan'); }
  };

  const totalRevenue = plans.reduce((s, p) => s + (p.active_subscriptions_count || 0) * p.price_monthly, 0);

  return (
    <div className="space-y-4 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Crown className="w-6 h-6 text-amber-500" /> Subscription Plans</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage all ERP subscription tiers and feature access</p>
          </div>
          <button onClick={() => setEditPlan(EMPTY_PLAN)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer shadow-md">
            <Plus className="w-4 h-4" /> Create New Plan
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Plans', value: plans.length, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200', icon: <Crown className="w-5 h-5 text-slate-500" /> },
            { label: 'Active Plans', value: plans.filter(p=>p.is_active).length, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <Check className="w-5 h-5 text-emerald-600" /> },
            { label: 'Total Subscribers', value: plans.reduce((s,p)=>s+(p.subscriptions_count||0),0), color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Users className="w-5 h-5 text-blue-600" /> },
            { label: 'Est. Monthly Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: <DollarSign className="w-5 h-5 text-amber-600" /> },
          ].map(c => (
            <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-3 flex items-center gap-3`}>
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">{c.icon}</div>
              <div><div className={`text-xl font-black ${c.color}`}>{c.value}</div><div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</div></div>
            </div>
          ))}
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200"><div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-slate-400">Loading plans...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map(plan => {
              const enabledFeatures = FEATURE_DEFS.filter(f => plan.features?.[f.key]);
              const isExpanded = expandedCard === plan.id;
              return (
                <div key={plan.id} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${plan.is_popular ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'} ${!plan.is_active ? 'opacity-60' : ''}`}>
                  {/* Card Header */}
                  <div className="p-4 relative" style={{ background: `linear-gradient(135deg, ${plan.badge_color}18 0%, ${plan.badge_color}08 100%)` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.badge_color }} />
                          <span className="text-lg font-black text-slate-900">{plan.name}</span>
                          {plan.is_popular && <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-full uppercase">Popular</span>}
                          {plan.badge_label && <span className="px-2 py-0.5 text-[9px] font-black rounded-full uppercase text-white" style={{backgroundColor: plan.badge_color}}>{plan.badge_label}</span>}
                          {!plan.is_active && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black rounded-full uppercase">Inactive</span>}
                        </div>
                        <p className="text-xs text-slate-500 leading-snug">{plan.description}</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-black text-slate-900" style={{ color: plan.badge_color }}>{fmtINR(plan.price_monthly)}</span>
                      {plan.price_monthly > 0 && <span className="text-slate-500 text-xs">/month</span>}
                    </div>
                    {plan.price_yearly > 0 && (
                      <div className="text-[10px] text-slate-500">
                        <span className="font-bold text-emerald-700">₹{plan.price_yearly.toLocaleString('en-IN')}/yr</span> • <span>₹{plan.price_quarterly.toLocaleString('en-IN')}/quarter</span>
                        {plan.trial_days > 0 && <span className="ml-2 text-blue-700 font-bold">{plan.trial_days}-day free trial</span>}
                      </div>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {[['Students', plan.max_students], ['Teachers', plan.max_teachers], ['Admins', plan.max_admins], ['Branches', plan.max_branches]].map(([l, v]) => (
                        <div key={l as string} className="bg-white rounded-lg p-1.5 border border-slate-100">
                          <div className="text-xs font-black text-slate-800">{fmt(v as number)}</div>
                          <div className="text-[9px] text-slate-400 font-semibold">{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features Preview */}
                  <div className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {enabledFeatures.slice(0, isExpanded ? 999 : 6).map(f => {
                        const Icon = f.icon;
                        return (
                          <span key={f.key} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold">
                            <Icon className="w-3 h-3" />{f.label}
                          </span>
                        );
                      })}
                      {!isExpanded && enabledFeatures.length > 6 && (
                        <button onClick={() => setExpandedCard(plan.id)} className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-semibold cursor-pointer hover:bg-slate-200">
                          +{enabledFeatures.length - 6} more <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                      {isExpanded && (
                        <button onClick={() => setExpandedCard(null)} className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-semibold cursor-pointer hover:bg-slate-200">
                          <ChevronUp className="w-3 h-3" /> Show less
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats + Actions */}
                  <div className="px-4 pb-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span><strong className="text-slate-800">{plan.active_subscriptions_count || 0}</strong> Active</span>
                      <span><strong className="text-slate-800">{plan.subscriptions_count || 0}</strong> Total</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggle(plan)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" title={plan.is_active ? 'Deactivate' : 'Activate'}>
                        {plan.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                      </button>
                      <button onClick={() => setEditPlan(plan)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(plan)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editPlan && <PlanModal plan={editPlan} onClose={() => setEditPlan(null)} onSave={handleSave} />}
    </div>
  );
}
