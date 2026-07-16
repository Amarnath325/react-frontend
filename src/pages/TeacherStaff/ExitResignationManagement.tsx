import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  LogOut, Search, Plus, Trash2, Edit3, Eye, RefreshCw, X,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight,
  RotateCcw, Archive, CheckSquare, Square, Loader2, Star,
  FileText, AlertTriangle, ShieldCheck, Banknote, ChevronDown,
  User, Calendar, Check, AlertCircle
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface StaffExit {
  id: number;
  school_id: number;
  staff_id: number;
  staff_type: string;
  exit_type: string;
  exit_status: string;
  resignation_date: string | null;
  notice_period_end_date: string | null;
  last_working_date: string | null;
  relieving_date: string | null;
  clearance_date: string | null;
  notice_period: string | null;
  notice_period_waived: boolean;
  reason: string | null;
  exit_interview_notes: string | null;
  id_card_returned: boolean;
  assets_returned: boolean;
  library_cleared: boolean;
  accounts_cleared: boolean;
  system_access_revoked: boolean;
  pf_settlement_done: boolean;
  gratuity_processed: boolean;
  experience_letter_issued: boolean;
  relieving_letter_issued: boolean;
  noc_issued: boolean;
  resignation_letter_ref: string | null;
  approved_by: string | null;
  approved_date: string | null;
  hr_remarks: string | null;
  final_settlement_amount: number | null;
  final_settlement_date: string | null;
  rehire_eligible: boolean;
  exit_rating: number | null;
  is_active: boolean;
  staff_name?: string;
  staff_employee_id?: string;
  staff_department?: string;
  clearance_progress?: { done: number; total: number; pct: number };
  deleted_at?: string | null;
}

interface StaffOption { id: number; type: string; name: string; employee_id: string; label: string; department: string | null; }

