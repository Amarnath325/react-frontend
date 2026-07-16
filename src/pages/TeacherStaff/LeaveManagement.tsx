import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText, CheckCircle2, XCircle, Clock, AlertTriangle,
  Plus, Trash2, Edit2, CheckCheck, X, Loader2, Filter,
  Search, Download, ChevronLeft, ChevronRight, RefreshCw,
  Settings, BarChart3, Users, Calendar, TrendingUp, Award,
  BookOpen, Shield, Coffee, ArrowRight, Inbox, Ban
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface LeaveApplication {
  id: number;
  staff_id: number;
  staff_type: string;
  employee_id: string;
  staff_name: string;
  department: string;
  designation: string | null;
  leave_type: string;
  from_date: string;
  to_date: string;
  days_requested: number;
  is_half_day: boolean;
  half_day_session: string | null;
  reason: string;
  status: string;
  emergency_contact: string | null;
  review_remarks: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface LeavePolicy {
  id: number;
  leave_type: string;
  staff_type: string;
  days_per_year: number;
  is_paid: boolean;
  carry_forward: boolean;
  max_carry_days: number;
  requires_document: boolean;
  is_active: boolean;
  notes: string | null;
}

interface LeaveBalance {
  id: number;
  staff_id: number;
  staff_type: string;
  employee_id?: string;
  name?: string;
  leave_type: string;
  year: number;
  entitled: number;
  taken: number;
  pending: number;
  balance: number;
  carry_forward: number;
}

interface EmployeeSummary {
  staff_id: number;
  staff_type: string;
  employee_id: string;
  name: string;
  department: string | null;
  designation: string | null;
  balances: LeaveBalance[];
  total_entitled: number;
  total_taken: number;
  total_pending: number;
  total_balance: number;
}

interface Stats {
  total: number; pending: number; approved: number;
  rejected: number; cancelled: number; on_leave_today: number;
  by_type: Record<string, number>;
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const LEAVE_TYPES = ['casual', 'sick', 'earned', 'unpaid', 'compensatory', 'maternity', 'paternity', 'bereavement', 'study'];

const LEAVE_TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  casual:       { label: 'Casual',       icon: '🌴', color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200'    },
  sick:         { label: 'Sick',         icon: '🤒', color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200'   },
  earned:       { label: 'Earned',       icon: '⭐', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'  },
  unpaid:       { label: 'Unpaid',       icon: '💸', color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200'  },
  compensatory: { label: 'Compensatory', icon: '🔄', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  maternity:    { label: 'Maternity',    icon: '🤱', color: 'text-pink-700',    bg: 'bg-pink-50',    border: 'border-pink-200'   },
  paternity:    { label: 'Paternity',    icon: '👶', color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  bereavement:  { label: 'Bereavement',  icon: '🕊️', color: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-200'  },
  study:        { label: 'Study',        icon: '📚', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200'},
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <Clock className="w-3.5 h-3.5" />        },
  approved:  { label: 'Approved',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected:  { label: 'Rejected',  color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    icon: <XCircle className="w-3.5 h-3.5" />      },
  cancelled: { label: 'Cancelled', color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200',   icon: <Ban className="w-3.5 h-3.5" />          },
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status];
  if (!c) return <span className="text-[10px] text-slate-400">{status}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${c.color} ${c.bg} ${c.border}`}>
      {c.icon}{c.label}
    </span>
  );
}

function LeaveTypeBadge({ type }: { type: string }) {
  const m = LEAVE_TYPE_META[type] || { label: type, icon: '📋', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${m.color} ${m.bg} ${m.border}`}>
      {m.icon} {m.label}
    </span>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700'];
  const clr = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return <div className={`${sz} rounded-full ${clr} flex items-center justify-center font-bold shrink-0`}>{initials}</div>;
}

function BalanceBar({ taken, pending, entitled }: { taken: number; pending: number; entitled: number }) {
  if (entitled === 0) return <span className="text-[10px] text-slate-400">No quota</span>;
  const takenPct  = Math.min(100, (taken / entitled) * 100);
  const pendPct   = Math.min(100 - takenPct, (pending / entitled) * 100);
  return (
    <div className="space-y-0.5">
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: `${takenPct}%` }} />
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${pendPct}%` }} />
      </div>
      <div className="flex items-center gap-2 text-[9px] text-slate-400">
        <span className="text-emerald-600 font-bold">{taken} taken</span>
        {pending > 0 && <span className="text-amber-500 font-bold">{pending} pending</span>}
        <span className="ml-auto font-bold text-slate-500">{entitled - taken - pending} left</span>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'applications', label: '📋 Applications',  },
  { key: 'balances',     label: '📊 Leave Balances', },
  { key: 'policies',     label: '⚙️ Leave Policies', },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function LeaveManagement() {
  const [tab, setTab] = useState<TabKey>('applications');

  /* ── Stats ── */
  const [stats, setStats] = useState<Stats | null>(null);

  /* ── Applications ── */
  const [apps, setApps] = useState<LeaveApplication[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [appPages, setAppPages] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selIds, setSelIds] = useState<number[]>([]);

  /* ── Filters ── */
  const [statusFilt, setStatusFilt] = useState('');
  const [staffTypeFilt, setStaffTypeFilt] = useState('');
  const [leaveTypeFilt, setLeaveTypeFilt] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  /* ── Balance tab ── */
  const [balYear, setBalYear] = useState(new Date().getFullYear());
  const [balStaffType, setBalStaffType] = useState('');
  const [empSummaries, setEmpSummaries] = useState<EmployeeSummary[]>([]);
  const [loadingBal, setLoadingBal] = useState(false);
  const [initBusy, setInitBusy] = useState(false);

  /* ── Policies ── */
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loadingPol, setLoadingPol] = useState(false);

  /* ── Apply Modal ── */
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [employees, setEmployees] = useState<{ staff_id: number; staff_type: string; name: string; employee_id: string; department: string | null }[]>([]);
  const [applyForm, setApplyForm] = useState({
    staff_id: '', staff_type: 'Teacher', leave_type: 'casual',
    from_date: '', to_date: '', reason: '', is_half_day: false,
    half_day_session: 'morning', emergency_contact: '',
  });
  const [applyBusy, setApplyBusy] = useState(false);

  /* ── Review Modal ── */
  const [reviewModal, setReviewModal] = useState<{ app: LeaveApplication; action: 'approve' | 'reject' } | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  /* ── Policy Modal ── */
  const [polModal, setPolModal] = useState<Partial<LeavePolicy> | null>(null);
  const [polBusy, setPolBusy] = useState(false);

  /* ── Bulk action ── */
  const [bulkBusy, setBulkBusy] = useState(false);

  const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  /* ═══ FETCH STATS ═══ */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/school/employee-leaves/stats');
      if (res.data.success) setStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  /* ═══ FETCH APPS ═══ */
  const fetchApps = useCallback(async () => {
    setLoadingApps(true);
    try {
      const params: Record<string, string | number> = { per_page: 25, page: appPage };
      if (statusFilt)    params.status     = statusFilt;
      if (staffTypeFilt) params.staff_type = staffTypeFilt;
      if (leaveTypeFilt) params.leave_type = leaveTypeFilt;
      if (fromDate)      params.from_date  = fromDate;
      if (toDate)        params.to_date    = toDate;
      if (search)        params.search     = search;
      const res = await api.get('/school/employee-leaves', { params });
      if (res.data.success) {
        setApps(res.data.data || []);
        setAppTotal(res.data.meta?.total || 0);
        setAppPages(res.data.meta?.last_page || 1);
      }
    } catch { toast.error('Failed to load applications'); }
    finally { setLoadingApps(false); }
  }, [appPage, statusFilt, staffTypeFilt, leaveTypeFilt, fromDate, toDate, search]);

  /* ═══ FETCH BALANCES ═══ */
  const fetchBalances = useCallback(async () => {
    setLoadingBal(true);
    try {
      const params: Record<string, string | number> = { year: balYear };
      if (balStaffType) params.staff_type = balStaffType;
      const res = await api.get('/school/employee-leaves/employee-summary', { params });
      if (res.data.success) setEmpSummaries(res.data.data || []);
    } catch { toast.error('Failed to load balances'); }
    finally { setLoadingBal(false); }
  }, [balYear, balStaffType]);

  /* ═══ FETCH POLICIES ═══ */
  const fetchPolicies = useCallback(async () => {
    setLoadingPol(true);
    try {
      const res = await api.get('/school/employee-leaves/policies');
      if (res.data.success) setPolicies(res.data.data || []);
    } catch { toast.error('Failed to load policies'); }
    finally { setLoadingPol(false); }
  }, []);

  /* ═══ FETCH EMPLOYEE LIST ═══ */
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/school/employee-attendance/daily', { params: { date: new Date().toISOString().slice(0, 10) } });
      if (res.data.success) {
        setEmployees((res.data.data || []).map((e: any) => ({
          staff_id: e.staff_id, staff_type: e.staff_type, name: e.name,
          employee_id: e.employee_id, department: e.department,
        })));
      }
    } catch { /* fallback ok */ }
  }, []);

  useEffect(() => { fetchStats(); fetchEmployees(); }, [fetchStats, fetchEmployees]);
  useEffect(() => { if (tab === 'applications') fetchApps(); }, [tab, fetchApps]);
  useEffect(() => { if (tab === 'balances') fetchBalances(); }, [tab, fetchBalances]);
  useEffect(() => { if (tab === 'policies') fetchPolicies(); }, [tab, fetchPolicies]);

  /* ═══ APPLY LEAVE ═══ */
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.staff_id) { toast.error('Select an employee'); return; }
    setApplyBusy(true);
    try {
      const selectedEmp = employees.find(em => em.staff_id === parseInt(applyForm.staff_id) && em.staff_type === applyForm.staff_type);
      const res = await api.post('/school/employee-leaves', {
        ...applyForm,
        staff_id: parseInt(applyForm.staff_id),
        staff_type: selectedEmp?.staff_type || applyForm.staff_type,
        is_half_day: applyForm.is_half_day,
      });
      if (res.data.success) {
        toast.success('Leave applied!');
        setShowApplyModal(false);
        setApplyForm({ staff_id: '', staff_type: 'Teacher', leave_type: 'casual', from_date: '', to_date: '', reason: '', is_half_day: false, half_day_session: 'morning', emergency_contact: '' });
        fetchApps(); fetchStats();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to apply'); }
    finally { setApplyBusy(false); }
  };

  /* ═══ REVIEW (Approve/Reject) ═══ */
  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal) return;
    setReviewBusy(true);
    try {
      const url = `/school/employee-leaves/${reviewModal.app.id}/${reviewModal.action}`;
      const res = await api.post(url, { review_remarks: reviewRemarks });
      if (res.data.success) {
        toast.success(`Leave ${reviewModal.action}d!`);
        setReviewModal(null); setReviewRemarks('');
        fetchApps(); fetchStats(); fetchBalances();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setReviewBusy(false); }
  };

  /* ═══ CANCEL ═══ */
  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this leave application?')) return;
    try {
      const res = await api.post(`/school/employee-leaves/${id}/cancel`);
      if (res.data.success) { toast.success('Leave cancelled'); fetchApps(); fetchStats(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  /* ═══ DELETE ═══ */
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this leave record permanently?')) return;
    try {
      await api.delete(`/school/employee-leaves/${id}`);
      toast.success('Deleted'); fetchApps(); fetchStats();
    } catch { toast.error('Delete failed'); }
  };

  /* ═══ BULK ACTION ═══ */
  const handleBulk = async (action: 'approve' | 'reject' | 'cancel' | 'delete') => {
    if (!selIds.length) { toast.error('Select records first'); return; }
    if (!confirm(`${action} ${selIds.length} application(s)?`)) return;
    setBulkBusy(true);
    try {
      const res = await api.post('/school/employee-leaves/bulk-action', { ids: selIds, action });
      if (res.data.success) { toast.success(res.data.message); setSelIds([]); fetchApps(); fetchStats(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setBulkBusy(false); }
  };

  /* ═══ INIT BALANCES ═══ */
  const handleInitBalances = async () => {
    if (!confirm(`Initialize leave balances for ${balYear}?`)) return;
    setInitBusy(true);
    try {
      const params: Record<string, string | number> = { year: balYear };
      if (balStaffType) params.staff_type = balStaffType;
      const res = await api.post('/school/employee-leaves/balances/initialize', params);
      if (res.data.success) { toast.success(res.data.message); fetchBalances(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setInitBusy(false); }
  };

  /* ═══ SAVE POLICY ═══ */
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!polModal) return;
    setPolBusy(true);
    try {
      let res;
      if (polModal.id) {
        res = await api.put(`/school/employee-leaves/policies/${polModal.id}`, polModal);
      } else {
        res = await api.post('/school/employee-leaves/policies', polModal);
      }
      if (res.data.success) {
        toast.success(polModal.id ? 'Policy updated' : 'Policy created');
        setPolModal(null); fetchPolicies();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPolBusy(false); }
  };

  /* ═══ DELETE POLICY ═══ */
  const handleDeletePolicy = async (id: number) => {
    if (!confirm('Delete this policy?')) return;
    try {
      await api.delete(`/school/employee-leaves/policies/${id}`);
      toast.success('Deleted'); fetchPolicies();
    } catch { toast.error('Delete failed'); }
  };

  /* ═══ SELECT ALL ═══ */
  const toggleSelectAll = () => {
    if (selIds.length === apps.length) setSelIds([]);
    else setSelIds(apps.map(a => a.id));
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-violet-50 text-violet-600 rounded-lg"><FileText className="w-5 h-5" /></span>
            Leave Management
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Apply, approve, and track employee leave applications with balance management.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === t.key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
            <Plus className="w-3.5 h-3.5" /> Apply Leave
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Total',         val: stats.total,          bg: 'bg-slate-50',    text: 'text-slate-700'   },
            { label: 'Pending',       val: stats.pending,        bg: 'bg-amber-50',    text: 'text-amber-700'   },
            { label: 'Approved',      val: stats.approved,       bg: 'bg-emerald-50',  text: 'text-emerald-700' },
            { label: 'Rejected',      val: stats.rejected,       bg: 'bg-rose-50',     text: 'text-rose-700'    },
            { label: 'Cancelled',     val: stats.cancelled,      bg: 'bg-slate-50',    text: 'text-slate-500'   },
            { label: 'On Leave Today',val: stats.on_leave_today, bg: 'bg-violet-50',   text: 'text-violet-700'  },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-white shadow-sm p-3`}>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{s.label}</span>
              <span className={`text-2xl font-black ${s.text}`}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════ TAB: APPLICATIONS ══════════════════════ */}
      {tab === 'applications' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
            <select value={statusFilt} onChange={e => setStatusFilt(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Status</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={staffTypeFilt} onChange={e => setStaffTypeFilt(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Types</option>
              <option value="Teacher">Teachers</option>
              <option value="NonTeaching">Non-Teaching</option>
            </select>
            <select value={leaveTypeFilt} onChange={e => setLeaveTypeFilt(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Leave Types</option>
              {LEAVE_TYPES.map(l => <option key={l} value={l} className="capitalize">{LEAVE_TYPE_META[l]?.label || l}</option>)}
            </select>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="From"
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-400 shadow-sm" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} placeholder="To"
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-400 shadow-sm" />
            <div className="flex items-center gap-2 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)}
                className="text-xs outline-none bg-transparent text-slate-700 w-28" />
            </div>
            <button onClick={() => { setAppPage(1); fetchApps(); }}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            {selIds.length > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] font-bold text-slate-500">{selIds.length} selected</span>
                <button onClick={() => handleBulk('approve')} disabled={bulkBusy} className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-100 transition">✓ Approve</button>
                <button onClick={() => handleBulk('reject')}  disabled={bulkBusy} className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-lg hover:bg-rose-100 transition">✗ Reject</button>
                <button onClick={() => handleBulk('cancel')}  disabled={bulkBusy} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-100 transition">Cancel</button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loadingApps ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-16">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No leave applications found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 w-8">
                          <input type="checkbox" checked={selIds.length === apps.length && apps.length > 0}
                            onChange={toggleSelectAll} className="w-3.5 h-3.5 accent-violet-600 cursor-pointer" />
                        </th>
                        {['Employee', 'Type', 'Leave Type', 'Duration', 'Days', 'Reason', 'Status', 'Applied On', 'Actions'].map(h => (
                          <th key={h} className="py-3 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {apps.map(app => (
                        <tr key={app.id} className={`hover:bg-slate-50/60 transition ${selIds.includes(app.id) ? 'bg-violet-50/30' : ''}`}>
                          <td className="py-2.5 px-3">
                            <input type="checkbox" checked={selIds.includes(app.id)}
                              onChange={() => setSelIds(prev => prev.includes(app.id) ? prev.filter(i => i !== app.id) : [...prev, app.id])}
                              className="w-3.5 h-3.5 accent-violet-600 cursor-pointer" />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={app.staff_name || '?'} size="sm" />
                              <div>
                                <p className="text-xs font-bold text-slate-800 whitespace-nowrap">{app.staff_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{app.employee_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${app.staff_type === 'Teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                              {app.staff_type === 'Teacher' ? 'Teacher' : 'Non-Teaching'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3"><LeaveTypeBadge type={app.leave_type} /></td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <p className="text-xs text-slate-700 font-semibold">{app.from_date} → {app.to_date}</p>
                            {app.is_half_day && <p className="text-[9px] text-amber-600">{app.half_day_session} half</p>}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-sm font-black text-violet-600">{app.days_requested}</span>
                            <p className="text-[9px] text-slate-400">days</p>
                          </td>
                          <td className="py-2.5 px-3 max-w-[160px]">
                            <p className="text-xs text-slate-600 truncate" title={app.reason}>{app.reason}</p>
                          </td>
                          <td className="py-2.5 px-3"><StatusBadge status={app.status} /></td>
                          <td className="py-2.5 px-3 text-[10px] text-slate-400 whitespace-nowrap">{app.created_at?.slice(0, 10)}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              {app.status === 'pending' && (
                                <>
                                  <button onClick={() => { setReviewModal({ app, action: 'approve' }); setReviewRemarks(''); }}
                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Approve">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => { setReviewModal({ app, action: 'reject' }); setReviewRemarks(''); }}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Reject">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {app.status === 'approved' && (
                                <button onClick={() => handleCancel(app.id)}
                                  className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition" title="Cancel">
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => handleDelete(app.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Page {appPage} of {appPages} · {appTotal} total</span>
                  <div className="flex gap-2">
                    <button disabled={appPage <= 1} onClick={() => setAppPage(p => p - 1)}
                      className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button disabled={appPage >= appPages} onClick={() => setAppPage(p => p + 1)}
                      className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: BALANCES ══════════════════════ */}
      {tab === 'balances' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
            <select value={balYear} onChange={e => setBalYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-400 shadow-sm">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={balStaffType} onChange={e => setBalStaffType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Staff</option>
              <option value="Teacher">Teachers</option>
              <option value="NonTeaching">Non-Teaching</option>
            </select>
            <button onClick={fetchBalances}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Load
            </button>
            <button onClick={handleInitBalances} disabled={initBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition disabled:opacity-50">
              {initBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Initialize {balYear}
            </button>
            <span className="text-[10px] text-slate-400 ml-auto">{empSummaries.length} employees</span>
          </div>

          {loadingBal ? (
            <div className="flex items-center justify-center py-14">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : empSummaries.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
              <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No balance data. Click Load or Initialize.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {empSummaries.map(emp => (
                <div key={`${emp.staff_type}_${emp.staff_id}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={emp.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${emp.staff_type === 'Teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                          {emp.staff_type === 'Teacher' ? 'Teacher' : 'NT'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{emp.employee_id}</span>
                        {emp.department && <span className="text-[10px] text-slate-400">{emp.department}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">Balance</p>
                      <p className="text-lg font-black text-violet-600">{emp.total_balance}</p>
                      <p className="text-[9px] text-slate-400">/ {emp.total_entitled} entitled</p>
                    </div>
                  </div>
                  {emp.balances.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {emp.balances.map(b => {
                        const meta = LEAVE_TYPE_META[b.leave_type] || { label: b.leave_type, icon: '📋', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
                        return (
                          <div key={b.id} className={`${meta.bg} ${meta.border} border rounded-xl p-2.5`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold ${meta.color}`}>{meta.icon} {meta.label}</span>
                              <span className={`text-sm font-black ${meta.color}`}>{b.balance}</span>
                            </div>
                            <BalanceBar taken={b.taken} pending={b.pending} entitled={b.entitled} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No leave balances initialized. Run Initialize for {balYear}.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ TAB: POLICIES ══════════════════════ */}
      {tab === 'policies' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setPolModal({ leave_type: 'casual', staff_type: 'all', days_per_year: 12, is_paid: true, carry_forward: false, max_carry_days: 0, requires_document: false, is_active: true })}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
              <Plus className="w-3.5 h-3.5" /> Add Policy
            </button>
          </div>

          {loadingPol ? (
            <div className="flex items-center justify-center py-14">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
              <Settings className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No policies configured. Add leave policies to define employee entitlements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {policies.map(pol => {
                const meta = LEAVE_TYPE_META[pol.leave_type] || { label: pol.leave_type, icon: '📋', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
                return (
                  <div key={pol.id} className={`bg-white border-2 rounded-xl p-4 shadow-sm ${pol.is_active ? meta.border : 'border-slate-200 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{meta.icon}</span>
                          <h3 className={`text-sm font-bold ${meta.color}`}>{meta.label} Leave</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {pol.staff_type === 'all' ? 'All Staff' : pol.staff_type === 'Teacher' ? 'Teachers' : 'Non-Teaching'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setPolModal({ ...pol })} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeletePolicy(pol.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-3xl font-black ${meta.color}`}>{pol.days_per_year}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">days / year</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pol.is_paid && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Paid</span>}
                      {!pol.is_paid && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">Unpaid</span>}
                      {pol.carry_forward && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full">Carry Forward ({pol.max_carry_days}d)</span>}
                      {pol.requires_document && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Doc Required</span>}
                      {!pol.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full">Inactive</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          APPLY LEAVE MODAL
      ════════════════════════════════════════ */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-600" /> Apply Leave
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApply} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff Type</label>
                  <select value={applyForm.staff_type} onChange={e => setApplyForm(f => ({ ...f, staff_type: e.target.value, staff_id: '' }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
                    <option value="Teacher">Teacher</option>
                    <option value="NonTeaching">Non-Teaching</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee <span className="text-rose-500">*</span></label>
                  <select value={applyForm.staff_id} onChange={e => setApplyForm(f => ({ ...f, staff_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
                    <option value="">Select Employee</option>
                    {employees.filter(e => e.staff_type === applyForm.staff_type).map(e => (
                      <option key={`${e.staff_type}_${e.staff_id}`} value={e.staff_id}>{e.name} ({e.employee_id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Leave Type <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-3 gap-1.5">
                  {LEAVE_TYPES.map(lt => {
                    const m = LEAVE_TYPE_META[lt];
                    const active = applyForm.leave_type === lt;
                    return (
                      <button type="button" key={lt} onClick={() => setApplyForm(f => ({ ...f, leave_type: lt }))}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition ${active ? `${m.bg} ${m.border} ${m.color}` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        {m.icon} {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date <span className="text-rose-500">*</span></label>
                  <input type="date" value={applyForm.from_date} onChange={e => setApplyForm(f => ({ ...f, from_date: e.target.value }))} required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date <span className="text-rose-500">*</span></label>
                  <input type="date" value={applyForm.to_date} onChange={e => setApplyForm(f => ({ ...f, to_date: e.target.value }))} required
                    min={applyForm.from_date}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={applyForm.is_half_day} onChange={e => setApplyForm(f => ({ ...f, is_half_day: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-violet-600" />
                  <span className="text-xs font-semibold text-slate-600">Half Day</span>
                </label>
                {applyForm.is_half_day && (
                  <select value={applyForm.half_day_session} onChange={e => setApplyForm(f => ({ ...f, half_day_session: e.target.value }))}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400">
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason <span className="text-rose-500">*</span></label>
                <textarea rows={3} required placeholder="Reason for leave..." value={applyForm.reason} onChange={e => setApplyForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 resize-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Emergency Contact</label>
                <input type="text" placeholder="Phone number..." value={applyForm.emergency_contact} onChange={e => setApplyForm(f => ({ ...f, emergency_contact: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowApplyModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={applyBusy}
                  className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {applyBusy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Submitting...</> : <><CheckCircle2 className="w-3.5 h-3.5" />Submit</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          REVIEW MODAL (approve / reject)
      ════════════════════════════════════════ */}
      {reviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-2xl">
            <div className={`px-6 py-4 border-b ${reviewModal.action === 'approve' ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'} rounded-t-2xl flex items-center justify-between`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${reviewModal.action === 'approve' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {reviewModal.action === 'approve' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {reviewModal.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
              </h3>
              <button onClick={() => setReviewModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReview} className="p-6 space-y-4">
              <div className={`rounded-xl p-3 border ${reviewModal.action === 'approve' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <p className="text-xs font-bold text-slate-700">{reviewModal.app.staff_name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {LEAVE_TYPE_META[reviewModal.app.leave_type]?.label || reviewModal.app.leave_type} · {reviewModal.app.from_date} → {reviewModal.app.to_date} ({reviewModal.app.days_requested} days)
                </p>
                <p className="text-[10px] text-slate-500 mt-1 italic">"{reviewModal.app.reason}"</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Review Remarks (Optional)</label>
                <textarea rows={3} placeholder={`Enter remarks...`} value={reviewRemarks} onChange={e => setReviewRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setReviewModal(null)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={reviewBusy}
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 ${reviewModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  {reviewBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          POLICY MODAL
      ════════════════════════════════════════ */}
      {polModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-600" /> {polModal.id ? 'Edit Policy' : 'Add Leave Policy'}
              </h3>
              <button onClick={() => setPolModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSavePolicy} className="p-6 space-y-4">
              {!polModal.id && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Leave Type <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LEAVE_TYPES.map(lt => {
                        const m = LEAVE_TYPE_META[lt];
                        const active = polModal.leave_type === lt;
                        return (
                          <button type="button" key={lt} onClick={() => setPolModal(p => p ? { ...p, leave_type: lt } : p)}
                            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition ${active ? `${m.bg} ${m.border} ${m.color}` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            {m.icon} {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Applies To</label>
                    <select value={polModal.staff_type} onChange={e => setPolModal(p => p ? { ...p, staff_type: e.target.value } : p)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
                      <option value="all">All Staff</option>
                      <option value="Teacher">Teachers Only</option>
                      <option value="NonTeaching">Non-Teaching Only</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Days Per Year <span className="text-rose-500">*</span></label>
                <input type="number" min="0" max="365" value={polModal.days_per_year ?? ''} onChange={e => setPolModal(p => p ? { ...p, days_per_year: parseInt(e.target.value) || 0 } : p)} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                  <input type="checkbox" checked={!!polModal.is_paid} onChange={e => setPolModal(p => p ? { ...p, is_paid: e.target.checked } : p)} className="w-3.5 h-3.5 accent-violet-600" />
                  <span className="text-xs font-semibold text-slate-600">Paid Leave</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                  <input type="checkbox" checked={!!polModal.carry_forward} onChange={e => setPolModal(p => p ? { ...p, carry_forward: e.target.checked } : p)} className="w-3.5 h-3.5 accent-violet-600" />
                  <span className="text-xs font-semibold text-slate-600">Carry Forward</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                  <input type="checkbox" checked={!!polModal.requires_document} onChange={e => setPolModal(p => p ? { ...p, requires_document: e.target.checked } : p)} className="w-3.5 h-3.5 accent-violet-600" />
                  <span className="text-xs font-semibold text-slate-600">Doc Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                  <input type="checkbox" checked={!!polModal.is_active} onChange={e => setPolModal(p => p ? { ...p, is_active: e.target.checked } : p)} className="w-3.5 h-3.5 accent-violet-600" />
                  <span className="text-xs font-semibold text-slate-600">Is Active</span>
                </label>
              </div>
              {polModal.carry_forward && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Carry Forward Days</label>
                  <input type="number" min="0" value={polModal.max_carry_days ?? 0} onChange={e => setPolModal(p => p ? { ...p, max_carry_days: parseInt(e.target.value) || 0 } : p)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes</label>
                <textarea rows={2} placeholder="Optional notes..." value={polModal.notes || ''} onChange={e => setPolModal(p => p ? { ...p, notes: e.target.value } : p)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setPolModal(null)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={polBusy}
                  className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {polBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {polModal.id ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
