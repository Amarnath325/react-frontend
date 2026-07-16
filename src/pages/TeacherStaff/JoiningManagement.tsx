import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  ClipboardList, Search, Plus, Trash2, Edit3, Eye, RefreshCw, X,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight,
  RotateCcw, Archive, UserCheck, Calendar, Building2,
  CheckSquare, Square, AlertCircle, Loader2, ChevronDown
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
interface ChecklistProgress { done: number; total: number; pct: number; }

interface Onboarding {
  id: number;
  school_id: number;
  staff_id: number;
  staff_type: string;
  joining_date: string;
  reporting_date: string | null;
  joining_letter_number: string | null;
  joining_letter_date: string | null;
  probation_period: string | null;
  probation_end_date: string | null;
  employment_type: string;
  offer_letter_sent: boolean;
  appointment_letter_issued: boolean;
  documents_collected: boolean;
  id_card_issued: boolean;
  email_created: boolean;
  system_access_given: boolean;
  induction_completed: boolean;
  bank_details_collected: boolean;
  pf_registration_done: boolean;
  esi_registration_done: boolean;
  assigned_mentor: string | null;
  assigned_cabin_desk: string | null;
  assigned_class_section: string | null;
  induction_notes: string | null;
  remarks: string | null;
  onboarding_status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  onboarding_completed_date: string | null;
  is_active: boolean;
  staff_name?: string;
  staff_employee_id?: string;
  staff_designation?: string;
  checklist_progress?: ChecklistProgress;
  deleted_at?: string | null;
}

interface StaffOption {
  id: number; name: string; employee_id: string; type: string;
  label: string; joining_date: string | null; has_onboarding: boolean;
}

