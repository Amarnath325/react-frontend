import { useState, useEffect, useCallback } from 'react';
import {
  Crown, Check, X, Calendar, AlertTriangle,
  Star, CreditCard, FileText, BarChart3,
  Users, BookOpen, Home, Bus, Bell, Smartphone, Fingerprint,
  Code, Palette, Headphones, MessageSquare, GraduationCap,
  DollarSign, Shield, ToggleLeft
} from 'lucide-react';
import api from '../../services/api';

interface Feature { key: string; label: string; icon: any; }
interface Plan {
  id: number; name: string; slug: string; description: string;
  badge_color: string; badge_label: string | null;
  price_monthly: number; price_quarterly: number; price_yearly: number;
  trial_days: number; max_students: number; max_teachers: number;
  max_admins: number; max_branches: number;
  features: Record<string, boolean>; is_popular: boolean; is_active: boolean;
}
interface Subscription {
  id: number; plan: Plan; billing_cycle: string;
  amount: number; discount_pct: number; final_amount: number;
  start_date: string; end_date: string; status: string;
  payment_method: string | null; transaction_id: string | null;
  invoices: Invoice[];
}
interface Invoice {
  id: number; invoice_number: string; amount: number; tax_amount: number;
  total_amount: number; billing_period_start: string; billing_period_end: string;
  status: string; payment_date: string | null; due_date: string | null;
  payment_method: string | null; created_at: string;
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

const INV_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  paid:      { label: 'Paid',      bg: 'bg-emerald-100', text: 'text-emerald-800' },
  unpaid:    { label: 'Unpaid',    bg: 'bg-amber-100',   text: 'text-amber-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100',   text: 'text-slate-600' },
  refunded:  { label: 'Refunded',  bg: 'bg-blue-100',    text: 'text-blue-800' },
  overdue:   { label: 'Overdue',   bg: 'bg-rose-100',    text: 'text-rose-800' },
};

const fmt = (n: number) => n < 0 ? 'Unlimited' : n.toLocaleString('en-IN');

const DEMO_SUBSCRIPTION: Subscription = {
  id: 1,
  plan: {
    id: 3, name: 'Standard', slug: 'standard',
    description: 'For established schools with library, hostel, and transport needs.',
    badge_color: '#3b82f6', badge_label: null,
    price_monthly: 2499, price_quarterly: 6749, price_yearly: 24999,
    trial_days: 14, max_students: 500, max_teachers: 50, max_admins: 5, max_branches: 2,
    features: { student_module:true, attendance_module:true, fee_module:true, exam_module:true, library_module:true, hostel_module:true, communication_module:true, custom_reports:true },
    is_popular: true, is_active: true,
  },
  billing_cycle: 'yearly', amount: 24999, discount_pct: 0, final_amount: 24999,
  start_date: '2026-04-01', end_date: '2027-03-31', status: 'active',
  payment_method: 'Bank Transfer', transaction_id: 'TXN-20260401-001',
  invoices: [
    { id:1, invoice_number:'INV-000001', amount:24999, tax_amount:4499.82, total_amount:29498.82, billing_period_start:'2026-04-01', billing_period_end:'2027-03-31', status:'paid', payment_date:'2026-04-01T10:00:00Z', due_date:'2026-04-05', payment_method:'Bank Transfer', created_at:'2026-04-01T10:00:00Z' },
    { id:2, invoice_number:'INV-000002', amount:24999, tax_amount:4499.82, total_amount:29498.82, billing_period_start:'2025-04-01', billing_period_end:'2026-03-31', status:'paid', payment_date:'2025-04-02T14:00:00Z', due_date:'2025-04-05', payment_method:'Bank Transfer', created_at:'2025-04-01T10:00:00Z' },
  ],
};

const DEMO_PLANS: Plan[] = [
  { id:1, name:'Free', slug:'free', description:'Basic', badge_color:'#64748b', badge_label:null, price_monthly:0, price_quarterly:0, price_yearly:0, trial_days:0, max_students:50, max_teachers:5, max_admins:1, max_branches:1, features:{student_module:true,attendance_module:true}, is_popular:false, is_active:true },
  { id:2, name:'Basic', slug:'basic', description:'For growing schools', badge_color:'#22c55e', badge_label:null, price_monthly:999, price_quarterly:2699, price_yearly:9999, trial_days:14, max_students:200, max_teachers:20, max_admins:2, max_branches:1, features:{student_module:true,attendance_module:true,fee_module:true,exam_module:true}, is_popular:false, is_active:true },
  { id:3, name:'Standard', slug:'standard', description:'Complete school suite', badge_color:'#3b82f6', badge_label:null, price_monthly:2499, price_quarterly:6749, price_yearly:24999, trial_days:14, max_students:500, max_teachers:50, max_admins:5, max_branches:2, features:{student_module:true,attendance_module:true,fee_module:true,exam_module:true,library_module:true,hostel_module:true,communication_module:true,custom_reports:true}, is_popular:true, is_active:true },
  { id:4, name:'Premium', slug:'premium', description:'All modules + SMS', badge_color:'#f59e0b', badge_label:'Best Value', price_monthly:4999, price_quarterly:13499, price_yearly:49999, trial_days:14, max_students:1500, max_teachers:150, max_admins:10, max_branches:5, features:{student_module:true,fee_module:true,hostel_module:true,transport_module:true,library_module:true,payroll_module:true,attendance_module:true,exam_module:true,communication_module:true,sms_alerts:true,mobile_app:true,biometric_integration:true,multi_branch:true,custom_reports:true}, is_popular:false, is_active:true },
  { id:5, name:'Enterprise', slug:'enterprise', description:'Unlimited everything', badge_color:'#7c3aed', badge_label:'All Inclusive', price_monthly:9999, price_quarterly:26999, price_yearly:99999, trial_days:30, max_students:-1, max_teachers:-1, max_admins:-1, max_branches:-1, features:Object.fromEntries(FEATURE_DEFS.map(f=>[f.key,true])), is_popular:false, is_active:true },
];

