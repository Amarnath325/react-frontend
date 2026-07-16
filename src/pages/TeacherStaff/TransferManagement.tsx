import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  ArrowLeftRight, Search, Plus, Trash2, Edit3, Eye, RefreshCw, X,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, RotateCcw,
  Archive, ArrowRight, MapPin, Building2, Calendar, Banknote,
  ChevronDown, AlertCircle, Loader2, FileText, Check
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface Transfer {
  id: number;
  school_id: number;
  staff_id: number;
  staff_type: string;
  transfer_type: string;
  transfer_status: string;
  from_department: string | null;
  from_designation: string | null;
  from_location: string | null;
  from_class_section: string | null;
  to_department: string | null;
  to_designation: string | null;
  to_location: string | null;
  to_class_section: string | null;
  request_date: string;
  effective_date: string | null;
  expected_joining_date: string | null;
  actual_joining_date: string | null;
  relieving_date: string | null;
  transfer_order_number: string | null;
  transfer_order_date: string | null;
  approved_by: string | null;
  approved_date: string | null;
  reason: string | null;
  remarks: string | null;
  relocation_allowance_given: boolean;
  relocation_allowance_amount: number | null;
  new_address: string | null;
  is_active: boolean;
  staff_name?: string;
  staff_employee_id?: string;
  staff_department?: string;
  deleted_at?: string | null;
}

interface StaffOption {
  id: number; type: string; name: string; employee_id: string;
  department: string | null; designation: string | null; label: string;
}

/* ─── constants ──────────────────────────────────────── */
const TRANSFER_TYPES = [
  { value: 'internal',      label: 'Internal Transfer',   desc: 'Dept/Section/Class' },
  { value: 'external_in',   label: 'External In',         desc: 'From another school' },
  { value: 'external_out',  label: 'External Out',        desc: 'To another school/org' },
  { value: 'relocation',    label: 'Relocation',          desc: 'City/Area change' },
  { value: 'deputation',    label: 'Deputation',          desc: 'Temporary assignment' },
];