/* ─── constants ─────────────────────────────────── */
const EMP_TYPES = [
  { value: 'permanent',    label: 'Permanent' },
  { value: 'temporary',    label: 'Temporary' },
  { value: 'contractual',  label: 'Contractual' },
  { value: 'probation',    label: 'Probation' },
  { value: 'part_time',    label: 'Part Time' },
];

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',     bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200', icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200', icon: <Loader2 className="w-3 h-3" /> },
  completed:   { label: 'Completed',   bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  on_hold:     { label: 'On Hold',     bg: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-200', icon: <AlertCircle className="w-3 h-3" /> },
};

const EMP_TYPE_COLORS: Record<string, string> = {
  permanent:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  temporary:   'bg-amber-50 text-amber-700 border-amber-100',
  contractual: 'bg-sky-50 text-sky-700 border-sky-100',
  probation:   'bg-violet-50 text-violet-700 border-violet-100',
  part_time:   'bg-orange-50 text-orange-700 border-orange-100',
};

const CHECKLIST_LABELS: Record<string, string> = {
  offer_letter_sent:          'Offer Letter Sent',
  appointment_letter_issued:  'Appointment Letter Issued',
  documents_collected:        'Documents Collected',
  id_card_issued:             'ID Card Issued',
  email_created:              'Official Email Created',
  system_access_given:        'System Access Given',
  induction_completed:        'Induction Completed',
  bank_details_collected:     'Bank Details Collected',
  pf_registration_done:       'PF Registration Done',
  esi_registration_done:      'ESI Registration Done',
};

const CHECKLIST_KEYS = Object.keys(CHECKLIST_LABELS);

const PAGE_SIZE = 10;

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export default function JoiningManagement() {
  const [items, setItems] = useState<Onboarding[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmpType, setFilterEmpType] = useState('');
  const [page, setPage] = useState(1);
  const [showTrashed, setShowTrashed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Onboarding | null>(null);
  const [viewItem, setViewItem] = useState<Onboarding | null>(null);
  const [deleteItem, setDeleteItem] = useState<Onboarding | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form
  const initForm = () => ({
    staff_id: '', staff_type: '',
    joining_date: '', reporting_date: '', joining_letter_number: '',
    joining_letter_date: '', probation_period: '', probation_end_date: '',
    employment_type: 'permanent',
    offer_letter_sent: false, appointment_letter_issued: false, documents_collected: false,
    id_card_issued: false, email_created: false, system_access_given: false,
    induction_completed: false, bank_details_collected: false,
    pf_registration_done: false, esi_registration_done: false,
    assigned_mentor: '', assigned_cabin_desk: '', assigned_class_section: '',
    induction_notes: '', remarks: '',
    onboarding_status: 'pending' as Onboarding['onboarding_status'],
  });
  const [form, setForm] = useState(initForm());

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlertMsg = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (showTrashed) params.only_trashed = true;
      if (filterStatus) params.onboarding_status = filterStatus;
      if (filterEmpType) params.employment_type = filterEmpType;
      const res = await api.get('/school/staff-onboarding', { params });
      if (res.data.success) setItems(res.data.data || []);
    } catch { showAlertMsg('err', 'Failed to load onboarding records'); }
    finally { setLoading(false); }
  }, [showAlertMsg, showTrashed, filterStatus, filterEmpType]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/school/staff-onboarding/staff-list');
      if (res.data.success) setStaffList(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchItems(); setSelectedIds(new Set()); setPage(1); }, [fetchItems]);
  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  /* ════════ FORM ════════ */
  const openAdd = () => { setEditingItem(null); setForm(initForm()); setShowModal(true); };

  const openEdit = (item: Onboarding) => {
    setEditingItem(item);
    setForm({
      staff_id: item.staff_id.toString(), staff_type: item.staff_type,
      joining_date: item.joining_date?.split('T')[0] || '',
      reporting_date: item.reporting_date?.split('T')[0] || '',
      joining_letter_number: item.joining_letter_number || '',
      joining_letter_date: item.joining_letter_date?.split('T')[0] || '',
      probation_period: item.probation_period || '',
      probation_end_date: item.probation_end_date?.split('T')[0] || '',
      employment_type: item.employment_type,
      offer_letter_sent: item.offer_letter_sent,
      appointment_letter_issued: item.appointment_letter_issued,
      documents_collected: item.documents_collected,
      id_card_issued: item.id_card_issued,
      email_created: item.email_created,
      system_access_given: item.system_access_given,
      induction_completed: item.induction_completed,
      bank_details_collected: item.bank_details_collected,
      pf_registration_done: item.pf_registration_done,
      esi_registration_done: item.esi_registration_done,
      assigned_mentor: item.assigned_mentor || '',
      assigned_cabin_desk: item.assigned_cabin_desk || '',
      assigned_class_section: item.assigned_class_section || '',
      induction_notes: item.induction_notes || '',
      remarks: item.remarks || '',
      onboarding_status: item.onboarding_status,
    });
    setShowModal(true);
  };

  const handleStaffSelect = (val: string) => {
    if (!val) { setForm(p => ({ ...p, staff_id: '', staff_type: '' })); return; }
    const [id, type] = val.split('|');
    const staff = staffList.find(s => s.id.toString() === id && s.type === type);
    setForm(p => ({
      ...p, staff_id: id, staff_type: type,
      joining_date: staff?.joining_date?.split('T')[0] || p.joining_date,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id || !form.joining_date) {
      showAlertMsg('err', 'Staff member and joining date are required'); return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        staff_id: parseInt(form.staff_id),
      };
      // Clean empties to null
      (['reporting_date','joining_letter_number','joining_letter_date','probation_period',
        'probation_end_date','assigned_mentor','assigned_cabin_desk','assigned_class_section',
        'induction_notes','remarks'] as const).forEach(k => { if (!payload[k]) payload[k] = null; });

      if (editingItem) {
        const res = await api.put(`/school/staff-onboarding/${editingItem.id}`, payload);
        if (res.data.success) showAlertMsg('ok', 'Onboarding record updated');
      } else {
        const res = await api.post('/school/staff-onboarding', payload);
        if (res.data.success) showAlertMsg('ok', 'Onboarding record created');
      }
      setShowModal(false); fetchItems(); fetchStaff();
    } catch (err: any) {
      showAlertMsg('err', err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  /* ════════ CHECKLIST TOGGLE (inline) ════════ */
  const handleChecklistToggle = async (item: Onboarding, field: string) => {
    const key = `${item.id}-${field}`;
    setTogglingId(key);
    try {
      const res = await api.patch(`/school/staff-onboarding/${item.id}/toggle-checklist`, { field });
      if (res.data.success) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...res.data.data } : i));
      }
    } catch { showAlertMsg('err', 'Toggle failed'); }
    finally { setTogglingId(null); }
  };

  /* ════════ STATUS UPDATE ════════ */
  const handleStatusUpdate = async (item: Onboarding, status: string) => {
    try {
      const res = await api.patch(`/school/staff-onboarding/${item.id}/update-status`, { onboarding_status: status });
      if (res.data.success) { showAlertMsg('ok', 'Status updated'); fetchItems(); }
    } catch { showAlertMsg('err', 'Status update failed'); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/school/staff-onboarding/${deleteItem.id}`);
      if (res.data.success) { showAlertMsg('ok', 'Deleted'); setShowDeleteModal(false); fetchItems(); fetchStaff(); }
    } catch { showAlertMsg('err', 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleRestore = async (id: number) => {
    try { await api.post(`/school/staff-onboarding/${id}/restore`); showAlertMsg('ok', 'Restored'); fetchItems(); fetchStaff(); } catch { showAlertMsg('err', 'Restore failed'); }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete? Cannot be undone.')) return;
    try { await api.delete(`/school/staff-onboarding/${id}/force`); showAlertMsg('ok', 'Permanently deleted'); fetchItems(); } catch { showAlertMsg('err', 'Failed'); }
  };

  /* ════════ BULK ════════ */
  const toggleSelectAll = () => { selectedIds.size === paginated.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(paginated.map(i => i.id))); };
  const toggleSelect = (id: number) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };

  const bulkDelete = async (force = false) => {
    if (!confirm(force ? 'Permanently delete selected?' : 'Delete selected?')) return;
    try { const res = await api.post('/school/staff-onboarding/bulk-delete', { ids: Array.from(selectedIds), force }); if (res.data.success) { showAlertMsg('ok', res.data.message); setSelectedIds(new Set()); fetchItems(); } } catch { showAlertMsg('err', 'Failed'); }
  };

  const bulkRestore = async () => {
    try { const res = await api.post('/school/staff-onboarding/bulk-restore', { ids: Array.from(selectedIds) }); if (res.data.success) { showAlertMsg('ok', res.data.message); setSelectedIds(new Set()); fetchItems(); } } catch { showAlertMsg('err', 'Failed'); }
  };

  /* ════════ HELPERS ════════ */
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const empLabel = (v: string) => EMP_TYPES.find(t => t.value === v)?.label || v;

  const statusBadge = (status: string) => {
    const s = STATUS_MAP[status] || STATUS_MAP.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] border ${s.bg} ${s.text} ${s.border}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  /* ════════ FILTER + PAGINATE ════════ */
  const filtered = items.filter(item => {
    const ms = search.toLowerCase();
    return !search || (item.staff_name || '').toLowerCase().includes(ms) ||
      (item.staff_employee_id || '').toLowerCase().includes(ms) ||
      (item.joining_letter_number || '').toLowerCase().includes(ms);
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ════════ METRICS ════════ */
  const metrics = {
    total: items.length,
    completed: items.filter(i => i.onboarding_status === 'completed').length,
    inProgress: items.filter(i => i.onboarding_status === 'in_progress').length,
    pending: items.filter(i => i.onboarding_status === 'pending').length,
    onHold: items.filter(i => i.onboarding_status === 'on_hold').length,
  };

  return (
    <div className="space-y-6">
      {alert && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${alert.type === 'err' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          <span className="text-sm">{alert.type === 'err' ? '⚠️' : '✅'}</span><span>{alert.msg}</span>
        </div>
      )}

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-teal-50 text-teal-600 rounded-lg"><ClipboardList className="w-5 h-5" /></span>
            <span>Joining & Onboarding Desk</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Track new staff onboarding, joining formalities, and checklist progress for all staff members</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowTrashed(!showTrashed)} className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition border ${showTrashed ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Archive className="w-3.5 h-3.5" /><span>{showTrashed ? 'Show Active' : 'Trashed'}</span>
          </button>
          <button onClick={fetchItems} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {!showTrashed && (
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /><span>New Onboarding</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════ METRIC CARDS ═══════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total',       value: metrics.total,      bg: 'bg-teal-50',    text: 'text-teal-600',    icon: <ClipboardList className="w-3.5 h-3.5" /> },
          { label: 'Completed',   value: metrics.completed,  bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          { label: 'In Progress', value: metrics.inProgress, bg: 'bg-amber-50',   text: 'text-amber-600',   icon: <Loader2 className="w-3.5 h-3.5" /> },
          { label: 'Pending',     value: metrics.pending,    bg: 'bg-slate-100',  text: 'text-slate-600',   icon: <Clock className="w-3.5 h-3.5" /> },
          { label: 'On Hold',     value: metrics.onHold,     bg: 'bg-rose-50',    text: 'text-rose-600',    icon: <AlertCircle className="w-3.5 h-3.5" /> },
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

      {/* ═══════ CONTROLS ═══════ */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm"
            placeholder="Search by staff name, employee ID, letter number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-500 shadow-sm cursor-pointer"
            value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {Object.entries(STATUS_MAP).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-500 shadow-sm cursor-pointer"
            value={filterEmpType} onChange={e => { setFilterEmpType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* ═══════ BULK BAR ═══════ */}
      {selectedIds.size > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-teal-700">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-teal-200" />
          {showTrashed ? (
            <>
              <button onClick={bulkRestore} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Restore</button>
              <button onClick={() => bulkDelete(true)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Permanent Delete</button>
            </>
          ) : (
            <button onClick={() => bulkDelete(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
          )}
          <button onClick={() => setSelectedIds(new Set())} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-white transition"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ═══════ TABLE ═══════ */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-teal-600 rounded-full animate-spin" /></div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3"><ClipboardList className="w-6 h-6" /></div>
          <h3 className="text-sm font-bold text-slate-800">{items.length === 0 ? (showTrashed ? 'No trashed records' : 'No onboarding records yet') : 'No matching records'}</h3>
          <p className="text-xs text-slate-500 mt-1">{items.length === 0 && !showTrashed ? 'Click "New Onboarding" to start tracking staff joining' : 'Try adjusting filters'}</p>
          {items.length === 0 && !showTrashed && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition"><Plus className="w-4 h-4" /> New Onboarding</button>
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
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Employment Type</th>
                  <th className="py-3 px-4">Checklist</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Probation Ends</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {paginated.map((item, idx) => {
                  const prog = item.checklist_progress || { done: 0, total: 10, pct: 0 };
                  const progressColor = prog.pct === 100 ? 'bg-emerald-500' : prog.pct >= 50 ? 'bg-amber-400' : 'bg-slate-300';
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors ${selectedIds.has(item.id) ? 'bg-teal-50/40' : ''}`}>
                      <td className="py-3 px-3"><input type="checkbox" className="rounded border-slate-300" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{item.staff_name || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{item.staff_employee_id}</span>
                        <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${item.staff_type === 'teacher' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {item.staff_type === 'teacher' ? 'Teaching' : 'Non-Teaching'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-700 block">{formatDate(item.joining_date)}</span>
                        {item.reporting_date && <span className="text-[10px] text-slate-400">Reports: {formatDate(item.reporting_date)}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${EMP_TYPE_COLORS[item.employment_type] || ''}`}>
                          {empLabel(item.employment_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${prog.pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{prog.done}/{prog.total}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 block">{prog.pct}% done</span>
                      </td>
                      <td className="py-3 px-4">
                        {showTrashed ? statusBadge(item.onboarding_status) : (
                          <div className="relative group">
                            {statusBadge(item.onboarding_status)}
                            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-10 min-w-32">
                              {Object.entries(STATUS_MAP).map(([v, s]) => (
                                <button key={v} onClick={() => handleStatusUpdate(item, v)} className={`flex items-center gap-1.5 w-full text-left px-3 py-1.5 text-[10px] font-bold hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${s.text} ${item.onboarding_status === v ? 'bg-slate-50' : ''}`}>
                                  {s.icon} {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{formatDate(item.probation_end_date)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {showTrashed ? (
                            <>
                              <button onClick={() => handleRestore(item.id)} className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleForceDelete(item.id)} className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition" title="Permanently Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setViewItem(item); setShowView(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-teal-600 transition" title="View Checklist"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => openEdit(item)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600 transition" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { setDeleteItem(item); setShowDeleteModal(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <span className="text-[11px] text-slate-500 font-medium">Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1).map((pg, idx, arr) => {
                const prev = arr[idx - 1]; const showEllipsis = prev && pg - prev > 1;
                return (<React.Fragment key={pg}>{showEllipsis && <span className="text-slate-400 px-1 text-xs">...</span>}<button className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${pg === page ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={() => setPage(pg)}>{pg}</button></React.Fragment>);
              })}
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ADD/EDIT MODAL ═══════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-teal-600" /> {editingItem ? 'Edit Onboarding Record' : 'New Onboarding Record'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Section: Staff & Joining */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Staff & Joining Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff Member <span className="text-rose-500">*</span></label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      value={form.staff_id ? `${form.staff_id}|${form.staff_type}` : ''} onChange={e => handleStaffSelect(e.target.value)} required disabled={!!editingItem}>
                      <option value="">Select Staff Member</option>
                      {staffList.map(s => (
                        <option key={`${s.id}-${s.type}`} value={`${s.id}|${s.type}`} disabled={s.has_onboarding && !editingItem}>
                          {s.label}{s.has_onboarding && !editingItem ? ' [Already has record]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Joining Date <span className="text-rose-500">*</span></label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      value={form.joining_date} onChange={e => setForm(p => ({ ...p, joining_date: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reporting Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      value={form.reporting_date} onChange={e => setForm(p => ({ ...p, reporting_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Joining Letter No.</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      placeholder="e.g. JL/2024/001" value={form.joining_letter_number} onChange={e => setForm(p => ({ ...p, joining_letter_number: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Letter Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      value={form.joining_letter_date} onChange={e => setForm(p => ({ ...p, joining_letter_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employment Type <span className="text-rose-500">*</span></label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      value={form.employment_type} onChange={e => setForm(p => ({ ...p, employment_type: e.target.value }))}>
                      {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Probation Period</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      placeholder="e.g. 3 months, 6 months" value={form.probation_period} onChange={e => setForm(p => ({ ...p, probation_period: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Probation End Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      value={form.probation_end_date} onChange={e => setForm(p => ({ ...p, probation_end_date: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Section: Onboarding Checklist */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Onboarding Checklist</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHECKLIST_KEYS.map(key => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition">
                      <input type="checkbox" checked={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      <span className="text-xs font-semibold text-slate-700">{CHECKLIST_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section: Assignments */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><Building2 className="w-3 h-3" /> Assignments & Notes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Mentor</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      placeholder="Name of mentor" value={form.assigned_mentor} onChange={e => setForm(p => ({ ...p, assigned_mentor: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cabin / Desk</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      placeholder="e.g. Staff Room - Desk 4" value={form.assigned_cabin_desk} onChange={e => setForm(p => ({ ...p, assigned_cabin_desk: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Class / Section</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      placeholder="e.g. Class 8A, 9B" value={form.assigned_class_section} onChange={e => setForm(p => ({ ...p, assigned_class_section: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Onboarding Status</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      value={form.onboarding_status} onChange={e => setForm(p => ({ ...p, onboarding_status: e.target.value as Onboarding['onboarding_status'] }))}>
                      {Object.entries(STATUS_MAP).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Induction Notes</label>
                    <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      rows={2} placeholder="Notes from induction session..." value={form.induction_notes} onChange={e => setForm(p => ({ ...p, induction_notes: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks</label>
                    <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editingItem ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ VIEW / CHECKLIST MODAL ═══════ */}
      {showView && viewItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-teal-600" /> Onboarding Checklist — {viewItem.staff_name}</h3>
              <button onClick={() => setShowView(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Progress bar */}
              {(() => {
                const prog = viewItem.checklist_progress || { done: 0, total: 10, pct: 0 };
                const progressColor = prog.pct === 100 ? 'bg-emerald-500' : prog.pct >= 50 ? 'bg-amber-400' : 'bg-teal-400';
                return (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Overall Progress</span>
                      <span className="text-xs font-bold text-slate-600">{prog.done}/{prog.total} ({prog.pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${prog.pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">{statusBadge(viewItem.onboarding_status)}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{formatDate(viewItem.joining_date)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive checklist */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Tap to Toggle Checklist Items</h4>
                {CHECKLIST_KEYS.map(key => {
                  const checked = (viewItem as any)[key];
                  const isToggling = togglingId === `${viewItem.id}-${key}`;
                  return (
                    <button key={key} onClick={() => handleChecklistToggle(viewItem, key)} disabled={isToggling}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-left ${checked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      {isToggling ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : checked ? <CheckSquare className="w-4 h-4 shrink-0 text-emerald-500" /> : <Square className="w-4 h-4 shrink-0" />}
                      <span>{CHECKLIST_LABELS[key]}</span>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Employment Type', empLabel(viewItem.employment_type)],
                  ['Probation Period', viewItem.probation_period],
                  ['Probation End', formatDate(viewItem.probation_end_date)],
                  ['Assigned Mentor', viewItem.assigned_mentor],
                  ['Cabin / Desk', viewItem.assigned_cabin_desk],
                  ['Class / Section', viewItem.assigned_class_section],
                  ['Letter No.', viewItem.joining_letter_number],
                  ['Completed On', formatDate(viewItem.onboarding_completed_date)],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{label}</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">{value || '—'}</span>
                  </div>
                ))}
              </div>

              {viewItem.induction_notes && (
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Induction Notes</span>
                  <p className="text-xs text-slate-700 mt-1">{viewItem.induction_notes}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowView(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DELETE MODAL ═══════ */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-sm font-bold text-slate-800">Delete Onboarding Record</h3>
              <p className="text-xs text-slate-500 mt-2">Delete onboarding record for <strong className="text-slate-700">{deleteItem.staff_name}</strong>?</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition" disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