export default function MySubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'invoices'>('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school-subscriptions/my');
      if (res.data.success) {
        setSub(res.data.subscription);
        setAllPlans(res.data.all_plans || []);
        setDaysRemaining(res.data.days_remaining || 0);
      }
    } catch {
      setSub(DEMO_SUBSCRIPTION);
      setAllPlans(DEMO_PLANS);
      setDaysRemaining(340);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500 font-semibold">Loading subscription...</p></div>
    </div>
  );

  const plan = sub?.plan;
  const totalDays = sub ? Math.ceil((new Date(sub.end_date).getTime() - new Date(sub.start_date).getTime()) / 86400000) : 1;
  const usedDays = Math.max(0, totalDays - daysRemaining);
  const progressPct = Math.min(100, (usedDays / totalDays) * 100);
  const currentPlanIdx = allPlans.findIndex(p => p.id === plan?.id);

  return (
    <div className="space-y-4 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Crown className="w-6 h-6 text-amber-500" /> My Subscription</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your plan, billing, and feature access</p>
          </div>
          {!sub && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> No active subscription — contact super admin
            </div>
          )}
        </div>

        {plan && sub && (
          <>
            {/* Plan Hero Card */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200" style={{ background: `linear-gradient(135deg, ${plan.badge_color}22 0%, ${plan.badge_color}08 100%)` }}>
              <div className="p-5 flex flex-col md:flex-row md:items-start gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full shadow" style={{ backgroundColor: plan.badge_color }} />
                      <span className="text-2xl font-black text-slate-900">{plan.name}</span>
                    </div>
                    {plan.is_popular && <span className="px-2.5 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full">POPULAR</span>}
                    {plan.badge_label && <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full text-white" style={{ backgroundColor: plan.badge_color }}>{plan.badge_label}</span>}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>{sub.status.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{plan.description}</p>

                  {/* Progress Bar */}
                  <div className="bg-white/80 rounded-xl p-3 border border-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {sub.start_date} → {sub.end_date}</div>
                      <div className={`text-sm font-black ${daysRemaining <= 7 ? 'text-rose-600' : daysRemaining <= 30 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-2.5 rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: daysRemaining <= 7 ? '#ef4444' : daysRemaining <= 30 ? '#f59e0b' : plan.badge_color }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{usedDays}d used</span>
                      <span>{totalDays}d total</span>
                    </div>
                  </div>
                </div>

                {/* Pricing + Limits */}
                <div className="md:w-64 space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
                    <div className="text-3xl font-black text-slate-900" style={{ color: plan.badge_color }}>
                      {sub.final_amount === 0 ? 'Free' : `₹${sub.final_amount.toLocaleString('en-IN')}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 capitalize font-semibold">{sub.billing_cycle} billing</div>
                    {sub.discount_pct > 0 && <div className="mt-1 text-xs text-emerald-700 font-bold">{sub.discount_pct}% discount applied</div>}
                    {sub.payment_method && <div className="mt-1 text-[10px] text-slate-400">{sub.payment_method}</div>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[['Students', plan.max_students], ['Teachers', plan.max_teachers], ['Admins', plan.max_admins], ['Branches', plan.max_branches]].map(([l, v]) => (
                      <div key={l as string} className="bg-white rounded-xl p-2 border border-slate-200 text-center shadow-sm">
                        <div className="text-base font-black text-slate-800">{fmt(v as number)}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
              {([['overview','Overview'],['compare','Compare Plans'],['invoices','Billing History']] as const).map(([t,l]) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>{l}</button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Included Features</div>
                  <div className="space-y-1.5">
                    {FEATURE_DEFS.filter(f => plan.features?.[f.key]).map(f => {
                      const Icon = f.icon;
                      return (
                        <div key={f.key} className="flex items-center gap-2 py-1">
                          <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-3.5 h-3.5 text-emerald-700" /></div>
                          <span className="text-sm text-slate-700 font-medium">{f.label}</span>
                          <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><ToggleLeft className="w-4 h-4 text-slate-400" /> Not Included</div>
                  <div className="space-y-1.5">
                    {FEATURE_DEFS.filter(f => !plan.features?.[f.key]).map(f => {
                      const Icon = f.icon;
                      return (
                        <div key={f.key} className="flex items-center gap-2 py-1 opacity-50">
                          <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-3.5 h-3.5 text-slate-400" /></div>
                          <span className="text-sm text-slate-500 font-medium">{f.label}</span>
                          <X className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                        </div>
                      );
                    })}
                  </div>
                  {FEATURE_DEFS.filter(f => !plan.features?.[f.key]).length === 0 && (
                    <div className="text-center py-6 text-slate-400"><Star className="w-8 h-8 mx-auto mb-2 text-amber-400" /><p className="font-bold text-sm text-amber-700">All features are unlocked!</p></div>
                  )}
                </div>
              </div>
            )}

            {/* Compare Tab */}
            {activeTab === 'compare' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider w-44">Feature</th>
                        {allPlans.map(p => (
                          <th key={p.id} className={`px-4 py-3 text-center ${p.id === plan.id ? 'bg-blue-50' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.badge_color }} />
                              <span className="font-black text-slate-800">{p.name}</span>
                              {p.id === plan.id && <span className="px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black rounded-full">CURRENT</span>}
                              <span className="font-bold text-slate-500">₹{p.price_monthly.toLocaleString('en-IN')}/mo</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-2 font-bold text-slate-500">Limits</td>
                        {allPlans.map(p => (
                          <td key={p.id} className={`px-4 py-2 text-center ${p.id === plan.id ? 'bg-blue-50' : ''}`}>
                            <div className="text-[10px] text-slate-500 space-y-0.5">
                              <div><strong>{fmt(p.max_students)}</strong> students</div>
                              <div><strong>{fmt(p.max_teachers)}</strong> teachers</div>
                              <div><strong>{fmt(p.max_branches)}</strong> branches</div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {FEATURE_DEFS.map((f, i) => {
                        const Icon = f.icon;
                        return (
                          <tr key={f.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-slate-400" /><span className="font-semibold text-slate-700">{f.label}</span></div>
                            </td>
                            {allPlans.map(p => (
                              <td key={p.id} className={`px-4 py-2 text-center ${p.id === plan.id ? 'bg-blue-50' : ''}`}>
                                {p.features?.[f.key]
                                  ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                  : <X className="w-4 h-4 text-slate-200 mx-auto" />}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td className="px-4 py-3" />
                        {allPlans.map((p, idx) => (
                          <td key={p.id} className={`px-4 py-3 text-center ${p.id === plan.id ? 'bg-blue-50' : ''}`}>
                            {idx > currentPlanIdx ? (
                              <div className="text-center">
                                <div className="text-[10px] text-blue-600 font-bold mb-1">Upgrade to {p.name}</div>
                                <div className="text-[10px] text-slate-500">Contact Admin</div>
                              </div>
                            ) : p.id === plan.id ? (
                              <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full">Current</span>
                            ) : null}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4" /> Billing History</div>
                  <span className="text-xs text-slate-400">{sub.invoices?.length || 0} invoices</span>
                </div>
                {(!sub.invoices || sub.invoices.length === 0) ? (
                  <div className="py-12 text-center text-slate-400"><FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="font-bold">No invoices yet</p></div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-5 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Invoice #</th>
                        <th className="px-5 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Period</th>
                        <th className="px-5 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Amount</th>
                        <th className="px-5 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Tax (18%)</th>
                        <th className="px-5 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Total</th>
                        <th className="px-5 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-5 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Payment Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sub.invoices.map(inv => {
                        const st = INV_STATUS[inv.status] || INV_STATUS.unpaid;
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-mono font-bold text-blue-700 text-xs">{inv.invoice_number}</td>
                            <td className="px-5 py-3 text-xs text-slate-600">{inv.billing_period_start} → {inv.billing_period_end}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-700">₹{inv.amount.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3 text-right text-slate-500">₹{inv.tax_amount.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3 text-right font-black text-slate-800">₹{inv.total_amount.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3 text-center"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>{st.label}</span></td>
                            <td className="px-5 py-3 text-xs text-slate-500">{inv.payment_date ? new Date(inv.payment_date).toLocaleDateString('en-IN') : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}

        {!sub && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Crown className="w-16 h-16 mx-auto mb-4 text-slate-200" />
            <h2 className="text-lg font-bold text-slate-700 mb-2">No Active Subscription</h2>
            <p className="text-sm text-slate-400 mb-4">Contact your super administrator to assign a subscription plan for your school.</p>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-sm font-semibold">
              <Shield className="w-4 h-4" /> Contact Support
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
