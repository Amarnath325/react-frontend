import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  DollarSign, Settings, Users, Plus, Edit2, Trash2, Loader2, X, ArrowLeft,
  Save, RefreshCw, Filter, ChevronRight, TrendingUp, BarChart3, AlertTriangle,
  CheckCircle, Clock, Zap, Download, Printer, Eye, ChevronDown, ChevronUp,
  Building2, CreditCard, FileText, Play, ShieldCheck, AlertCircle, Calendar,
  Layers, BookOpen, PlusCircle, MinusCircle, CircleDollarSign
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface PayrollSettings {
  currency_symbol: string; pay_cycle: string; pay_day: number; working_days_per_month: number;
  consider_attendance: boolean; pf_enabled: boolean; pf_employee_rate: number; pf_employer_rate: number;
  pf_wage_ceiling: number; esi_enabled: boolean; esi_employee_rate: number; esi_employer_rate: number;
  esi_wage_ceiling: number; tds_enabled: boolean; tds_calculation_method: string;
  professional_tax_enabled: boolean; professional_tax_monthly: number; professional_tax_state: string | null;
  lwf_enabled: boolean; lwf_employee: number; lwf_employer: number; lwf_frequency: string;
  overtime_policy: string; leave_encashment_enabled: boolean; rounding_policy: string; notes: string | null;
}
interface Component {
  id: number; name: string; code: string; component_type: string; calc_type: string;
  default_value: number; percentage_of: string | null; is_taxable: boolean; is_pf_applicable: boolean;
  is_esi_applicable: boolean; is_system: boolean; is_active: boolean; description: string | null; sort_order: number;
}
interface Structure {
  id: number; name: string; grade_level: string | null; applicable_to: string;
  min_ctc: number | null; max_ctc: number | null; is_active: boolean;
  description: string | null; component_count: number; staff_count: number;
}
interface StructureComponent {
  id: number; structure_id: number; component_id: number; calc_type: string; value: number;
  percentage_of: string | null; is_enabled: boolean; component_name: string; code: string; component_type: string;
}
interface StaffSalary {
  id: number; staff_id: number; staff_type: string; structure_id: number | null; gross_salary: number;
  ctc: number; effective_from: string; bank_name: string | null; bank_account: string | null;
  bank_ifsc: string | null; payment_mode: string; tds_monthly: number; remarks: string | null;
  structure_name: string | null; grade_level: string | null;
  name: string; employee_id: string; department: string | null; designation: string | null;
}
interface PayrollRun {
  id: number; month_year: string; month: number; year: number; status: string;
  total_staff: number; total_gross: number; total_deductions: number; total_net: number;
  total_employer_cost: number; disbursed_on: string | null; notes: string | null; processed_at: string | null;
}
interface PayrollDetail {
  id: number; staff_id: number; staff_type: string; staff_name: string; employee_id: string;
  department: string | null; designation: string | null; bank_account: string | null; bank_name: string | null;
  payment_mode: string; total_working_days: number; present_days: number; absent_days: number;
  leaves_paid: number; leaves_unpaid: number; attendance_factor: number; gross_salary: number;
  earnings_breakdown: { code: string; name: string; amount: number }[];
  deductions_breakdown: { code: string; name: string; amount: number }[];
  total_earnings: number; total_deductions: number; advance_deducted: number; net_salary: number;
  pf_employee: number; pf_employer: number; esi_employee: number; esi_employer: number;
  total_cost_to_company: number; payment_status: string; payment_date: string | null; remarks: string | null;
}
interface Advance {
  id: number; staff_id: number; staff_type: string; amount: number; repaid_amount: number;
  monthly_deduction: number; reason: string | null; advance_date: string; status: string;
  notes: string | null; name: string; employee_id: string; department: string | null;
}
interface Analytics {
  monthly_trend: PayrollRun[]; cost_by_dept: any[]; latest_run: PayrollRun | null;
  summary: any; advances: any; unassigned: number; all_staff: number;
}
interface StaffMember {
  id: number; staff_type: string; name: string; employee_id: string; department: string | null; designation: string | null;
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const fmt = (n: number, sym = '₹') => `${sym}${n?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`;

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:      { label: 'Draft',      color: 'text-slate-600',  bg: 'bg-slate-100',   icon: <Clock className="w-3 h-3" />         },
  finalized:  { label: 'Finalized',  color: 'text-sky-700',    bg: 'bg-sky-100',     icon: <ShieldCheck className="w-3 h-3" />   },
  disbursed:  { label: 'Disbursed',  color: 'text-emerald-700',bg: 'bg-emerald-100', icon: <CheckCircle className="w-3 h-3" />   },
};

const PAY_STATUS_CFG: Record<string, { color: string; bg: string }> = {
  pending: { color: 'text-amber-700',  bg: 'bg-amber-100' },
  paid:    { color: 'text-emerald-700',bg: 'bg-emerald-100' },
  hold:    { color: 'text-rose-700',   bg: 'bg-rose-100' },
};