const TRANSFER_STATUSES = [
  { value: 'requested',  label: 'Requested',  color: 'bg-slate-100 text-slate-600 border-slate-200',   icon: <Clock className="w-3 h-3" /> },
  { value: 'approved',   label: 'Approved',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  { value: 'rejected',   label: 'Rejected',   color: 'bg-rose-50 text-rose-700 border-rose-200',       icon: <XCircle className="w-3 h-3" /> },
  { value: 'cancelled',  label: 'Cancelled',  color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: <AlertCircle className="w-3 h-3" /> },
  { value: 'completed',  label: 'Completed',  color: 'bg-sky-50 text-sky-700 border-sky-200',          icon: <Check className="w-3 h-3" /> },
];

const TYPE_COLORS: Record<string, string> = {
  internal:     'bg-violet-50 text-violet-700 border-violet-200',
  external_in:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  external_out: 'bg-orange-50 text-orange-700 border-orange-200',
  relocation:   'bg-sky-50 text-sky-700 border-sky-200',
  deputation:   'bg-amber-50 text-amber-700 border-amber-200',
};

const PAGE_SIZE = 10;

const initForm = () => ({
  staff_id: '', staff_type: '',
  transfer_type: 'internal', transfer_status: 'requested',
  from_department: '', from_designation: '', from_location: '', from_class_section: '',
  to_department: '', to_designation: '', to_location: '', to_class_section: '',
  request_date: new Date().toISOString().split('T')[0],
  effective_date: '', expected_joining_date: '', actual_joining_date: '', relieving_date: '',
  transfer_order_number: '', transfer_order_date: '',
  approved_by: '', approved_date: '', reason: '', remarks: '',
  relocation_allowance_given: false, relocation_allowance_amount: '', new_address: '',
});

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function TransferManagement() {
  const [items, setItems]     = useState<Transfer[]>([]);
  const [staffList, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [alert, setAlert]     = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterType, setFilterType]       = useState('');
  const [page, setPage]                   = useState(1);
  const [showTrashed, setShowTrashed]     = useState(false);
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set());

  const [showModal, setShowModal]         = useState(false);
  const [showView, setShowView]           = useState(false);
  const [showDeleteModal, setShowDelete]  = useState(false);
  const [showStatusModal, setShowStatus]  = useState(false);
  const [editingItem, setEditingItem]     = useState<Transfer | null>(null);
  const [viewItem, setViewItem]           = useState<Transfer | null>(null);
  const [deleteItem, setDeleteItem]       = useState<Transfer | null>(null);
  const [statusTarget, setStatusTarget]   = useState<Transfer | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [activeTab, setActiveTab]         = useState<'basic' | 'dates' | 'admin'>('basic');

  const [form, setForm] = useState(initForm());
  const [statusForm, setStatusForm] = useState({ transfer_status: '', approved_by: '', approved_date: '', remarks: '' });

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
      if (filterStatus) params.transfer_status = filterStatus;
      if (filterType)   params.transfer_type   = filterType;
      const res = await api.get('/school/staff-transfers', { params });
      if (res.data.success) setItems(res.data.data || []);
    } catch { showAlertMsg('err', 'Failed to load transfer records'); }
    finally { setLoading(false); }
  }, [showAlertMsg, showTrashed, filterStatus, filterType]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/school/staff-transfers/staff-list');
      if (res.data.success) setStaff(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchItems(); setSelectedIds(new Set()); setPage(1); }, [fetchItems]);
  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  /* ════════ FORM ════════ */
  const openAdd = () => {
    setEditingItem(null); setForm(initForm()); setActiveTab('basic'); setShowModal(true);
  };

  const openEdit = (item: Transfer) => {
    setEditingItem(item);
    setForm({
      staff_id: item.staff_id.toString(), staff_type: item.staff_type,
      transfer_type: item.transfer_type, transfer_status: item.transfer_status,
      from_department: item.from_department || '', from_designation: item.from_designation || '',
      from_location: item.from_location || '', from_class_section: item.from_class_section || '',
      to_department: item.to_department || '', to_designation: item.to_designation || '',
      to_location: item.to_location || '', to_class_section: item.to_class_section || '',
      request_date: item.request_date?.split('T')[0] || '',
      effective_date: item.effective_date?.split('T')[0] || '',
      expected_joining_date: item.expected_joining_date?.split('T')[0] || '',
      actual_joining_date: item.actual_joining_date?.split('T')[0] || '',
      relieving_date: item.relieving_date?.split('T')[0] || '',
      transfer_order_number: item.transfer_order_number || '',
      transfer_order_date: item.transfer_order_date?.split('T')[0] || '',
      approved_by: item.approved_by || '', approved_date: item.approved_date?.split('T')[0] || '',
      reason: item.reason || '', remarks: item.remarks || '',
      relocation_allowance_given: item.relocation_allowance_given,
      relocation_allowance_amount: item.relocation_allowance_amount?.toString() || '',
      new_address: item.new_address || '',
    });
    setActiveTab('basic'); setShowModal(true);
  };

  const handleStaffSelect = (val: string) => {
    if (!val) { setForm(p => ({ ...p, staff_id: '', staff_type: '' })); return; }
    const [id, type] = val.split('|');
    const staff = staffList.find(s => s.id.toString() === id && s.type === type);
    setForm(p => ({
      ...p, staff_id: id, staff_type: type,
      from_department: staff?.department || p.from_department,
      from_designation: staff?.designation || p.from_designation,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id || !form.request_date) {
      showAlertMsg('err', 'Staff member and request date are required'); return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form, staff_id: parseInt(form.staff_id) };
      // nullify empties
      const nullables = ['effective_date','expected_joining_date','actual_joining_date','relieving_date',
        'transfer_order_number','transfer_order_date','approved_by','approved_date',
        'reason','remarks','from_department','from_designation','from_location','from_class_section',
        'to_department','to_designation','to_location','to_class_section','new_address'];
      nullables.forEach(k => { if (!payload[k]) payload[k] = null; });
      if (!payload['relocation_allowance_amount']) payload['relocation_allowance_amount'] = null;
      else payload['relocation_allowance_amount'] = parseFloat(payload['relocation_allowance_amount'] as string);

      if (editingItem) {
        const res = await api.put(`/school/staff-transfers/${editingItem.id}`, payload);
        if (res.data.success) showAlertMsg('ok', 'Transfer record updated');
      } else {
        const res = await api.post('/school/staff-transfers', payload);
        if (res.data.success) showAlertMsg('ok', 'Transfer record created');
      }
      setShowModal(false); fetchItems();
    } catch (err: any) {
      showAlertMsg('err', err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  /* ════════ STATUS UPDATE ════════ */
  const openStatusModal = (item: Transfer) => {
    setStatusTarget(item);
    setStatusForm({ transfer_status: item.transfer_status, approved_by: item.approved_by || '', approved_date: item.approved_date?.split('T')[0] || '', remarks: item.remarks || '' });
    setShowStatus(true);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    try {
      const res = await api.patch(`/school/staff-transfers/${statusTarget.id}/update-status`, statusForm);
      if (res.data.success) { showAlertMsg('ok', res.data.message); setShowStatus(false); fetchItems(); }
    } catch (err: any) {
      showAlertMsg('err', err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/school/staff-transfers/${deleteItem.id}`);
      if (res.data.success) { showAlertMsg('ok', 'Deleted'); setShowDelete(false); fetchItems(); }
    } catch { showAlertMsg('err', 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleRestore    = async (id: number) => { try { await api.post(`/school/staff-transfers/${id}/restore`); showAlertMsg('ok','Restored'); fetchItems(); } catch { showAlertMsg('err','Failed'); } };
  const handleForceDelete = async (id: number) => { if (!confirm('Permanently delete?')) return; try { await api.delete(`/school/staff-transfers/${id}/force`); showAlertMsg('ok','Permanently deleted'); fetchItems(); } catch { showAlertMsg('err','Failed'); } };

  /* ════════ BULK ════════ */
  const toggleSelectAll = () => { selectedIds.size === paginated.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(paginated.map(i => i.id))); };
  const toggleSelect    = (id: number) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };

  const bulkAction = async (action: 'delete' | 'restore' | 'status', extra?: { force?: boolean; status?: string }) => {
    if (selectedIds.size === 0) return;
    try {
      if (action === 'delete') {
        if (!confirm(extra?.force ? 'Permanently delete selected?' : 'Delete selected?')) return;
        const res = await api.post('/school/staff-transfers/bulk-delete', { ids: Array.from(selectedIds), force: extra?.force });
        if (res.data.success) showAlertMsg('ok', res.data.message);
      } else if (action === 'restore') {
        const res = await api.post('/school/staff-transfers/bulk-restore', { ids: Array.from(selectedIds) });
        if (res.data.success) showAlertMsg('ok', res.data.message);
      } else if (action === 'status' && extra?.status) {
        const res = await api.post('/school/staff-transfers/bulk-status', { ids: Array.from(selectedIds), status: extra.status });
        if (res.data.success) showAlertMsg('ok', res.data.message);
      }
      setSelectedIds(new Set()); fetchItems();
    } catch { showAlertMsg('err', 'Bulk action failed'); }
  };

  /* ════════ HELPERS ════════ */
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatAmount = (v: number | null) => v ? '₹' + v.toLocaleString('en-IN') : '—';
  const typeInfo = (v: string) => TRANSFER_TYPES.find(t => t.value === v) || { label: v, desc: '' };
  const statusInfo = (v: string) => TRANSFER_STATUSES.find(s => s.value === v) || TRANSFER_STATUSES[0];

  const statusBadge = (status: string) => {
    const s = statusInfo(status);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] border ${s.color}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const typeBadge = (type: string) => {
    const t = typeInfo(type);
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${TYPE_COLORS[type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {t.label}
      </span>
    );
  };

  /* ════════ FILTER + PAGINATE ════════ */
  const filtered = items.filter(item => {
    const ms = search.toLowerCase();
    return !search ||
      (item.staff_name || '').toLowerCase().includes(ms) ||
      (item.staff_employee_id || '').toLowerCase().includes(ms) ||
      (item.from_location || '').toLowerCase().includes(ms) ||
      (item.to_location || '').toLowerCase().includes(ms) ||
      (item.transfer_order_number || '').toLowerCase().includes(ms);
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ════════ METRICS ════════ */
  const M = {
    total:     items.length,
    requested: items.filter(i => i.transfer_status === 'requested').length,
    approved:  items.filter(i => i.transfer_status === 'approved').length,
    completed: items.filter(i => i.transfer_status === 'completed').length,
    rejected:  items.filter(i => i.transfer_status === 'rejected').length,
  };

  /* ─── Form field helper ─── */
  const F = (label: string, key: string, opts?: { type?: string; placeholder?: string; span?: boolean }) => (
    <div className={opts?.span ? 'sm:col-span-2' : ''}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
      <input type={opts?.type || 'text'} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
        placeholder={opts?.placeholder} value={(form as any)[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
    </div>
  );

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
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg"><ArrowLeftRight className="w-5 h-5" /></span>
            <span>Transfer & Relocation Desk</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Manage staff transfers, relocations, deputations, and movement orders across departments and locations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowTrashed(!showTrashed)} className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition border ${showTrashed ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Archive className="w-3.5 h-3.5" /><span>{showTrashed ? 'Show Active' : 'Trashed'}</span>
          </button>
          <button onClick={fetchItems} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {!showTrashed && (
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /><span>New Transfer</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════ METRIC CARDS ═══════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total',     value: M.total,     bg: 'bg-rose-50',    text: 'text-rose-600',    icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
          { label: 'Requested', value: M.requested, bg: 'bg-slate-100',  text: 'text-slate-600',   icon: <Clock className="w-3.5 h-3.5" /> },
          { label: 'Approved',  value: M.approved,  bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          { label: 'Completed', value: M.completed, bg: 'bg-sky-50',     text: 'text-sky-600',     icon: <Check className="w-3.5 h-3.5" /> },
          { label: 'Rejected',  value: M.rejected,  bg: 'bg-rose-50',    text: 'text-rose-600',    icon: <XCircle className="w-3.5 h-3.5" /> },
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
          <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 shadow-sm"
            placeholder="Search by staff name, employee ID, location, order number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-rose-400 shadow-sm cursor-pointer"
            value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {TRANSFER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-rose-400 shadow-sm cursor-pointer"
            value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {TRANSFER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* ═══════ BULK BAR ═══════ */}
      {selectedIds.size > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-rose-700">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-rose-200" />
          {showTrashed ? (
            <>
              <button onClick={() => bulkAction('restore')} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Restore</button>
              <button onClick={() => bulkAction('delete', { force: true })} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Permanent Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => bulkAction('status', { status: 'approved' })} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approve</button>
              <button onClick={() => bulkAction('status', { status: 'rejected' })} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition flex items-center gap-1"><XCircle className="w-3 h-3" /> Reject</button>
              <button onClick={() => bulkAction('status', { status: 'completed' })} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-600 text-white hover:bg-sky-700 transition flex items-center gap-1"><Check className="w-3 h-3" /> Complete</button>
              <button onClick={() => bulkAction('delete')} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
            </>
          )}
          <button onClick={() => setSelectedIds(new Set())} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-white transition"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ═══════ TABLE ═══════ */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin" /></div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3"><ArrowLeftRight className="w-6 h-6" /></div>
          <h3 className="text-sm font-bold text-slate-800">{items.length === 0 ? (showTrashed ? 'No trashed records' : 'No transfer records yet') : 'No matching records'}</h3>
          <p className="text-xs text-slate-500 mt-1">{items.length === 0 && !showTrashed ? 'Click "New Transfer" to initiate a transfer request' : 'Try adjusting filters'}</p>
          {items.length === 0 && !showTrashed && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition"><Plus className="w-4 h-4" /> New Transfer</button>
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
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From → To</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Order No.</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {paginated.map((item, idx) => (
                  <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors ${selectedIds.has(item.id) ? 'bg-rose-50/30' : ''}`}>
                    <td className="py-3 px-3"><input type="checkbox" className="rounded border-slate-300" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                    <td className="py-3 px-4 text-center text-slate-400 font-semibold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{item.staff_name || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{item.staff_employee_id}</span>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${item.staff_type === 'teacher' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        {item.staff_type === 'teacher' ? 'Teaching' : 'Non-Teaching'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{typeBadge(item.transfer_type)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-slate-600 max-w-[80px] truncate" title={item.from_location || item.from_department || '—'}>
                          {item.from_location || item.from_department || '—'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-rose-600 max-w-[80px] truncate" title={item.to_location || item.to_department || '—'}>
                          {item.to_location || item.to_department || '—'}
                        </span>
                      </div>
                      {item.from_class_section && (
                        <span className="text-[10px] text-slate-400 block">{item.from_class_section} → {item.to_class_section || '?'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{formatDate(item.request_date)}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{formatDate(item.effective_date)}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-slate-600">{item.transfer_order_number || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      {showTrashed ? statusBadge(item.transfer_status) : (
                        <button onClick={() => openStatusModal(item)} className="group flex items-center gap-1">
                          {statusBadge(item.transfer_status)}
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
                            <button onClick={() => { setViewItem(item); setShowView(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-500 transition" title="View"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => openEdit(item)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600 transition" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setDeleteItem(item); setShowDelete(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1).map((pg, idx, arr) => {
                const prev = arr[idx - 1]; const e = prev && pg - prev > 1;
                return (<React.Fragment key={pg}>{e && <span className="text-slate-400 px-1 text-xs">...</span>}<button className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${pg === page ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={() => setPage(pg)}>{pg}</button></React.Fragment>);
              })}
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ADD/EDIT MODAL ═══════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-rose-500" /> {editingItem ? 'Edit Transfer Record' : 'New Transfer Record'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0 bg-slate-50">
              {(['basic', 'dates', 'admin'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${activeTab === tab ? 'text-rose-600 border-b-2 border-rose-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab === 'basic' ? '📋 Basic Info' : tab === 'dates' ? '📅 Dates' : '📄 Admin'}
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
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 cursor-pointer"
                          value={form.staff_id ? `${form.staff_id}|${form.staff_type}` : ''} onChange={e => handleStaffSelect(e.target.value)} required disabled={!!editingItem}>
                          <option value="">Select Staff Member</option>
                          {staffList.map(s => <option key={`${s.id}-${s.type}`} value={`${s.id}|${s.type}`}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transfer Type <span className="text-rose-500">*</span></label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 cursor-pointer"
                          value={form.transfer_type} onChange={e => setForm(p => ({ ...p, transfer_type: e.target.value }))}>
                          {TRANSFER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Initial Status</label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 cursor-pointer"
                          value={form.transfer_status} onChange={e => setForm(p => ({ ...p, transfer_status: e.target.value }))}>
                          {TRANSFER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* FROM → TO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> From</h5>
                        {F('Department', 'from_department', { placeholder: 'e.g. Science Dept' })}
                        {F('Designation', 'from_designation', { placeholder: 'e.g. Senior Teacher' })}
                        {F('Location / School', 'from_location', { placeholder: 'e.g. Main Campus' })}
                        {F('Class / Section', 'from_class_section', { placeholder: 'e.g. 8A, 9B' })}
                      </div>
                      <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100 space-y-2">
                        <h5 className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> To</h5>
                        {F('Department', 'to_department', { placeholder: 'e.g. Mathematics Dept' })}
                        {F('Designation', 'to_designation', { placeholder: 'e.g. HOD' })}
                        {F('Location / School', 'to_location', { placeholder: 'e.g. Branch Campus' })}
                        {F('Class / Section', 'to_class_section', { placeholder: 'e.g. 10A, 11B' })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason for Transfer</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        placeholder="e.g. Staff request, administrative requirement..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                    </div>

                    {/* Relocation Allowance */}
                    {(form.transfer_type === 'relocation' || form.transfer_type === 'external_out' || form.transfer_type === 'external_in') && (
                      <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 space-y-3">
                        <h5 className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1"><Banknote className="w-3 h-3" /> Relocation Details</h5>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.relocation_allowance_given} onChange={e => setForm(p => ({ ...p, relocation_allowance_given: e.target.checked }))} className="rounded border-slate-300 text-rose-500 focus:ring-rose-400" />
                          <span className="text-xs font-semibold text-slate-700">Relocation Allowance Given</span>
                        </label>
                        {form.relocation_allowance_given && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Allowance Amount (₹)</label>
                            <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                              min="0" placeholder="e.g. 25000" value={form.relocation_allowance_amount} onChange={e => setForm(p => ({ ...p, relocation_allowance_amount: e.target.value }))} />
                          </div>
                        )}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Address</label>
                          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                            rows={2} placeholder="Full new address after relocation..." value={form.new_address} onChange={e => setForm(p => ({ ...p, new_address: e.target.value }))} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* TAB: DATES */}
                {activeTab === 'dates' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Request Date <span className="text-rose-500">*</span></label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        value={form.request_date} onChange={e => setForm(p => ({ ...p, request_date: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Effective Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expected Joining Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        value={form.expected_joining_date} onChange={e => setForm(p => ({ ...p, expected_joining_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Actual Joining Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        value={form.actual_joining_date} onChange={e => setForm(p => ({ ...p, actual_joining_date: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Relieving Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        value={form.relieving_date} onChange={e => setForm(p => ({ ...p, relieving_date: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* TAB: ADMIN */}
                {activeTab === 'admin' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transfer Order No.</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        placeholder="e.g. TO/2024/001" value={form.transfer_order_number} onChange={e => setForm(p => ({ ...p, transfer_order_number: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Order Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        value={form.transfer_order_date} onChange={e => setForm(p => ({ ...p, transfer_order_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Approved By</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        placeholder="Name/authority" value={form.approved_by} onChange={e => setForm(p => ({ ...p, approved_by: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Approval Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        value={form.approved_date} onChange={e => setForm(p => ({ ...p, approved_date: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks / Notes</label>
                      <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        rows={3} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white sticky bottom-0">
                <div className="flex items-center gap-1">
                  {(['basic', 'dates', 'admin'] as const).map(tab => (
                    <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                      className={`w-2 h-2 rounded-full transition ${activeTab === tab ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm disabled:opacity-50">
                    {saving ? 'Saving...' : editingItem ? 'Update Record' : 'Create Record'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ STATUS UPDATE MODAL ═══════ */}
      {showStatusModal && statusTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Update Transfer Status</h3>
              <button onClick={() => setShowStatus(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleStatusUpdate} className="p-6 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff: <span className="text-slate-800">{statusTarget.staff_name}</span></label>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Status <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-1 gap-1.5">
                  {TRANSFER_STATUSES.map(s => (
                    <button key={s.value} type="button" onClick={() => setStatusForm(p => ({ ...p, transfer_status: s.value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition text-left ${statusForm.transfer_status === s.value ? 'ring-2 ring-rose-400 ' + s.color : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Approved By</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400"
                  value={statusForm.approved_by} onChange={e => setStatusForm(p => ({ ...p, approved_by: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400"
                  rows={2} value={statusForm.remarks} onChange={e => setStatusForm(p => ({ ...p, remarks: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowStatus(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ VIEW MODAL ═══════ */}
      {showView && viewItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4 text-rose-500" /> Transfer Details</h3>
              <button onClick={() => setShowView(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Header card */}
              <div className="flex items-start gap-4 bg-rose-50/40 p-4 rounded-xl border border-rose-100">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-lg shrink-0"><ArrowLeftRight className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{viewItem.staff_name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{viewItem.staff_employee_id}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {typeBadge(viewItem.transfer_type)}
                    {statusBadge(viewItem.transfer_status)}
                  </div>
                </div>
              </div>

              {/* From → To */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> From</h5>
                  {[['Dept', viewItem.from_department], ['Designation', viewItem.from_designation], ['Location', viewItem.from_location], ['Class', viewItem.from_class_section]].map(([l, v]) => v ? (
                    <p key={l as string} className="text-[11px] text-slate-700"><span className="text-slate-400">{l}: </span><span className="font-semibold">{v}</span></p>
                  ) : null)}
                </div>
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <h5 className="text-[10px] font-bold text-rose-500 uppercase mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> To</h5>
                  {[['Dept', viewItem.to_department], ['Designation', viewItem.to_designation], ['Location', viewItem.to_location], ['Class', viewItem.to_class_section]].map(([l, v]) => v ? (
                    <p key={l as string} className="text-[11px] text-slate-700"><span className="text-slate-400">{l}: </span><span className="font-semibold">{v}</span></p>
                  ) : null)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Request Date', formatDate(viewItem.request_date)],
                  ['Effective Date', formatDate(viewItem.effective_date)],
                  ['Expected Joining', formatDate(viewItem.expected_joining_date)],
                  ['Actual Joining', formatDate(viewItem.actual_joining_date)],
                  ['Relieving Date', formatDate(viewItem.relieving_date)],
                  ['Order No.', viewItem.transfer_order_number],
                  ['Order Date', formatDate(viewItem.transfer_order_date)],
                  ['Approved By', viewItem.approved_by],
                  ['Approval Date', formatDate(viewItem.approved_date)],
                  ['Reason', viewItem.reason],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">{label}</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">{value || '—'}</span>
                  </div>
                ))}
              </div>

              {viewItem.relocation_allowance_given && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <h5 className="text-[10px] font-bold text-amber-700 uppercase mb-2">Relocation Allowance</h5>
                  <p className="text-sm font-bold text-amber-800">{formatAmount(viewItem.relocation_allowance_amount)}</p>
                  {viewItem.new_address && <p className="text-[11px] text-slate-600 mt-1">{viewItem.new_address}</p>}
                </div>
              )}
              {viewItem.remarks && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Remarks</span>
                  <p className="text-xs text-slate-700 mt-1">{viewItem.remarks}</p>
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
              <h3 className="text-sm font-bold text-slate-800">Delete Transfer Record</h3>
              <p className="text-xs text-slate-500 mt-2">Delete transfer record for <strong className="text-slate-700">{deleteItem.staff_name}</strong>?</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
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