/* ─── Constants ───────────────────────────────────────── */
const EXIT_TYPES = [
  { value: 'resignation',   label: 'Resignation',    icon: '📝' },
  { value: 'retirement',    label: 'Retirement',     icon: '🏖️' },
  { value: 'termination',   label: 'Termination',    icon: '🚫' },
  { value: 'contract_end',  label: 'Contract End',   icon: '📋' },
  { value: 'voluntary',     label: 'Voluntary Exit', icon: '🤝' },
  { value: 'death',         label: 'Death',          icon: '🕊️' },
  { value: 'abandonment',   label: 'Abandonment',    icon: '⚠️' },
  { value: 'other',         label: 'Other',          icon: '❓' },
];

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  notice_received: { label: 'Notice Received', bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200', icon: <Clock className="w-3 h-3" /> },
  under_review:    { label: 'Under Review',    bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200', icon: <Loader2 className="w-3 h-3" /> },
  accepted:        { label: 'Accepted',        bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:        { label: 'Rejected',        bg: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-200', icon: <XCircle className="w-3 h-3" /> },
  notice_period:   { label: 'Notice Period',   bg: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200', icon: <Calendar className="w-3 h-3" /> },
  cleared:         { label: 'Cleared',         bg: 'bg-sky-50',      text: 'text-sky-700',     border: 'border-sky-200', icon: <ShieldCheck className="w-3 h-3" /> },
  completed:       { label: 'Completed',       bg: 'bg-teal-50',     text: 'text-teal-700',    border: 'border-teal-200', icon: <Check className="w-3 h-3" /> },
};

const EXIT_TYPE_COLORS: Record<string, string> = {
  resignation:  'bg-orange-50 text-orange-700 border-orange-200',
  retirement:   'bg-teal-50 text-teal-700 border-teal-200',
  termination:  'bg-rose-50 text-rose-700 border-rose-200',
  contract_end: 'bg-slate-100 text-slate-700 border-slate-200',
  voluntary:    'bg-sky-50 text-sky-700 border-sky-200',
  death:        'bg-slate-200 text-slate-700 border-slate-300',
  abandonment:  'bg-amber-50 text-amber-700 border-amber-200',
  other:        'bg-violet-50 text-violet-700 border-violet-200',
};

const CLEARANCE_LABELS: Record<string, string> = {
  id_card_returned:         'ID Card Returned',
  assets_returned:          'Assets / Equipment Returned',
  library_cleared:          'Library Cleared',
  accounts_cleared:         'Accounts / Finance Cleared',
  system_access_revoked:    'System Access Revoked',
  pf_settlement_done:       'PF Settlement Done',
  gratuity_processed:       'Gratuity Processed',
  experience_letter_issued: 'Experience Letter Issued',
  relieving_letter_issued:  'Relieving Letter Issued',
  noc_issued:               'NOC Issued',
};
const CLEARANCE_KEYS = Object.keys(CLEARANCE_LABELS);

const PAGE_SIZE = 10;

const initForm = () => ({
  staff_id: '', staff_type: '',
  exit_type: 'resignation', exit_status: 'notice_received',
  resignation_date: '', notice_period_end_date: '', last_working_date: '',
  relieving_date: '', clearance_date: '',
  notice_period: '', notice_period_waived: false,
  reason: '', exit_interview_notes: '',
  id_card_returned: false, assets_returned: false, library_cleared: false,
  accounts_cleared: false, system_access_revoked: false, pf_settlement_done: false,
  gratuity_processed: false, experience_letter_issued: false,
  relieving_letter_issued: false, noc_issued: false,
  resignation_letter_ref: '',
  approved_by: '', approved_date: '', hr_remarks: '',
  final_settlement_amount: '', final_settlement_date: '',
  rehire_eligible: true, exit_rating: '',
});

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ExitResignationManagement() {
  const [items, setItems]         = useState<StaffExit[]>([]);
  const [staffList, setStaff]     = useState<StaffOption[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [alert, setAlert]         = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [search, setSearch]           = useState('');
  const [filterStatus, setFStatus]    = useState('');
  const [filterType, setFType]        = useState('');
  const [page, setPage]               = useState(1);
  const [showTrashed, setTrashed]     = useState(false);
  const [selectedIds, setSelected]    = useState<Set<number>>(new Set());

  const [showModal, setShowModal]         = useState(false);
  const [showView, setShowView]           = useState(false);
  const [showDeleteModal, setShowDelete]  = useState(false);
  const [showStatusModal, setShowStatus]  = useState(false);
  const [editingItem, setEditing]         = useState<StaffExit | null>(null);
  const [viewItem, setViewItem]           = useState<StaffExit | null>(null);
  const [deleteItem, setDeleteItem]       = useState<StaffExit | null>(null);
  const [statusTarget, setStatusTarget]   = useState<StaffExit | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [togglingId, setTogglingId]       = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<'basic' | 'clearance' | 'settlement'>('basic');

  const [form, setForm]           = useState(initForm());
  const [statusForm, setStatusForm] = useState({ exit_status: '', approved_by: '', approved_date: '', hr_remarks: '' });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (showTrashed) params.only_trashed = true;
      if (filterStatus) params.exit_status = filterStatus;
      if (filterType)   params.exit_type   = filterType;
      const res = await api.get('/school/staff-exits', { params });
      if (res.data.success) setItems(res.data.data || []);
    } catch { showAlert('err', 'Failed to load exit records'); }
    finally { setLoading(false); }
  }, [showAlert, showTrashed, filterStatus, filterType]);

  const fetchStaff = useCallback(async () => {
    try { const res = await api.get('/school/staff-exits/staff-list'); if (res.data.success) setStaff(res.data.data || []); } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchItems(); setSelected(new Set()); setPage(1); }, [fetchItems]);
  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  /* ════════ FORM ════════ */
  const openAdd = () => { setEditing(null); setForm(initForm()); setActiveTab('basic'); setShowModal(true); };

  const openEdit = (item: StaffExit) => {
    setEditing(item);
    setForm({
      staff_id: item.staff_id.toString(), staff_type: item.staff_type,
      exit_type: item.exit_type, exit_status: item.exit_status,
      resignation_date: item.resignation_date?.split('T')[0] || '',
      notice_period_end_date: item.notice_period_end_date?.split('T')[0] || '',
      last_working_date: item.last_working_date?.split('T')[0] || '',
      relieving_date: item.relieving_date?.split('T')[0] || '',
      clearance_date: item.clearance_date?.split('T')[0] || '',
      notice_period: item.notice_period || '',
      notice_period_waived: item.notice_period_waived,
      reason: item.reason || '', exit_interview_notes: item.exit_interview_notes || '',
      id_card_returned: item.id_card_returned, assets_returned: item.assets_returned,
      library_cleared: item.library_cleared, accounts_cleared: item.accounts_cleared,
      system_access_revoked: item.system_access_revoked, pf_settlement_done: item.pf_settlement_done,
      gratuity_processed: item.gratuity_processed, experience_letter_issued: item.experience_letter_issued,
      relieving_letter_issued: item.relieving_letter_issued, noc_issued: item.noc_issued,
      resignation_letter_ref: item.resignation_letter_ref || '',
      approved_by: item.approved_by || '', approved_date: item.approved_date?.split('T')[0] || '',
      hr_remarks: item.hr_remarks || '',
      final_settlement_amount: item.final_settlement_amount?.toString() || '',
      final_settlement_date: item.final_settlement_date?.split('T')[0] || '',
      rehire_eligible: item.rehire_eligible,
      exit_rating: item.exit_rating?.toString() || '',
    });
    setActiveTab('basic'); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id) { showAlert('err', 'Please select a staff member'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form, staff_id: parseInt(form.staff_id) };
      ['resignation_date','notice_period_end_date','last_working_date','relieving_date','clearance_date',
       'notice_period','reason','exit_interview_notes','resignation_letter_ref','approved_by','approved_date',
       'hr_remarks','final_settlement_date'].forEach(k => { if (!payload[k]) payload[k] = null; });
      if (!payload.final_settlement_amount) payload.final_settlement_amount = null;
      else payload.final_settlement_amount = parseFloat(payload.final_settlement_amount as string);
      if (!payload.exit_rating) payload.exit_rating = null;
      else payload.exit_rating = parseInt(payload.exit_rating as string);

      if (editingItem) {
        await api.put(`/school/staff-exits/${editingItem.id}`, payload);
        showAlert('ok', 'Exit record updated');
      } else {
        await api.post('/school/staff-exits', payload);
        showAlert('ok', 'Exit record created');
      }
      setShowModal(false); fetchItems();
    } catch (err: any) { showAlert('err', err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  /* ════════ CLEARANCE TOGGLE ════════ */
  const toggleClearance = async (item: StaffExit, field: string) => {
    const key = `${item.id}-${field}`;
    setTogglingId(key);
    try {
      const res = await api.patch(`/school/staff-exits/${item.id}/toggle-clearance`, { field });
      if (res.data.success) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...res.data.data } : i));
        if (viewItem?.id === item.id) setViewItem(res.data.data);
      }
    } catch { showAlert('err', 'Toggle failed'); }
    finally { setTogglingId(null); }
  };

  /* ════════ STATUS ════════ */
  const openStatusModal = (item: StaffExit) => {
    setStatusTarget(item);
    setStatusForm({ exit_status: item.exit_status, approved_by: item.approved_by || '', approved_date: item.approved_date?.split('T')[0] || '', hr_remarks: item.hr_remarks || '' });
    setShowStatus(true);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    try {
      const res = await api.patch(`/school/staff-exits/${statusTarget.id}/update-status`, statusForm);
      if (res.data.success) { showAlert('ok', 'Status updated'); setShowStatus(false); fetchItems(); }
    } catch (err: any) { showAlert('err', err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await api.delete(`/school/staff-exits/${deleteItem.id}`);
      showAlert('ok', 'Deleted'); setShowDelete(false); fetchItems();
    } catch { showAlert('err', 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleRestore     = async (id: number) => { try { await api.post(`/school/staff-exits/${id}/restore`); showAlert('ok','Restored'); fetchItems(); } catch { showAlert('err','Failed'); } };
  const handleForceDelete = async (id: number) => { if (!confirm('Permanently delete?')) return; try { await api.delete(`/school/staff-exits/${id}/force`); showAlert('ok','Permanently deleted'); fetchItems(); } catch { showAlert('err','Failed'); } };

  /* ════════ BULK ════════ */
  const toggleSelectAll = () => { selectedIds.size === paginated.length ? setSelected(new Set()) : setSelected(new Set(paginated.map(i => i.id))); };
  const toggleSelect    = (id: number) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const bulkAction = async (action: 'delete' | 'restore' | 'status', extra?: { force?: boolean; status?: string }) => {
    if (selectedIds.size === 0) return;
    try {
      if (action === 'delete') {
        if (!confirm(extra?.force ? 'Permanently delete selected?' : 'Delete selected?')) return;
        const res = await api.post('/school/staff-exits/bulk-delete', { ids: Array.from(selectedIds), force: extra?.force });
        showAlert('ok', res.data.message);
      } else if (action === 'restore') {
        const res = await api.post('/school/staff-exits/bulk-restore', { ids: Array.from(selectedIds) });
        showAlert('ok', res.data.message);
      } else if (action === 'status' && extra?.status) {
        const res = await api.post('/school/staff-exits/bulk-status', { ids: Array.from(selectedIds), exit_status: extra.status });
        showAlert('ok', res.data.message);
      }
      setSelected(new Set()); fetchItems();
    } catch { showAlert('err', 'Action failed'); }
  };

  /* ════════ HELPERS ════════ */
  const fmt  = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const fmtAmt = (v: number | null) => v != null ? '₹' + Number(v).toLocaleString('en-IN') : '—';
  const exitTypeInfo   = (v: string) => EXIT_TYPES.find(t => t.value === v) || { label: v, icon: '❓' };
  const statusInfo     = (v: string) => STATUS_MAP[v] || STATUS_MAP.notice_received;

  const statusBadge = (status: string) => {
    const s = statusInfo(status);
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] border ${s.bg} ${s.text} ${s.border}`}>{s.icon} {s.label}</span>;
  };

  const typeBadge = (type: string) => {
    const t = exitTypeInfo(type);
    return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${EXIT_TYPE_COLORS[type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{t.icon} {t.label}</span>;
  };

  const ratingStars = (r: number | null) => {
    if (!r) return <span className="text-slate-400 text-[10px]">—</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
      </div>
    );
  };

  /* ════════ FILTER + PAGINATE ════════ */
  const filtered   = items.filter(i => !search || (i.staff_name||'').toLowerCase().includes(search.toLowerCase()) || (i.staff_employee_id||'').toLowerCase().includes(search.toLowerCase()) || (i.reason||'').toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ════════ METRICS ════════ */
  const M = {
    total:          items.length,
    noticeReceived: items.filter(i => i.exit_status === 'notice_received').length,
    accepted:       items.filter(i => i.exit_status === 'accepted').length,
    noticePeriod:   items.filter(i => i.exit_status === 'notice_period').length,
    completed:      items.filter(i => i.exit_status === 'completed').length,
    cleared:        items.filter(i => i.exit_status === 'cleared').length,
  };

  /* ────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {alert && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${alert.type === 'err' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          <span>{alert.type === 'err' ? '⚠️' : '✅'}</span><span>{alert.msg}</span>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg"><LogOut className="w-5 h-5" /></span>
            <span>Exit & Resignation Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Process resignations, retirements, terminations, manage clearance checklists, and final settlements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTrashed(!showTrashed)} className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition border ${showTrashed ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Archive className="w-3.5 h-3.5" /><span>{showTrashed ? 'Show Active' : 'Trashed'}</span>
          </button>
          <button onClick={fetchItems} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {!showTrashed && (
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /><span>New Exit Record</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ METRIC CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',        value: M.total,          bg: 'bg-orange-50',  text: 'text-orange-600',  icon: <LogOut className="w-3.5 h-3.5" /> },
          { label: 'Notice',       value: M.noticeReceived, bg: 'bg-slate-100',  text: 'text-slate-600',   icon: <Clock className="w-3.5 h-3.5" /> },
          { label: 'Accepted',     value: M.accepted,       bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          { label: 'Notice Period',value: M.noticePeriod,   bg: 'bg-violet-50',  text: 'text-violet-600',  icon: <Calendar className="w-3.5 h-3.5" /> },
          { label: 'Cleared',      value: M.cleared,        bg: 'bg-sky-50',     text: 'text-sky-600',     icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { label: 'Completed',    value: M.completed,      bg: 'bg-teal-50',    text: 'text-teal-600',    icon: <Check className="w-3.5 h-3.5" /> },
        ].map(s => (
          <div key={s.label} className="bg-white p-3.5 rounded-xl border border-slate-200/85 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{s.label}</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">{s.value}</span>
            </div>
            <div className={`p-2 rounded-lg ${s.bg} ${s.text}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* ═══ CONTROLS ═══ */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 shadow-sm"
            placeholder="Search by staff name, employee ID, reason..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-orange-400 shadow-sm cursor-pointer"
            value={filterStatus} onChange={e => { setFStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {Object.entries(STATUS_MAP).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-orange-400 shadow-sm cursor-pointer"
            value={filterType} onChange={e => { setFType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {EXIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
        </div>
      </div>

      {/* ═══ BULK BAR ═══ */}
      {selectedIds.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-orange-700">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-orange-200" />
          {showTrashed ? (
            <>
              <button onClick={() => bulkAction('restore')} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Restore</button>
              <button onClick={() => bulkAction('delete', { force: true })} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Permanent Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => bulkAction('status', { status: 'accepted' })}       className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Accept</button>
              <button onClick={() => bulkAction('status', { status: 'notice_period' })}  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-violet-600 text-white hover:bg-violet-700 transition flex items-center gap-1"><Calendar className="w-3 h-3" /> Notice Period</button>
              <button onClick={() => bulkAction('status', { status: 'completed' })}      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-1"><Check className="w-3 h-3" /> Complete</button>
              <button onClick={() => bulkAction('delete')} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
            </>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto px-2 py-1 text-[10px] text-slate-500 hover:bg-white rounded-lg transition"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ═══ TABLE ═══ */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" /></div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-3"><LogOut className="w-6 h-6" /></div>
          <h3 className="text-sm font-bold text-slate-800">{items.length === 0 ? (showTrashed ? 'No trashed records' : 'No exit records yet') : 'No matching records'}</h3>
          <p className="text-xs text-slate-500 mt-1">{items.length === 0 && !showTrashed ? 'Click "New Exit Record" to begin processing a resignation or exit' : 'Try adjusting filters'}</p>
          {items.length === 0 && !showTrashed && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition"><Plus className="w-4 h-4" /> New Exit Record</button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-3 w-10"><input type="checkbox" className="rounded border-slate-300" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} /></th>
                  <th className="py-3 px-4 w-8 text-center">#</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Exit Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Clearance</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Rehire</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {paginated.map((item, idx) => {
                  const prog = item.clearance_progress || { done: 0, total: 10, pct: 0 };
                  const progColor = prog.pct === 100 ? 'bg-emerald-500' : prog.pct >= 50 ? 'bg-amber-400' : 'bg-slate-300';
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors ${selectedIds.has(item.id) ? 'bg-orange-50/30' : ''}`}>
                      <td className="py-3 px-3"><input type="checkbox" className="rounded border-slate-300" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{item.staff_name || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.staff_employee_id}</span>
                        <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${item.staff_type === 'teacher' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {item.staff_type === 'teacher' ? 'Teaching' : 'Non-Teaching'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{typeBadge(item.exit_type)}</td>
                      <td className="py-3 px-4 text-[11px] font-mono text-slate-600 space-y-0.5">
                        {item.resignation_date && <div><span className="text-slate-400 text-[9px] font-sans">Resign: </span>{fmt(item.resignation_date)}</div>}
                        {item.last_working_date && <div><span className="text-slate-400 text-[9px] font-sans">Last: </span>{fmt(item.last_working_date)}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${progColor}`} style={{ width: `${prog.pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{prog.done}/{prog.total}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{ratingStars(item.exit_rating)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${item.rehire_eligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {item.rehire_eligible ? '✓ Eligible' : '✗ Not Eligible'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {showTrashed ? statusBadge(item.exit_status) : (
                          <button onClick={() => openStatusModal(item)} className="group flex items-center gap-1">
                            {statusBadge(item.exit_status)}
                            <ChevronDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {showTrashed ? (
                            <>
                              <button onClick={() => handleRestore(item.id)} className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleForceDelete(item.id)} className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition" title="Permanently Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setViewItem(item); setShowView(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-orange-500 transition" title="View Clearance"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => openEdit(item)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600 transition" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { setDeleteItem(item); setShowDelete(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
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
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Showing {Math.min((page-1)*PAGE_SIZE+1,filtered.length)}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="w-3.5 h-3.5" /></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter(pg=>pg===1||pg===totalPages||Math.abs(pg-page)<=1).map((pg,idx,arr)=>{
                const prev=arr[idx-1]; const e=prev&&pg-prev>1;
                return(<React.Fragment key={pg}>{e&&<span className="text-slate-400 px-1 text-xs">...</span>}<button className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${pg===page?'bg-orange-600 border-orange-600 text-white':'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={()=>setPage(pg)}>{pg}</button></React.Fragment>);
              })}
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ADD/EDIT MODAL ═══════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><LogOut className="w-4 h-4 text-orange-500" /> {editingItem ? 'Edit Exit Record' : 'New Exit Record'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0 bg-slate-50">
              {(['basic', 'clearance', 'settlement'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${activeTab === tab ? 'text-orange-600 border-b-2 border-orange-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab === 'basic' ? '📋 Basic' : tab === 'clearance' ? '✅ Clearance' : '💰 Settlement'}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">

                {/* TAB: BASIC */}
                {activeTab === 'basic' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff Member <span className="text-rose-500">*</span></label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 cursor-pointer"
                          value={form.staff_id ? `${form.staff_id}|${form.staff_type}` : ''} onChange={e => { const [id,type]=e.target.value.split('|'); setForm(p=>({...p,staff_id:id||'',staff_type:type||''})); }} required disabled={!!editingItem}>
                          <option value="">Select Staff Member</option>
                          {staffList.map(s => <option key={`${s.id}-${s.type}`} value={`${s.id}|${s.type}`}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exit Type <span className="text-rose-500">*</span></label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 cursor-pointer"
                          value={form.exit_type} onChange={e => setForm(p => ({ ...p, exit_type: e.target.value }))}>
                          {EXIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Initial Status</label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 cursor-pointer"
                          value={form.exit_status} onChange={e => setForm(p => ({ ...p, exit_status: e.target.value }))}>
                          {Object.entries(STATUS_MAP).map(([v,s]) => <option key={v} value={v}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Resignation / Notice Date</label>
                        <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                          value={form.resignation_date} onChange={e => setForm(p => ({ ...p, resignation_date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Last Working Date</label>
                        <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                          value={form.last_working_date} onChange={e => setForm(p => ({ ...p, last_working_date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notice Period End Date</label>
                        <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                          value={form.notice_period_end_date} onChange={e => setForm(p => ({ ...p, notice_period_end_date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notice Period Duration</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                          placeholder="e.g. 30 days, 60 days" value={form.notice_period} onChange={e => setForm(p => ({ ...p, notice_period: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Relieving Date</label>
                        <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                          value={form.relieving_date} onChange={e => setForm(p => ({ ...p, relieving_date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Resignation Letter Ref.</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                          placeholder="e.g. RL/2024/001" value={form.resignation_letter_ref} onChange={e => setForm(p => ({ ...p, resignation_letter_ref: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-400" checked={form.notice_period_waived} onChange={e => setForm(p => ({ ...p, notice_period_waived: e.target.checked }))} />
                          <span className="text-xs font-semibold text-slate-700">Notice Period Waived</span>
                        </label>
                        <div className="h-4 w-px bg-slate-200 mx-2" />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-400" checked={form.rehire_eligible} onChange={e => setForm(p => ({ ...p, rehire_eligible: e.target.checked }))} />
                          <span className="text-xs font-semibold text-slate-700">Eligible for Rehire</span>
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason for Exit</label>
                        <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" rows={2}
                          placeholder="Describe the reason..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exit Interview Notes</label>
                        <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" rows={2}
                          placeholder="Notes from exit interview..." value={form.exit_interview_notes} onChange={e => setForm(p => ({ ...p, exit_interview_notes: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exit Interview Rating (1–5)</label>
                        <div className="flex items-center gap-2">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} type="button" onClick={() => setForm(p => ({ ...p, exit_rating: n.toString() }))}
                              className={`w-8 h-8 rounded-full border text-xs font-bold transition ${parseInt(form.exit_rating) === n ? 'bg-amber-400 border-amber-400 text-white' : 'border-slate-200 text-slate-600 hover:bg-amber-50'}`}>
                              {n}
                            </button>
                          ))}
                          {form.exit_rating && <button type="button" onClick={() => setForm(p => ({ ...p, exit_rating: '' }))} className="text-slate-400 hover:text-slate-600 text-[10px]">Clear</button>}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB: CLEARANCE */}
                {activeTab === 'clearance' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500">Mark clearance items as completed. These can also be updated individually from the view page.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CLEARANCE_KEYS.map(key => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl hover:bg-orange-50 border border-transparent hover:border-orange-100 transition">
                          <input type="checkbox" className="rounded border-slate-300 text-orange-500 focus:ring-orange-400" checked={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                          <span className="text-xs font-semibold text-slate-700">{CLEARANCE_LABELS[key]}</span>
                        </label>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clearance Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        value={form.clearance_date} onChange={e => setForm(p => ({ ...p, clearance_date: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* TAB: SETTLEMENT */}
                {activeTab === 'settlement' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Approved By</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        placeholder="Name/authority" value={form.approved_by} onChange={e => setForm(p => ({ ...p, approved_by: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Approval Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        value={form.approved_date} onChange={e => setForm(p => ({ ...p, approved_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Final Settlement Amount (₹)</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        min="0" placeholder="e.g. 50000" value={form.final_settlement_amount} onChange={e => setForm(p => ({ ...p, final_settlement_amount: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Settlement Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        value={form.final_settlement_date} onChange={e => setForm(p => ({ ...p, final_settlement_date: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">HR Remarks</label>
                      <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" rows={3}
                        value={form.hr_remarks} onChange={e => setForm(p => ({ ...p, hr_remarks: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white sticky bottom-0">
                <div className="flex gap-1">{(['basic','clearance','settlement'] as const).map(tab => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`w-2 h-2 rounded-full transition ${activeTab===tab?'bg-orange-500':'bg-slate-200'}`} />)}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50">
                    {saving ? 'Saving...' : editingItem ? 'Update Record' : 'Create Record'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ VIEW / CLEARANCE MODAL ═══════ */}
      {showView && viewItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-xl max-h-[88vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-orange-500" /> Exit Details — {viewItem.staff_name}</h3>
              <button onClick={() => setShowView(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg shrink-0"><LogOut className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{viewItem.staff_name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{viewItem.staff_employee_id}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {typeBadge(viewItem.exit_type)}
                    {statusBadge(viewItem.exit_status)}
                    {!viewItem.rehire_eligible && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[9px]"><AlertTriangle className="w-2.5 h-2.5" />Not Rehirable</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">{ratingStars(viewItem.exit_rating)}</div>
              </div>

              {/* Clearance progress */}
              {(() => {
                const prog = viewItem.clearance_progress || { done: 0, total: 10, pct: 0 };
                const col  = prog.pct === 100 ? 'bg-emerald-500' : prog.pct >= 50 ? 'bg-amber-400' : 'bg-orange-400';
                return (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Clearance Progress</span>
                      <span className="text-xs font-bold text-slate-600">{prog.done}/{prog.total} ({prog.pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${col}`} style={{ width: `${prog.pct}%` }} />
                    </div>
                  </div>
                );
              })()}

              {/* Interactive clearance checklist */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Tap to Toggle Clearance Items</h4>
                <div className="space-y-1">
                  {CLEARANCE_KEYS.map(key => {
                    const checked   = (viewItem as any)[key];
                    const isLoading = togglingId === `${viewItem.id}-${key}`;
                    return (
                      <button key={key} type="button" onClick={() => toggleClearance(viewItem, key)} disabled={isLoading}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-left ${checked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : checked ? <CheckSquare className="w-4 h-4 shrink-0 text-emerald-500" /> : <Square className="w-4 h-4 shrink-0" />}
                        <span>{CLEARANCE_LABELS[key]}</span>
                        {checked && <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Resignation Date', fmt(viewItem.resignation_date)],
                  ['Last Working Day', fmt(viewItem.last_working_date)],
                  ['Notice Period End', fmt(viewItem.notice_period_end_date)],
                  ['Relieving Date', fmt(viewItem.relieving_date)],
                  ['Clearance Date', fmt(viewItem.clearance_date)],
                  ['Notice Period', viewItem.notice_period],
                  ['Letter Ref.', viewItem.resignation_letter_ref],
                  ['Approved By', viewItem.approved_by],
                  ['Approval Date', fmt(viewItem.approved_date)],
                  ['Settlement', fmtAmt(viewItem.final_settlement_amount)],
                  ['Settlement Date', fmt(viewItem.final_settlement_date)],
                  ['Notice Waived', viewItem.notice_period_waived ? 'Yes' : 'No'],
                ].map(([l, v]) => (
                  <div key={l as string} className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{l}</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">{v || '—'}</span>
                  </div>
                ))}
              </div>

              {viewItem.reason && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Reason</span>
                  <p className="text-xs text-slate-700 mt-1">{viewItem.reason}</p>
                </div>
              )}
              {viewItem.exit_interview_notes && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Exit Interview Notes</span>
                  <p className="text-xs text-slate-700 mt-1">{viewItem.exit_interview_notes}</p>
                </div>
              )}
              {viewItem.hr_remarks && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">HR Remarks</span>
                  <p className="text-xs text-slate-700 mt-1">{viewItem.hr_remarks}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowView(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STATUS UPDATE MODAL ═══════ */}
      {showStatusModal && statusTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Update Exit Status</h3>
              <button onClick={() => setShowStatus(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleStatusUpdate} className="p-6 space-y-3">
              <p className="text-xs text-slate-500">Staff: <strong className="text-slate-700">{statusTarget.staff_name}</strong></p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">New Status</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(STATUS_MAP).map(([v, s]) => (
                    <button key={v} type="button" onClick={() => setStatusForm(p => ({ ...p, exit_status: v }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition text-left ${statusForm.exit_status === v ? 'ring-2 ring-orange-400 ' + s.bg + ' ' + s.text + ' ' + s.border : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Approved By</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400"
                  value={statusForm.approved_by} onChange={e => setStatusForm(p => ({ ...p, approved_by: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">HR Remarks</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-400"
                  rows={2} value={statusForm.hr_remarks} onChange={e => setStatusForm(p => ({ ...p, hr_remarks: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowStatus(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ DELETE MODAL ═══════ */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-sm font-bold text-slate-800">Delete Exit Record</h3>
              <p className="text-xs text-slate-500 mt-2">Delete exit record for <strong className="text-slate-700">{deleteItem.staff_name}</strong>?</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition" disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