const MONTHS_MAP = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TABS = [
  { key: 'overview',    label: '📊 Overview',         icon: BarChart3 },
  { key: 'settings',   label: '⚙️ Policies',          icon: Settings },
  { key: 'components', label: '🧩 Components',         icon: Layers },
  { key: 'structures', label: '🏗️ Structures',         icon: Building2 },
  { key: 'staff',      label: '👥 Staff Salary',        icon: Users },
  { key: 'runs',       label: '▶️ Payroll Runs',        icon: Play },
  { key: 'advances',   label: '💳 Advances',            icon: CreditCard },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */
function StatusBadge({ status, type = 'run' }: { status: string; type?: 'run' | 'pay' }) {
  const cfg = type === 'run' ? STATUS_CFG[status] : PAY_STATUS_CFG[status];
  if (!cfg) return <span className="text-[10px] text-slate-500 capitalize">{status}</span>;
  const rCfg = cfg as any;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${rCfg.color} ${rCfg.bg}`}>
      {rCfg.icon} {rCfg.label || status}
    </span>
  );
}

function Stat({ label, val, sub, color = 'text-slate-900', bg = 'bg-white' }: { label: string; val: string | number; sub?: string; color?: string; bg?: string }) {
  return (
    <div className={`${bg} border border-slate-200 rounded-xl p-3 shadow-sm`}>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-lg font-black ${color} leading-tight`}>{val}</p>
      {sub && <p className="text-[9px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function PayrollIntegration() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [currency, setCurrency] = useState('₹');

  /* Settings */
  const [settings, setSettings] = useState<Partial<PayrollSettings>>({});
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  /* Components */
  const [components, setComponents] = useState<Component[]>([]);
  const [compModal, setCompModal] = useState<any | null>(null);
  const [compBusy, setCompBusy] = useState(false);
  const [loadingComps, setLoadingComps] = useState(false);

  /* Structures */
  const [structList, setStructList] = useState<Structure[]>([]);
  const [structModal, setStructModal] = useState<any | null>(null);
  const [structBusy, setStructBusy] = useState(false);
  const [selectedStruct, setSelectedStruct] = useState<Structure | null>(null);
  const [structComps, setStructComps] = useState<StructureComponent[]>([]);
  const [savingStructComps, setSavingStructComps] = useState(false);

  /* Staff Salary */
  const [salaryList, setSalaryList] = useState<StaffSalary[]>([]);
  const [salaryTotal, setSalaryTotal] = useState(0);
  const [salaryPages, setSalaryPages] = useState(1);
  const [salaryPage, setSalaryPage] = useState(1);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [assignModal, setAssignModal] = useState<any | null>(null);
  const [assignBusy, setAssignBusy] = useState(false);

  /* Payroll Runs */
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [processModal, setProcessModal] = useState(false);
  const [processBusy, setProcessBusy] = useState(false);
  const [processForm, setProcessForm] = useState({ month_year: '', notes: '' });
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [runDetails, setRunDetails] = useState<PayrollDetail[]>([]);
  const [loadingRunDetails, setLoadingRunDetails] = useState(false);
  const [attModal, setAttModal] = useState<PayrollDetail | null>(null);
  const [attForm, setAttForm] = useState({ present_days: 0, leaves_paid: 0, leaves_unpaid: 0 });
  const [attBusy, setAttBusy] = useState(false);
  const [slipView, setSlipView] = useState<PayrollDetail & { month_year: string; month: number; year: number } | null>(null);

  /* Advances */
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [advTotal, setAdvTotal] = useState(0);
  const [advBusy, setAdvBusy] = useState(false);
  const [advModal, setAdvModal] = useState<any | null>(null);
  const [loadingAdv, setLoadingAdv] = useState(false);

  /* Analytics */
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  /* ─── Load Masters ─── */
  const loadMasters = useCallback(() => {
    api.get('/school/payroll/masters').then(res => {
      if (res.data.success) {
        setStaff(res.data.staff || []);
        setStructures(res.data.structures || []);
        if (res.data.settings) setCurrency(res.data.settings.currency_symbol || '₹');
      }
    });
  }, []);

  useEffect(() => { loadMasters(); }, [loadMasters]);

  /* ─── Load Settings ─── */
  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    const res = await api.get('/school/payroll/settings');
    if (res.data.success && res.data.settings) setSettings(res.data.settings);
    else setSettings({
      currency_symbol: '₹', pay_cycle: 'monthly', pay_day: 1, working_days_per_month: 26,
      pf_enabled: false, pf_employee_rate: 12, pf_employer_rate: 12, pf_wage_ceiling: 15000,
      esi_enabled: false, esi_employee_rate: 0.75, esi_employer_rate: 3.25, esi_wage_ceiling: 21000,
      tds_enabled: false, tds_calculation_method: 'manual', professional_tax_enabled: false,
      professional_tax_monthly: 200, lwf_enabled: false, lwf_employee: 6, lwf_employer: 12,
      lwf_frequency: 'monthly', overtime_policy: 'none', rounding_policy: 'none',
    });
    setLoadingSettings(false);
  }, []);

  useEffect(() => { if (tab === 'settings') loadSettings(); }, [tab, loadSettings]);

  /* ─── Save Settings ─── */
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsBusy(true);
    try {
      const res = await api.post('/school/payroll/settings', settings);
      if (res.data.success) { toast.success('Settings saved!'); setCurrency(settings.currency_symbol || '₹'); loadMasters(); }
    } catch { toast.error('Failed to save settings'); }
    finally { setSettingsBusy(false); }
  };

  /* ─── Load Components ─── */
  const loadComponents = useCallback(async () => {
    setLoadingComps(true);
    const res = await api.get('/school/payroll/components');
    if (res.data.success) setComponents(res.data.data || []);
    setLoadingComps(false);
  }, []);

  useEffect(() => { if (tab === 'components') loadComponents(); }, [tab, loadComponents]);

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompBusy(true);
    try {
      if (compModal.id) {
        await api.put(`/school/payroll/components/${compModal.id}`, compModal);
        toast.success('Component updated');
      } else {
        await api.post('/school/payroll/components', compModal);
        toast.success('Component created');
      }
      setCompModal(null); loadComponents();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCompBusy(false); }
  };

  /* ─── Load Structures ─── */
  const loadStructures = useCallback(async () => {
    const res = await api.get('/school/payroll/structures');
    if (res.data.success) { setStructList(res.data.data || []); setStructures(res.data.data || []); }
  }, []);

  useEffect(() => { if (tab === 'structures') loadStructures(); }, [tab, loadStructures]);

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setStructBusy(true);
    try {
      if (structModal.id) { await api.put(`/school/payroll/structures/${structModal.id}`, structModal); toast.success('Updated'); }
      else { await api.post('/school/payroll/structures', structModal); toast.success('Structure created'); }
      setStructModal(null); loadStructures();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setStructBusy(false); }
  };

  const openStructureComponents = async (s: Structure) => {
    setSelectedStruct(s);
    const [compRes, sRes] = await Promise.all([
      api.get('/school/payroll/components'),
      api.get(`/school/payroll/structures/${s.id}/components`),
    ]);
    if (compRes.data.success) setComponents(compRes.data.data || []);
    if (sRes.data.success) setStructComps(sRes.data.data || []);
  };

  const updateStructComp = (compId: number, field: string, val: any) => {
    setStructComps(prev => {
      const idx = prev.findIndex(x => x.component_id === compId);
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; }
      return prev;
    });
  };

  const toggleStructComp = (comp: Component) => {
    const exists = structComps.find(x => x.component_id === comp.id);
    if (exists) {
      setStructComps(prev => prev.filter(x => x.component_id !== comp.id));
    } else {
      setStructComps(prev => [...prev, {
        id: 0, structure_id: selectedStruct!.id, component_id: comp.id, calc_type: comp.calc_type,
        value: comp.default_value, percentage_of: comp.percentage_of, is_enabled: true,
        component_name: comp.name, code: comp.code, component_type: comp.component_type,
      }]);
    }
  };

  const saveStructureComponents = async () => {
    if (!selectedStruct) return;
    setSavingStructComps(true);
    try {
      await api.post(`/school/payroll/structures/${selectedStruct.id}/components`, {
        components: structComps.map(c => ({ component_id: c.component_id, calc_type: c.calc_type, value: c.value, percentage_of: c.percentage_of, is_enabled: c.is_enabled }))
      });
      toast.success('Structure components saved!');
      loadStructures();
    } catch { toast.error('Failed'); }
    finally { setSavingStructComps(false); }
  };

  /* ─── Load Staff Salary ─── */
  const loadSalary = useCallback(async () => {
    setLoadingSalary(true);
    const res = await api.get('/school/payroll/staff-salary', { params: { per_page: 20, page: salaryPage } });
    if (res.data.success) { setSalaryList(res.data.data || []); setSalaryTotal(res.data.meta?.total || 0); setSalaryPages(res.data.meta?.last_page || 1); }
    setLoadingSalary(false);
  }, [salaryPage]);

  useEffect(() => { if (tab === 'staff') loadSalary(); }, [tab, salaryPage, loadSalary]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignBusy(true);
    try {
      await api.post('/school/payroll/staff-salary', assignModal);
      toast.success('Salary assigned!');
      setAssignModal(null); loadSalary(); loadMasters();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAssignBusy(false); }
  };

  /* ─── Load Payroll Runs ─── */
  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    const res = await api.get('/school/payroll/runs');
    if (res.data.success) setRuns(res.data.data || []);
    setLoadingRuns(false);
  }, []);

  useEffect(() => { if (tab === 'runs') loadRuns(); }, [tab, loadRuns]);

  const handleProcessPayroll = async () => {
    if (!processForm.month_year) return;
    setProcessBusy(true);
    try {
      const res = await api.post('/school/payroll/runs/process', processForm);
      if (res.data.success) { toast.success(res.data.message); setProcessModal(false); loadRuns(); loadMasters(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessBusy(false); }
  };

  const openRun = async (run: PayrollRun) => {
    setSelectedRun(run);
    setLoadingRunDetails(true);
    const res = await api.get(`/school/payroll/runs/${run.id}`);
    if (res.data.success) setRunDetails(res.data.details || []);
    setLoadingRunDetails(false);
  };

  const handleUpdateStatus = async (runId: number, status: string) => {
    if (!confirm(`Mark payroll as "${status}"?`)) return;
    try {
      await api.patch(`/school/payroll/runs/${runId}/status`, { status, disbursed_on: status === 'disbursed' ? new Date().toISOString().slice(0, 10) : null });
      toast.success('Status updated');
      const updated = { ...selectedRun!, status };
      setSelectedRun(updated);
      loadRuns();
    } catch { toast.error('Failed'); }
  };

  const openAttModal = (d: PayrollDetail) => {
    setAttModal(d);
    setAttForm({ present_days: d.present_days, leaves_paid: d.leaves_paid, leaves_unpaid: d.leaves_unpaid });
  };

  const handleUpdateAttendance = async () => {
    if (!selectedRun || !attModal) return;
    setAttBusy(true);
    try {
      const res = await api.put(`/school/payroll/runs/${selectedRun.id}/detail/${attModal.id}`, attForm);
      if (res.data.success) { toast.success('Recalculated! Net: ' + fmt(res.data.net_salary, currency)); setAttModal(null); openRun(selectedRun); }
    } catch { toast.error('Failed'); }
    finally { setAttBusy(false); }
  };

  const openSlip = async (detailId: number) => {
    const res = await api.get(`/school/payroll/slip/${detailId}`);
    if (res.data.success) setSlipView(res.data.slip);
  };

  /* ─── Load Advances ─── */
  const loadAdvances = useCallback(async () => {
    setLoadingAdv(true);
    const res = await api.get('/school/payroll/advances');
    if (res.data.success) { setAdvances(res.data.data || []); setAdvTotal(res.data.meta?.total || 0); }
    setLoadingAdv(false);
  }, []);

  useEffect(() => { if (tab === 'advances') loadAdvances(); }, [tab, loadAdvances]);

  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvBusy(true);
    try {
      if (advModal.id) { await api.put(`/school/payroll/advances/${advModal.id}`, advModal); toast.success('Updated'); }
      else { await api.post('/school/payroll/advances', advModal); toast.success('Advance recorded'); }
      setAdvModal(null); loadAdvances();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAdvBusy(false); }
  };

  /* ─── Load Analytics ─── */
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    const res = await api.get('/school/payroll/analytics');
    if (res.data.success) setAnalytics(res.data);
    setLoadingAnalytics(false);
  }, []);

  useEffect(() => { if (tab === 'overview') loadAnalytics(); }, [tab, loadAnalytics]);

  /* ══════════════════════════════════════════════════════════
     SALARY SLIP VIEW
  ══════════════════════════════════════════════════════════ */
  if (slipView) {
    const s = slipView;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 no-print">
          <button onClick={() => setSlipView(null)} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-sm font-bold text-slate-700">Salary Slip — {s.staff_name} — {MONTHS_MAP[s.month]} {s.year}</h2>
          <button onClick={() => window.print()} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition">
            <Printer className="w-3.5 h-3.5" /> Print Slip
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden max-w-2xl mx-auto print-slip">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
            <h2 className="text-base font-black uppercase tracking-widest">SALARY SLIP</h2>
            <p className="text-indigo-200 text-xs">{MONTHS_MAP[s.month]} {s.year}</p>
          </div>
          {/* Staff Info */}
          <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-slate-100">
            {[
              { label: 'Name', val: s.staff_name }, { label: 'Employee ID', val: s.employee_id || '—' },
              { label: 'Department', val: s.department || '—' }, { label: 'Designation', val: s.designation || '—' },
              { label: 'Bank', val: s.bank_name || '—' }, { label: 'A/C No.', val: s.bank_account ? '....' + s.bank_account.slice(-4) : '—' },
              { label: 'Working Days', val: `${s.present_days} / ${s.total_working_days}` }, { label: 'Payment Mode', val: s.payment_mode },
            ].map(r => (
              <div key={r.label}><p className="text-[9px] text-slate-400 uppercase font-bold">{r.label}</p><p className="text-xs font-bold text-slate-800 capitalize">{r.val}</p></div>
            ))}
          </div>
          {/* Earnings & Deductions Table */}
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div>
              <div className="px-4 py-2.5 bg-emerald-50 border-b border-slateald-100"><p className="text-[10px] font-black text-emerald-800 uppercase">Earnings</p></div>
              {(s.earnings_breakdown || []).map(e => (
                <div key={e.code} className="flex justify-between px-4 py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-600">{e.name}</span><span className="font-bold text-slate-800">{fmt(e.amount, currency)}</span>
                </div>
              ))}
              {s.earnings_breakdown?.length === 0 && (
                <div className="flex justify-between px-4 py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-600">Gross Salary</span><span className="font-bold text-slate-800">{fmt(s.gross_salary, currency)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-2.5 bg-emerald-50 text-xs font-black text-emerald-700">
                <span>Total Earnings</span><span>{fmt(s.total_earnings, currency)}</span>
              </div>
            </div>
            <div>
              <div className="px-4 py-2.5 bg-rose-50 border-b border-slate-100"><p className="text-[10px] font-black text-rose-800 uppercase">Deductions</p></div>
              {(s.deductions_breakdown || []).map(d => (
                <div key={d.code} className="flex justify-between px-4 py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-600">{d.name}</span><span className="font-bold text-slate-800">{fmt(d.amount, currency)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2.5 bg-rose-50 text-xs font-black text-rose-700">
                <span>Total Deductions</span><span>{fmt(s.total_deductions, currency)}</span>
              </div>
            </div>
          </div>
          {/* Net Salary footer */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 flex items-center justify-between">
            <p className="text-white font-black text-sm uppercase tracking-wider">Net Salary</p>
            <p className="text-white font-black text-xl">{fmt(s.net_salary, currency)}</p>
          </div>
          {/* Employer side */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>PF (Employer): <strong>{fmt(s.pf_employer, currency)}</strong></span>
            <span>ESI (Employer): <strong>{fmt(s.esi_employer, currency)}</strong></span>
            <span>CTC: <strong className="text-slate-700">{fmt(s.total_cost_to_company, currency)}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     RUN DETAIL VIEW
  ══════════════════════════════════════════════════════════ */
  if (selectedRun) {
    const run = selectedRun;
    const sc = STATUS_CFG[run.status];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedRun(null); setRunDetails([]); }} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-sm font-bold text-slate-900">Payroll Run — {MONTHS_MAP[run.month]} {run.year}</h2>
          <StatusBadge status={run.status} />
          <div className="flex gap-1.5 ml-auto flex-wrap">
            {run.status === 'draft' && (
              <button onClick={() => handleUpdateStatus(run.id, 'finalized')} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition">
                <ShieldCheck className="w-3.5 h-3.5" /> Finalize
              </button>
            )}
            {run.status === 'finalized' && (
              <button onClick={() => handleUpdateStatus(run.id, 'disbursed')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition">
                <CheckCircle className="w-3.5 h-3.5" /> Mark Disbursed
              </button>
            )}
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Total Staff" val={run.total_staff} bg="bg-indigo-50" color="text-indigo-700" />
          <Stat label="Total Gross" val={fmt(run.total_gross, currency)} bg="bg-sky-50" color="text-sky-700" />
          <Stat label="Total Deductions" val={fmt(run.total_deductions, currency)} bg="bg-rose-50" color="text-rose-700" />
          <Stat label="Net Payable" val={fmt(run.total_net, currency)} bg="bg-emerald-50" color="text-emerald-700" />
        </div>

        {/* Details Table */}
        {loadingRunDetails ? (
          <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Staff Salary Breakdown ({runDetails.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] text-slate-400 font-black uppercase">
                    <th className="px-3 py-2.5">Staff</th>
                    <th className="px-3 py-2.5">Days</th>
                    <th className="px-3 py-2.5">Gross</th>
                    <th className="px-3 py-2.5">Deductions</th>
                    <th className="px-3 py-2.5">Net Salary</th>
                    <th className="px-3 py-2.5">CTC</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {runDetails.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-800">{d.staff_name}</p>
                        <p className="text-[9px] text-slate-400">{d.employee_id} · {d.department}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`font-bold ${d.present_days < d.total_working_days ? 'text-amber-700' : 'text-slate-700'}`}>{d.present_days}/{d.total_working_days}</span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-700">{fmt(d.total_earnings, currency)}</td>
                      <td className="px-3 py-2.5 font-bold text-rose-600">{fmt(d.total_deductions, currency)}</td>
                      <td className="px-3 py-2.5 font-black text-emerald-700">{fmt(d.net_salary, currency)}</td>
                      <td className="px-3 py-2.5 text-slate-500">{fmt(d.total_cost_to_company, currency)}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={d.payment_status} type="pay" /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          {run.status !== 'disbursed' && (
                            <button onClick={() => openAttModal(d)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600" title="Edit Attendance"><Edit2 className="w-3 h-3" /></button>
                          )}
                          <button onClick={() => openSlip(d.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="View Salary Slip"><Eye className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     STRUCTURE COMPONENTS EDITOR
  ══════════════════════════════════════════════════════════ */
  if (selectedStruct) {
    const earnings = components.filter(c => c.component_type === 'earning' && c.is_active);
    const deductions = components.filter(c => c.component_type === 'deduction' && c.is_active);
    const renderCompRow = (comp: Component) => {
      const sc = structComps.find(x => x.component_id === comp.id);
      const enabled = !!sc;
      return (
        <div key={comp.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${enabled ? 'bg-white border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
          <input type="checkbox" checked={enabled} onChange={() => toggleStructComp(comp)} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold truncate ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>{comp.name}</p>
            <p className="text-[9px] text-slate-400 font-mono">{comp.code}</p>
          </div>
          {enabled && sc && (
            <div className="flex items-center gap-2 shrink-0">
              <select value={sc.calc_type} onChange={e => updateStructComp(comp.id, 'calc_type', e.target.value)}
                className="px-1.5 py-1 border border-slate-200 rounded-lg text-[10px] bg-white focus:outline-none focus:border-indigo-400 w-24">
                <option value="fixed">Fixed</option>
                <option value="percentage">%</option>
              </select>
              <input type="number" value={sc.value} min="0" onChange={e => updateStructComp(comp.id, 'value', parseFloat(e.target.value))}
                className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:border-indigo-400" />
              {sc.calc_type === 'percentage' && (
                <input type="text" value={sc.percentage_of || ''} onChange={e => updateStructComp(comp.id, 'percentage_of', e.target.value)}
                  placeholder="of code..." className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-indigo-400" />
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedStruct(null)} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-sm font-bold text-slate-900">Structure Components — {selectedStruct.name}</h2>
          <button onClick={saveStructureComponents} disabled={savingStructComps} className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50">
            {savingStructComps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Components
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50 border-b border-slate-100"><p className="text-xs font-black text-emerald-800 uppercase">Earnings ({structComps.filter(x => components.find(c => c.id === x.component_id)?.component_type === 'earning').length})</p></div>
            <div className="p-3 space-y-2">{earnings.map(renderCompRow)}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-rose-50 border-b border-slate-100"><p className="text-xs font-black text-rose-800 uppercase">Deductions ({structComps.filter(x => components.find(c => c.id === x.component_id)?.component_type === 'deduction').length})</p></div>
            <div className="p-3 space-y-2">{deductions.map(renderCompRow)}</div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     MAIN VIEW
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CircleDollarSign className="w-5 h-5" /></span>
            Payroll Integration Gateway
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Full salary management — components, structures, processing, slips, advances, and analytics.</p>
        </div>
        {tab === 'runs' && (
          <button onClick={() => { setProcessForm({ month_year: new Date().toISOString().slice(0, 7), notes: '' }); setProcessModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
            <Play className="w-3.5 h-3.5" /> Process Monthly Payroll
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === t.key ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <button onClick={loadAnalytics} className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:underline"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
          {loadingAnalytics ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div>
          ) : analytics && (
            <div className="space-y-4">
              {/* Top KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Total Payroll Runs" val={analytics.summary?.total_runs || 0} bg="bg-indigo-50" color="text-indigo-700" />
                <Stat label="Lifetime Net Paid" val={fmt(analytics.summary?.lifetime_net || 0, currency)} bg="bg-emerald-50" color="text-emerald-700" />
                <Stat label="Staff w/o Salary" val={analytics.unassigned || 0} sub={`of ${analytics.all_staff} total`} bg="bg-rose-50" color="text-rose-700" />
                <Stat label="Advance Outstanding" val={fmt(analytics.advances?.outstanding || 0, currency)} sub={`${analytics.advances?.cnt || 0} active advances`} bg="bg-amber-50" color="text-amber-700" />
              </div>

              {/* Monthly Trend Bar Chart */}
              {analytics.monthly_trend?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Monthly Payroll Trend (Net Salary)</h3>
                  <div className="flex items-end gap-2 h-32">
                    {[...analytics.monthly_trend].reverse().map(r => {
                      const max = Math.max(...analytics.monthly_trend.map(x => x.total_net), 1);
                      const h = Math.max(4, (r.total_net / max) * 110);
                      return (
                        <div key={r.month_year} className="flex-1 flex flex-col items-center gap-1">
                          <p className="text-[8px] text-indigo-700 font-black">{fmt(r.total_net / 1000, '').replace(',', '')}k</p>
                          <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-500" style={{ height: `${h}px` }} />
                          <p className="text-[7px] text-slate-400">{SHORT_MONTHS[r.month]}</p>
                          <p className="text-[7px] text-slate-300">{r.year}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cost by Dept */}
              {analytics.cost_by_dept?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-emerald-500" /> Cost by Department (Latest Payroll)</h3>
                  <div className="space-y-2">
                    {analytics.cost_by_dept.map((d: any) => {
                      const max = Math.max(...analytics.cost_by_dept.map((x: any) => x.total_ctc), 1);
                      return (
                        <div key={d.department} className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-700 w-36 truncate shrink-0">{d.department}</span>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${(d.total_ctc / max) * 100}%` }} />
                          </div>
                          <div className="flex gap-3 text-[9px] shrink-0">
                            <span className="text-slate-600 font-bold">{d.staff_count} staff</span>
                            <span className="text-emerald-700 font-bold">{fmt(d.total_net, currency)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {tab === 'settings' && (
        <div className="space-y-4">
          {loadingSettings ? <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div> : (
            <form onSubmit={saveSettings} className="space-y-4">
              {/* General */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-slate-500" /> General Settings</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Currency Symbol</label>
                    <input value={settings.currency_symbol || '₹'} onChange={e => setSettings(s => ({ ...s, currency_symbol: e.target.value }))} maxLength={3} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pay Cycle</label>
                    <select value={settings.pay_cycle || 'monthly'} onChange={e => setSettings(s => ({ ...s, pay_cycle: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                      <option value="monthly">Monthly</option><option value="biweekly">Bi-weekly</option></select></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pay Day (of month)</label>
                    <input type="number" min={1} max={31} value={settings.pay_day || 1} onChange={e => setSettings(s => ({ ...s, pay_day: parseInt(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Working Days / Month</label>
                    <input type="number" min={1} max={31} value={settings.working_days_per_month || 26} onChange={e => setSettings(s => ({ ...s, working_days_per_month: parseInt(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={!!settings.consider_attendance} onChange={e => setSettings(s => ({ ...s, consider_attendance: e.target.checked }))} />
                    Consider Attendance for Pro-rata Salary Deduction
                  </label>
                </div>
              </div>

              {/* PF */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={!!settings.pf_enabled} onChange={e => setSettings(s => ({ ...s, pf_enabled: e.target.checked }))} />
                    <span className="text-sm">🏦 Provident Fund (PF)</span>
                  </label>
                </div>
                {settings.pf_enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee Rate (%)</label>
                      <input type="number" step="0.01" value={settings.pf_employee_rate || 12} onChange={e => setSettings(s => ({ ...s, pf_employee_rate: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employer Rate (%)</label>
                      <input type="number" step="0.01" value={settings.pf_employer_rate || 12} onChange={e => setSettings(s => ({ ...s, pf_employer_rate: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wage Ceiling (₹)</label>
                      <input type="number" value={settings.pf_wage_ceiling || 15000} onChange={e => setSettings(s => ({ ...s, pf_wage_ceiling: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                  </div>
                )}
              </div>

              {/* ESI */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={!!settings.esi_enabled} onChange={e => setSettings(s => ({ ...s, esi_enabled: e.target.checked }))} />
                    <span className="text-sm">🏥 ESI (Employee State Insurance)</span>
                  </label>
                </div>
                {settings.esi_enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee Rate (%)</label>
                      <input type="number" step="0.01" value={settings.esi_employee_rate || 0.75} onChange={e => setSettings(s => ({ ...s, esi_employee_rate: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employer Rate (%)</label>
                      <input type="number" step="0.01" value={settings.esi_employer_rate || 3.25} onChange={e => setSettings(s => ({ ...s, esi_employer_rate: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wage Ceiling (₹)</label>
                      <input type="number" value={settings.esi_wage_ceiling || 21000} onChange={e => setSettings(s => ({ ...s, esi_wage_ceiling: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                  </div>
                )}
              </div>

              {/* TDS + PT + LWF */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Other Statutory Deductions</h3>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={!!settings.tds_enabled} onChange={e => setSettings(s => ({ ...s, tds_enabled: e.target.checked }))} />
                  🧾 TDS (Tax Deduction at Source) — Manual amount per staff
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={!!settings.professional_tax_enabled} onChange={e => setSettings(s => ({ ...s, professional_tax_enabled: e.target.checked }))} />
                    💼 Professional Tax
                  </label>
                  {settings.professional_tax_enabled && (
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly Amount:</label>
                      <input type="number" value={settings.professional_tax_monthly || 200} onChange={e => setSettings(s => ({ ...s, professional_tax_monthly: parseFloat(e.target.value) }))}
                        className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={!!settings.lwf_enabled} onChange={e => setSettings(s => ({ ...s, lwf_enabled: e.target.checked }))} />
                    🛠️ LWF (Labour Welfare Fund)
                  </label>
                  {settings.lwf_enabled && (
                    <div className="flex gap-2 items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Emp:</label>
                      <input type="number" step="0.01" value={settings.lwf_employee || 6} onChange={e => setSettings(s => ({ ...s, lwf_employee: parseFloat(e.target.value) }))} className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400" />
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Employer:</label>
                      <input type="number" step="0.01" value={settings.lwf_employer || 12} onChange={e => setSettings(s => ({ ...s, lwf_employer: parseFloat(e.target.value) }))} className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={settingsBusy} className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50">
                  {settingsBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Payroll Settings
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ═══ COMPONENTS TAB ═══ */}
      {tab === 'components' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setCompModal({ component_type: 'earning', calc_type: 'fixed', default_value: 0, is_taxable: false, is_pf_applicable: false, is_esi_applicable: false })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
              <Plus className="w-3.5 h-3.5" /> Add Component
            </button>
          </div>
          {loadingComps ? <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['earning', 'deduction'].map(ct => (
                <div key={ct} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className={`px-4 py-3 border-b border-slate-100 ${ct === 'earning' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${ct === 'earning' ? 'text-emerald-800' : 'text-rose-800'}`}>{ct === 'earning' ? '⬆️ Earnings' : '⬇️ Deductions'}</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {components.filter(c => c.component_type === ct).map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-800">{c.name}</p>
                            <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1 rounded">{c.code}</span>
                            {c.is_system && <span className="text-[8px] text-indigo-600 bg-indigo-50 px-1 rounded font-bold">SYSTEM</span>}
                            {!c.is_active && <span className="text-[8px] text-slate-400 bg-slate-100 px-1 rounded">inactive</span>}
                          </div>
                          <div className="flex gap-2 text-[9px] text-slate-400 mt-0.5">
                            <span className="capitalize">{c.calc_type}</span>
                            <span>·</span>
                            <span>{c.calc_type === 'percentage' ? `${c.default_value}% of ${c.percentage_of || 'gross'}` : fmt(c.default_value, currency)}</span>
                            {c.is_pf_applicable  && <span className="text-sky-600">PF</span>}
                            {c.is_esi_applicable && <span className="text-emerald-600">ESI</span>}
                            {c.is_taxable        && <span className="text-amber-600">Taxable</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setCompModal(c)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                          {!c.is_system && (
                            <button onClick={async () => {
                              if (!confirm('Delete component?')) return;
                              await api.delete(`/school/payroll/components/${c.id}`);
                              toast.success('Deleted'); loadComponents();
                            }} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                    {components.filter(c => c.component_type === ct).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">No {ct}s defined yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ STRUCTURES TAB ═══ */}
      {tab === 'structures' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setStructModal({ applicable_to: 'both', is_active: true })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
              <Plus className="w-3.5 h-3.5" /> Create Structure
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {structList.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:shadow-md hover:border-indigo-300 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{s.name}</h3>
                    {s.grade_level && <p className="text-[10px] text-slate-400">Grade: {s.grade_level}</p>}
                    <p className="text-[9px] text-slate-400 capitalize">{s.applicable_to.replace('_', ' ')}</p>
                  </div>
                  {!s.is_active && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Inactive</span>}
                </div>
                <div className="flex gap-3 text-[10px] text-slate-400 mb-3">
                  {s.min_ctc && <span>Min CTC: <strong className="text-slate-700">{fmt(s.min_ctc, currency)}</strong></span>}
                  {s.max_ctc && <span>Max: <strong className="text-slate-700">{fmt(s.max_ctc, currency)}</strong></span>}
                </div>
                <div className="flex gap-2 text-[10px] text-slate-500 mb-3">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">{s.component_count} Components</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">{s.staff_count} Staff</span>
                </div>
                <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                  <button onClick={() => openStructureComponents(s)} className="flex-1 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-center">
                    🧩 Manage Components
                  </button>
                  <button onClick={() => setStructModal(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                  {s.staff_count === 0 && (
                    <button onClick={async () => {
                      if (!confirm('Delete structure?')) return;
                      const res = await api.delete(`/school/payroll/structures/${s.id}`);
                      if (res.data.success) { toast.success('Deleted'); loadStructures(); }
                      else toast.error(res.data.message);
                    }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
            ))}
            {structList.length === 0 && (
              <div className="col-span-3 text-center py-14 bg-white border border-slate-200 rounded-2xl">
                <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No salary structures defined. Create one to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ STAFF SALARY TAB ═══ */}
      {tab === 'staff' && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <button onClick={() => setAssignModal({ staff_type: 'Teacher', payment_mode: 'bank', gross_salary: 0, ctc: 0, tds_monthly: 0, effective_from: new Date().toISOString().slice(0, 10) })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
              <Plus className="w-3.5 h-3.5" /> Assign Salary
            </button>
          </div>
          {loadingSalary ? <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div> : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] text-slate-400 font-black uppercase">
                      <th className="px-3 py-2.5">Staff</th>
                      <th className="px-3 py-2.5">Structure</th>
                      <th className="px-3 py-2.5">Gross</th>
                      <th className="px-3 py-2.5">CTC</th>
                      <th className="px-3 py-2.5">Bank</th>
                      <th className="px-3 py-2.5">TDS</th>
                      <th className="px-3 py-2.5">Effective</th>
                      <th className="px-3 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salaryList.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-[9px] text-slate-400">{s.employee_id} · {s.department}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          {s.structure_name ? <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{s.structure_name}</span> : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-3 py-2.5 font-black text-slate-700">{fmt(s.gross_salary, currency)}</td>
                        <td className="px-3 py-2.5 font-bold text-emerald-700">{fmt(s.ctc, currency)}</td>
                        <td className="px-3 py-2.5">
                          {s.bank_account ? <div><p className="text-slate-700 font-bold text-[10px]">{s.bank_name}</p><p className="text-slate-400 text-[9px]">...{s.bank_account.slice(-4)}</p></div> : <span className="text-slate-400">{s.payment_mode}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-amber-700 font-bold">{s.tds_monthly > 0 ? fmt(s.tds_monthly, currency) : '—'}</td>
                        <td className="px-3 py-2.5 text-slate-500">{s.effective_from}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <button onClick={() => setAssignModal({ ...s, staff_id: s.staff_id, effective_from: new Date().toISOString().slice(0, 10) })}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Reassign (create new version)"><Plus className="w-3.5 h-3.5" /></button>
                            <button onClick={async () => {
                              if (!confirm('Remove salary assignment?')) return;
                              await api.delete(`/school/payroll/staff-salary/${s.id}`);
                              toast.success('Removed'); loadSalary();
                            }} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {salaryList.length === 0 && <div className="text-center py-10 text-sm text-slate-400">No salary assignments found.</div>}
              {salaryPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Page {salaryPage} of {salaryPages} · {salaryTotal} records</span>
                  <div className="flex gap-2">
                    <button disabled={salaryPage <= 1} onClick={() => setSalaryPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition">← Prev</button>
                    <button disabled={salaryPage >= salaryPages} onClick={() => setSalaryPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition">Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ PAYROLL RUNS TAB ═══ */}
      {tab === 'runs' && (
        <div className="space-y-3">
          {loadingRuns ? <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {runs.map(run => {
                const sc = STATUS_CFG[run.status] || STATUS_CFG.draft;
                return (
                  <div key={run.id} onClick={() => openRun(run)}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:shadow-md hover:border-indigo-300 transition cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <div><h3 className="text-sm font-black text-slate-900">{MONTHS_MAP[run.month]} {run.year}</h3><p className="text-[10px] text-slate-400">{run.total_staff} staff processed</p></div>
                      <StatusBadge status={run.status} />
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs"><span className="text-slate-400">Gross</span><span className="font-bold text-slate-700">{fmt(run.total_gross, currency)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-400">Deductions</span><span className="font-bold text-rose-600">{fmt(run.total_deductions, currency)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Net Payable</span><span className="font-black text-emerald-700 text-sm">{fmt(run.total_net, currency)}</span></div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400">{run.disbursed_on ? `Disbursed: ${run.disbursed_on}` : run.processed_at ? `Processed: ${new Date(run.processed_at).toLocaleDateString('en-IN')}` : 'Not processed'}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition" />
                    </div>
                  </div>
                );
              })}
              {runs.length === 0 && (
                <div className="col-span-3 text-center py-14 bg-white border border-slate-200 rounded-2xl">
                  <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No payroll runs yet. Click "Process Monthly Payroll" to start.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ ADVANCES TAB ═══ */}
      {tab === 'advances' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setAdvModal({ staff_type: 'Teacher', advance_date: new Date().toISOString().slice(0, 10), amount: 0, monthly_deduction: 0 })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
              <Plus className="w-3.5 h-3.5" /> Record Advance
            </button>
          </div>
          {loadingAdv ? <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div> : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] text-slate-400 font-black uppercase">
                    <th className="px-3 py-2.5">Staff</th>
                    <th className="px-3 py-2.5">Advance Amount</th>
                    <th className="px-3 py-2.5">Repaid</th>
                    <th className="px-3 py-2.5">Outstanding</th>
                    <th className="px-3 py-2.5">Monthly Deduction</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {advances.map(a => {
                    const outstanding = a.amount - a.repaid_amount;
                    const repaidPct = a.amount > 0 ? Math.round((a.repaid_amount / a.amount) * 100) : 0;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5"><p className="font-bold text-slate-800">{a.name}</p><p className="text-[9px] text-slate-400">{a.employee_id} · {a.department}</p></td>
                        <td className="px-3 py-2.5 font-black text-slate-700">{fmt(a.amount, currency)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${repaidPct}%` }} /></div>
                            <span className="text-emerald-700 font-bold">{fmt(a.repaid_amount, currency)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-rose-700">{fmt(outstanding, currency)}</td>
                        <td className="px-3 py-2.5 text-amber-700 font-bold">{a.monthly_deduction > 0 ? fmt(a.monthly_deduction, currency) : '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${a.status === 'active' ? 'text-amber-700 bg-amber-100' : a.status === 'fully_repaid' ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-100'}`}>{a.status.replace('_', ' ')}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{a.advance_date}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <button onClick={() => setAdvModal(a)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={async () => { if (!confirm('Delete advance?')) return; await api.delete(`/school/payroll/advances/${a.id}`); toast.success('Deleted'); loadAdvances(); }} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {advances.length === 0 && <div className="text-center py-10 text-sm text-slate-400">No advances recorded.</div>}
            </div>
          )}
        </div>
      )}

      {/* ══════════ MODALS ══════════ */}

      {/* Component Modal */}
      {compModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">{compModal.id ? 'Edit' : 'Add'} Salary Component</h3>
              <button onClick={() => setCompModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveComponent} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name *</label>
                  <input required value={compModal.name || ''} onChange={e => setCompModal((m: any) => ({ ...m, name: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Code * (e.g. HRA)</label>
                  <input required value={compModal.code || ''} onChange={e => setCompModal((m: any) => ({ ...m, code: e.target.value.toUpperCase() }))} placeholder="BASIC" className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 font-mono" disabled={!!compModal.id} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                  <select value={compModal.component_type} onChange={e => setCompModal((m: any) => ({ ...m, component_type: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400" disabled={!!compModal.id}>
                    <option value="earning">Earning</option><option value="deduction">Deduction</option></select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Calc Type</label>
                  <select value={compModal.calc_type} onChange={e => setCompModal((m: any) => ({ ...m, calc_type: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    <option value="fixed">Fixed (₹)</option><option value="percentage">Percentage (%)</option></select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Default Value</label>
                  <input type="number" step="0.01" value={compModal.default_value || 0} onChange={e => setCompModal((m: any) => ({ ...m, default_value: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              {compModal.calc_type === 'percentage' && (
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Percentage of (Component Code)</label>
                  <input value={compModal.percentage_of || ''} onChange={e => setCompModal((m: any) => ({ ...m, percentage_of: e.target.value.toUpperCase() }))} placeholder="BASIC" className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 font-mono" /></div>
              )}
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={!!compModal.is_taxable} onChange={e => setCompModal((m: any) => ({ ...m, is_taxable: e.target.checked }))} /> Taxable</label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={!!compModal.is_pf_applicable} onChange={e => setCompModal((m: any) => ({ ...m, is_pf_applicable: e.target.checked }))} /> PF Applicable</label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={!!compModal.is_esi_applicable} onChange={e => setCompModal((m: any) => ({ ...m, is_esi_applicable: e.target.checked }))} /> ESI Applicable</label>
                {compModal.id && <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={!!compModal.is_active} onChange={e => setCompModal((m: any) => ({ ...m, is_active: e.target.checked }))} /> Active</label>}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button type="button" onClick={() => setCompModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={compBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50">
                  {compBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Structure Modal */}
      {structModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">{structModal.id ? 'Edit' : 'Create'} Salary Structure</h3>
              <button onClick={() => setStructModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveStructure} className="p-5 space-y-3">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Structure Name *</label>
                <input required value={structModal.name || ''} onChange={e => setStructModal((m: any) => ({ ...m, name: e.target.value }))} placeholder="e.g. Teacher Grade A" className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grade Level</label>
                  <input value={structModal.grade_level || ''} onChange={e => setStructModal((m: any) => ({ ...m, grade_level: e.target.value }))} placeholder="e.g. L1, PGT, TGT" className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Applicable To</label>
                  <select value={structModal.applicable_to || 'both'} onChange={e => setStructModal((m: any) => ({ ...m, applicable_to: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    <option value="both">Both</option><option value="teacher">Teachers Only</option><option value="non_teaching">Non-Teaching Only</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min CTC</label>
                  <input type="number" min={0} value={structModal.min_ctc || ''} onChange={e => setStructModal((m: any) => ({ ...m, min_ctc: e.target.value ? parseFloat(e.target.value) : null }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max CTC</label>
                  <input type="number" min={0} value={structModal.max_ctc || ''} onChange={e => setStructModal((m: any) => ({ ...m, max_ctc: e.target.value ? parseFloat(e.target.value) : null }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea rows={2} value={structModal.description || ''} onChange={e => setStructModal((m: any) => ({ ...m, description: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" /></div>
              {structModal.id && (
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-bold">
                  <input type="checkbox" checked={!!structModal.is_active} onChange={e => setStructModal((m: any) => ({ ...m, is_active: e.target.checked }))} /> Active
                </label>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button type="button" onClick={() => setStructModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={structBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50">
                  {structBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Salary Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold">Assign / Update Salary</h3>
              <button onClick={() => setAssignModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Type *</label>
                  <select value={assignModal.staff_type} onChange={e => setAssignModal((m: any) => ({ ...m, staff_type: e.target.value, staff_id: null }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    <option value="Teacher">Teacher</option><option value="NonTeaching">Non-Teaching</option></select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Member *</label>
                  <select required value={assignModal.staff_id || ''} onChange={e => setAssignModal((m: any) => ({ ...m, staff_id: parseInt(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    <option value="">Select staff...</option>
                    {staff.filter(s => s.staff_type === assignModal.staff_type).map(s => <option key={s.id} value={s.id}>{s.name} ({s.employee_id})</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Salary Structure</label>
                  <select value={assignModal.structure_id || ''} onChange={e => setAssignModal((m: any) => ({ ...m, structure_id: e.target.value ? parseInt(e.target.value) : null }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    <option value="">No structure (custom)</option>
                    {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Effective From *</label>
                  <input type="date" required value={assignModal.effective_from || ''} onChange={e => setAssignModal((m: any) => ({ ...m, effective_from: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gross Salary *</label>
                  <input type="number" required min={0} step={0.01} value={assignModal.gross_salary || 0} onChange={e => setAssignModal((m: any) => ({ ...m, gross_salary: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CTC (Cost to Company)</label>
                  <input type="number" min={0} step={0.01} value={assignModal.ctc || 0} onChange={e => setAssignModal((m: any) => ({ ...m, ctc: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Mode</label>
                  <select value={assignModal.payment_mode || 'bank'} onChange={e => setAssignModal((m: any) => ({ ...m, payment_mode: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    <option value="bank">Bank Transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option></select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TDS/Month</label>
                  <input type="number" min={0} step={0.01} value={assignModal.tds_monthly || 0} onChange={e => setAssignModal((m: any) => ({ ...m, tds_monthly: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Name</label>
                  <input value={assignModal.bank_name || ''} onChange={e => setAssignModal((m: any) => ({ ...m, bank_name: e.target.value }))} placeholder="SBI / HDFC..." className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Account No.</label>
                  <input value={assignModal.bank_account || ''} onChange={e => setAssignModal((m: any) => ({ ...m, bank_account: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">IFSC Code</label>
                  <input value={assignModal.bank_ifsc || ''} onChange={e => setAssignModal((m: any) => ({ ...m, bank_ifsc: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 font-mono" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks</label>
                <textarea rows={2} value={assignModal.remarks || ''} onChange={e => setAssignModal((m: any) => ({ ...m, remarks: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button type="button" onClick={() => setAssignModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={assignBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50">
                  {assignBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />} Assign Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Payroll Modal */}
      {processModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2"><Play className="w-4 h-4 text-emerald-500" /> Process Monthly Payroll</h3>
              <button onClick={() => setProcessModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ This will automatically calculate salaries for all staff with active salary assignments. You can adjust attendance and other details after processing.
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Month / Year *</label>
                <input type="month" value={processForm.month_year} onChange={e => setProcessForm(f => ({ ...f, month_year: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes</label>
                <textarea rows={2} value={processForm.notes} onChange={e => setProcessForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes for this payroll run..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setProcessModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleProcessPayroll} disabled={processBusy || !processForm.month_year} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50">
                  {processBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run Payroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Edit Modal */}
      {attModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">Adjust Attendance</h3>
              <button onClick={() => setAttModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs font-bold text-slate-700">{attModal.staff_name}</p>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Present Days (of {attModal.total_working_days})</label>
                <input type="number" min={0} max={attModal.total_working_days} value={attForm.present_days} onChange={e => setAttForm(f => ({ ...f, present_days: parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Paid Leaves</label>
                  <input type="number" min={0} value={attForm.leaves_paid} onChange={e => setAttForm(f => ({ ...f, leaves_paid: parseInt(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unpaid Leaves</label>
                  <input type="number" min={0} value={attForm.leaves_unpaid} onChange={e => setAttForm(f => ({ ...f, leaves_unpaid: parseInt(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button onClick={() => setAttModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleUpdateAttendance} disabled={attBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50">
                  {attBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Recalculate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {advModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">{advModal.id ? 'Update' : 'Record'} Salary Advance</h3>
              <button onClick={() => setAdvModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveAdvance} className="p-5 space-y-3">
              {!advModal.id && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Type *</label>
                    <select value={advModal.staff_type} onChange={e => setAdvModal((m: any) => ({ ...m, staff_type: e.target.value, staff_id: null }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                      <option value="Teacher">Teacher</option><option value="NonTeaching">Non-Teaching</option></select></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Member *</label>
                    <select required value={advModal.staff_id || ''} onChange={e => setAdvModal((m: any) => ({ ...m, staff_id: parseInt(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                      <option value="">Select...</option>
                      {staff.filter(s => s.staff_type === advModal.staff_type).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {!advModal.id && <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Advance Amount *</label>
                  <input type="number" required min={1} value={advModal.amount || ''} onChange={e => setAdvModal((m: any) => ({ ...m, amount: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>}
                {!advModal.id && <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Advance Date *</label>
                  <input type="date" required value={advModal.advance_date || ''} onChange={e => setAdvModal((m: any) => ({ ...m, advance_date: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>}
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Monthly Deduction</label>
                  <input type="number" min={0} step={0.01} value={advModal.monthly_deduction || 0} onChange={e => setAdvModal((m: any) => ({ ...m, monthly_deduction: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                {advModal.id && <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount Repaid So Far</label>
                  <input type="number" min={0} step={0.01} value={advModal.repaid_amount || 0} onChange={e => setAdvModal((m: any) => ({ ...m, repaid_amount: parseFloat(e.target.value) }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>}
                {advModal.id && <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select value={advModal.status || 'active'} onChange={e => setAdvModal((m: any) => ({ ...m, status: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    <option value="active">Active</option><option value="fully_repaid">Fully Repaid</option><option value="waived">Waived</option></select></div>}
              </div>
              {!advModal.id && <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason</label>
                <textarea rows={2} value={advModal.reason || ''} onChange={e => setAdvModal((m: any) => ({ ...m, reason: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" /></div>}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button type="button" onClick={() => setAdvModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={advBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50">
                  {advBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
