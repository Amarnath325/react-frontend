import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, User, CheckCircle, XCircle, ChevronLeft,
  ChevronRight, RefreshCw, Plus, Check, X,
  AlertTriangle, FileText, Trash2, CheckSquare, Square,
  ClipboardList, Hourglass, CalendarDays, Upload, Download, RotateCcw, ArrowLeft,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────────
type LeaveStatus = 'pending' | 'approved' | 'rejected';

interface LeaveRecord {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  father_name: string | null;
  father_mobile: string | null;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: LeaveStatus;
  approval_remarks: string | null;
  approved_at: string | null;
  created_at: string;
  deleted_at?: string | null;
}

interface Stats { total: number; pending: number; approved: number; rejected: number; active_today: number; }
interface MasterOption { value: string | number; label: string; }

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<LeaveStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Hourglass size={10} /> },
  approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle size={10} /> },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle size={10} /> },
};

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Medical Leave', 'Family Emergency', 'Festival Leave', 'Sports/Activity', 'Other'];

// ─── react-select styles ──────────────────────────────────────────────────────
const selSm = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '8px', borderColor: s.isFocused ? '#a855f7' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(168,85,247,.15)' : 'none',
    minHeight: '30px', height: '30px', '&:hover': { borderColor: '#a855f7' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '30px', display: 'flex', alignItems: 'center' }),
  input: (b: any) => ({ ...b, margin: 0, padding: 0, fontSize: '11px' }),
  placeholder: (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '28px' }),
  option: (b: any, s: any) => ({
    ...b, fontSize: '11px', padding: '6px 10px', cursor: 'pointer',
    backgroundColor: s.isSelected ? '#a855f7' : s.isFocused ? '#f5f3ff' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '8px', border: '1px solid #e5e7eb', zIndex: 9999 }),
};

// ─── Days between dates ───────────────────────────────────────────────────────
function daysBetween(from: string, to: string) {
  const d1 = new Date(from), d2 = new Date(to);
  return Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LeaveStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Apply Leave Modal ────────────────────────────────────────────────────────
function ApplyLeaveModal({
  classes, onClose, onSuccess,
}: { classes: MasterOption[]; onClose: () => void; onSuccess: () => void }) {
  const [students, setStudents] = useState<{ value: number; label: string; sub: string }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [form, setForm] = useState({
    student_id: '' as any,
    leave_type: '',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const loadStudents = async (classId: string) => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      const res = await api.get('/students', { params: { class_id: classId, per_page: 999 } });
      if (res.data?.success)
        setStudents((res.data.data ?? []).map((s: any) => ({
          value: s.id,
          label: s.full_name,
          sub: `${s.admission_number}${s.roll_number ? ' · Roll: ' + s.roll_number : ''}`,
        })));
    } catch { toast.error('Failed to load students'); }
    finally { setLoadingStudents(false); }
  };

  const handleSubmit = async () => {
    if (!form.student_id) { toast.error('Select a student'); return; }
    if (!form.leave_type) { toast.error('Select leave type'); return; }
    if (!form.reason.trim()) { toast.error('Reason is required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/student-leaves/', { ...form, student_id: Number(form.student_id) });
      if (res.data?.success) { toast.success('Leave applied!'); onSuccess(); }
      else toast.error(res.data?.message ?? 'Failed');
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Error'); }
    finally { setSaving(false); }
  };

  const days = form.from_date && form.to_date ? daysBetween(form.from_date, form.to_date) : 0;
  const leaveOpts = LEAVE_TYPES.map(t => ({ value: t, label: t }));
  const studentOpts = students.map(s => ({ value: s.value, label: s.label, sub: s.sub }));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><Plus size={16} /></div>
            <p className="text-[12px] font-extrabold text-slate-800">Apply Leave</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer outline-none"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Class picker */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Class</label>
            <Select
              options={[{ value: '', label: 'Select class…' }, ...classes]}
              value={[{ value: '', label: 'Select class…' }, ...classes].find(c => String(c.value) === selectedClass) ?? null}
              onChange={opt => { setSelectedClass(opt?.value ? String(opt.value) : ''); loadStudents(opt?.value ? String(opt.value) : ''); setForm(f => ({ ...f, student_id: '' })); }}
              styles={selSm} placeholder="Select class…" isClearable={false}
            />
          </div>

          {/* Student picker */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Student <span className="text-red-500">*</span></label>
            <Select
              options={studentOpts}
              isLoading={loadingStudents}
              value={studentOpts.find(s => s.value === form.student_id) ?? null}
              onChange={opt => setForm(f => ({ ...f, student_id: opt?.value ?? '' }))}
              formatOptionLabel={(o: any) => (
                <div><p className="text-[11px] font-bold text-slate-700">{o.label}</p><p className="text-[9px] text-gray-400">{o.sub}</p></div>
              )}
              styles={selSm} placeholder="Pick student…" isClearable={false}
            />
          </div>

          {/* Leave type */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Leave Type <span className="text-red-500">*</span></label>
            <Select
              options={leaveOpts}
              value={leaveOpts.find(l => l.value === form.leave_type) ?? null}
              onChange={opt => setForm(f => ({ ...f, leave_type: opt?.value ?? '' }))}
              styles={selSm} placeholder="Select type…" isClearable={false}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">From Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.from_date} onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">To Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.to_date} onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
          </div>

          {days > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 text-[10px] text-purple-700 font-bold">
              📅 Total: <strong>{days} day{days > 1 ? 's' : ''}</strong> ({fmtDate(form.from_date)} → {fmtDate(form.to_date)})
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Reason <span className="text-red-500">*</span></label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              rows={3} placeholder="Describe the reason for leave…"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white resize-none" />
          </div>
        </div>

        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-extrabold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 cursor-pointer border-none outline-none transition">
            {saving ? <><div className="w-3 h-3 border-b border-white rounded-full animate-spin" />Submitting…</> : <><Check size={12} />Submit Leave</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Modal (Approve / Reject) ─────────────────────────────────────────
function ActionModal({
  leave, action, onClose, onSuccess,
}: { leave: LeaveRecord; action: 'approve' | 'reject'; onClose: () => void; onSuccess: () => void }) {
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const isApprove = action === 'approve';

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = `/student-leaves/${leave.id}/${action}`;
      const res = await api.post(url, { approval_remarks: remarks });
      if (res.data?.success) { toast.success(res.data.message); onSuccess(); }
      else toast.error(res.data?.message ?? 'Failed');
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Error'); }
    finally { setSaving(false); }
  };

  const days = daysBetween(leave.from_date, leave.to_date);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isApprove ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {isApprove ? <CheckCircle size={16} /> : <XCircle size={16} />}
          </div>
          <p className="text-[12px] font-extrabold text-slate-800">{isApprove ? 'Approve' : 'Reject'} Leave</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Leave info */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2">
              {leave.photo_url
                ? <img src={leave.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                : <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400"><User size={13} /></div>
              }
              <div>
                <p className="text-[11px] font-extrabold text-slate-800">{leave.student_name}</p>
                <p className="text-[9px] text-gray-400">{leave.class_name}{leave.section ? ` - ${leave.section}` : ''} · {leave.admission_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] mt-2">
              <div><p className="text-gray-400 font-bold">Type</p><p className="font-extrabold text-slate-700">{leave.leave_type}</p></div>
              <div><p className="text-gray-400 font-bold">From</p><p className="font-extrabold text-slate-700">{fmtDate(leave.from_date)}</p></div>
              <div><p className="text-gray-400 font-bold">Days</p><p className="font-extrabold text-slate-700">{days}d</p></div>
            </div>
            <p className="text-[10px] text-gray-500 italic mt-1">"{leave.reason}"</p>
          </div>

          {!isApprove && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertTriangle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-700 font-semibold">This leave will be marked as rejected.</p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Remarks (optional)</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
              rows={2} placeholder={isApprove ? 'Any approval notes…' : 'Reason for rejection…'}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white resize-none" />
          </div>
        </div>

        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-extrabold text-white rounded-lg disabled:opacity-60 cursor-pointer border-none outline-none transition ${isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {saving ? <><div className="w-3 h-3 border-b border-white rounded-full animate-spin" />Processing…</>
              : isApprove ? <><CheckCircle size={12} />Approve</> : <><XCircle size={12} />Reject</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Leave Row ────────────────────────────────────────────────────────────────
function LeaveRow({
  leave, serial, selected, onSelect, onApprove, onReject, onDelete,
}: {
  leave: LeaveRecord; serial: number; selected: boolean;
  onSelect: () => void; onApprove: () => void; onReject: () => void; onDelete: () => void;
}) {
  const days = daysBetween(leave.from_date, leave.to_date);
  const appliedAgo = (() => {
    const d = Math.floor((Date.now() - new Date(leave.created_at).getTime()) / 86400000);
    return d === 0 ? 'Today' : `${d}d ago`;
  })();

  return (
    <tr className={`border-b border-gray-50 hover:bg-purple-50/20 transition ${selected ? 'bg-purple-50/40' : ''}`}>
      <td className="px-3 py-2 text-center">
        <button onClick={onSelect} className="text-gray-400 hover:text-purple-600 cursor-pointer bg-transparent border-none outline-none">
          {selected ? <CheckSquare size={13} className="text-purple-600" /> : <Square size={13} />}
        </button>
      </td>
      <td className="px-3 py-2 text-center text-[10px] font-bold text-gray-400">{serial}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {leave.photo_url
            ? <img src={leave.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-purple-100 flex-shrink-0" />
            : <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400 flex-shrink-0"><User size={12} /></div>
          }
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800 text-[11px] truncate">{leave.student_name}</p>
            <p className="text-[9px] text-gray-400 truncate">{leave.class_name}{leave.section ? ` - ${leave.section}` : ''} · {leave.admission_number}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
          {leave.leave_type}
        </span>
      </td>
      <td className="px-3 py-2">
        <p className="text-[11px] font-bold text-slate-700">{fmtDate(leave.from_date)}</p>
        <p className="text-[9px] text-gray-400">→ {fmtDate(leave.to_date)}</p>
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${days > 5 ? 'bg-red-50 border-red-200 text-red-600' : days > 2 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}>{days}d</span>
      </td>
      <td className="px-3 py-2 max-w-[140px]">
        <p className="text-[10px] text-slate-600 line-clamp-2 leading-tight">{leave.reason}</p>
      </td>
      <td className="px-3 py-2"><StatusBadge status={leave.status} /></td>
      <td className="px-3 py-2">
        <p className="text-[9px] text-gray-400">{appliedAgo}</p>
        {leave.approval_remarks && (
          <p className="text-[9px] text-gray-500 italic truncate max-w-[100px]" title={leave.approval_remarks}>"{leave.approval_remarks}"</p>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          {leave.status === 'pending' && (
            <>
              <button onClick={onApprove}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer bg-transparent border-none outline-none transition" title="Approve">
                <Check size={13} />
              </button>
              <button onClick={onReject}
                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer bg-transparent border-none outline-none transition" title="Reject">
                <X size={13} />
              </button>
            </>
          )}
          <button onClick={onDelete}
            className="p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded cursor-pointer bg-transparent border-none outline-none transition" title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StudentLeaveManagement() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, active_today: 0 });
  const [classes, setClasses] = useState<MasterOption[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(15);

  // Selection
  const [selected, setSelected] = useState<number[]>([]);

  // Trash & Import states
  const [showTrash, setShowTrash] = useState(false);
  const [trashRecords, setTrashRecords] = useState<LeaveRecord[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showApply, setShowApply] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ leave: LeaveRecord; action: 'approve' | 'reject' } | null>(null);

  // Bulk action
  const [bulkSaving, setBulkSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load masters ───────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => { });
    loadStats();
  }, []);

  const loadStats = () => {
    api.get('/student-leaves/stats').then(res => {
      if (res.data?.success) setStats(res.data.data);
    }).catch(() => { });
  };

  // ── Load leaves ────────────────────────────────────────────────────────────
  const loadLeaves = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, per_page: perPage };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterClass) params.class_id = filterClass;
      if (filterType) params.leave_type = filterType;
      if (filterFrom) params.from_date = filterFrom;
      if (filterTo) params.to_date = filterTo;

      const res = await api.get('/student-leaves/', { params });
      if (res.data?.success) {
        setLeaves(res.data.data ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
        setSelected([]);
      }
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  }, [search, filterStatus, filterClass, filterType, filterFrom, filterTo, perPage]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadLeaves(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [loadLeaves]);

  const handleSuccess = () => {
    setShowApply(false);
    setActionTarget(null);
    loadLeaves(page);
    loadStats();
  };

  // ── Delete single ──────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this leave application?')) return;
    try {
      const res = await api.delete(`/student-leaves/${id}`);
      if (res.data?.success) { toast.success('Deleted'); loadLeaves(page); loadStats(); }
    } catch { toast.error('Failed to delete'); }
  };

  // ── Bulk action ────────────────────────────────────────────────────────────
  const handleBulk = async (action: 'approve' | 'reject') => {
    if (selected.length === 0) return;
    if (!window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} ${selected.length} leave(s)?`)) return;
    setBulkSaving(true);
    try {
      const res = await api.post('/student-leaves/bulk-action', { ids: selected, action });
      if (res.data?.success) { toast.success(res.data.message); handleSuccess(); }
    } catch { toast.error('Bulk action failed'); }
    finally { setBulkSaving(false); }
  };

  // ── Trash & Bulk Handlers ──────────────────────────────────────────────────
  const loadTrashRecords = async () => {
    setLoadingTrash(true);
    try {
      const res = await api.get('/student-leaves/trashed');
      if (res.data?.success) {
        setTrashRecords(res.data.data ?? []);
        setSelectedTrashIds([]);
      }
    } catch {
      toast.error('Failed to load trash bin');
    } finally {
      setLoadingTrash(false);
    }
  };

  useEffect(() => {
    if (showTrash) {
      loadTrashRecords();
    }
  }, [showTrash]);

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Move ${selected.length} record(s) to trash?`)) return;
    try {
      const res = await api.post('/student-leaves/bulk-delete', { ids: selected });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSelected([]);
        loadLeaves(page);
        loadStats();
      }
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await api.post(`/student-leaves/restore/${id}`);
      if (res.data?.success) {
        toast.success(res.data.message);
        loadTrashRecords();
        loadStats();
      }
    } catch {
      toast.error('Restore failed');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTrashIds.length === 0) return;
    try {
      const res = await api.post('/student-leaves/bulk-restore', { ids: selectedTrashIds });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSelectedTrashIds([]);
        loadTrashRecords();
        loadStats();
      }
    } catch {
      toast.error('Bulk restore failed');
    }
  };

  const handleBulkForceDelete = async () => {
    if (selectedTrashIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedTrashIds.length} record(s)? This action is irreversible.`)) return;
    try {
      const res = await api.post('/student-leaves/bulk-force-delete', { ids: selectedTrashIds });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSelectedTrashIds([]);
        loadTrashRecords();
        loadStats();
      }
    } catch {
      toast.error('Permanent delete failed');
    }
  };

  // ── CSV Import / Export Handlers ──────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await api.get('/student-leaves/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_leaves_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch {
      toast.error('Export failed');
    }
  };

  const handleDownloadSample = async () => {
    try {
      const res = await api.get('/student-leaves/sample', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_leaves_sample.csv';
      a.click();
    } catch {
      toast.error('Failed to download sample');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/student-leaves/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        if (res.data.errors && res.data.errors.length > 0) {
          toast(res.data.errors.join('\n'), { icon: '⚠️', duration: 6000 });
        }
        loadLeaves(1);
        loadStats();
      } else {
        toast.error(res.data?.message ?? 'Import failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleOne = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelected(selected.length === leaves.length ? [] : leaves.map(l => l.id));
  const allSelected = leaves.length > 0 && selected.length === leaves.length;

  const pageRange = () => {
    const start = Math.max(1, page - 2); const end = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const statusOpts = [
    { value: '', label: 'Status' },
    { value: 'pending', label: '⏳ Pending' },
    { value: 'approved', label: '✅ Approved' },
    { value: 'rejected', label: '❌ Rejected' },
  ];
  const typeOpts = [{ value: '', label: 'Types' }, ...LEAVE_TYPES.map(t => ({ value: t, label: t }))];

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">

      {showApply && (
        <ApplyLeaveModal classes={classes} onClose={() => setShowApply(false)} onSuccess={handleSuccess} />
      )}
      {actionTarget && (
        <ActionModal
          leave={actionTarget.leave}
          action={actionTarget.action}
          onClose={() => setActionTarget(null)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                {showTrash ? 'Student Leave Management — Trash Bin' : 'Student Leave Management'}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                {showTrash ? 'Manage, restore, or permanently delete deleted student leave requests' : 'Apply, approve and track student leave applications'}
              </p>
            </div>

            {showTrash ? (
              <button
                onClick={() => setShowTrash(false)}
                className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-extrabold bg-slate-600 text-white rounded-xl hover:bg-slate-700 cursor-pointer border-none outline-none shadow-md transition">
                <ArrowLeft size={13} /> Back to Leaves
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-white text-slate-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <Upload size={12} /> {importing ? 'Importing…' : 'Import CSV'}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-white text-slate-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <Download size={12} /> Export CSV
                </button>
                <button
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer transition bg-transparent border-none">
                  Sample
                </button>
                <button
                  onClick={() => setShowTrash(true)}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 cursor-pointer transition">
                  <Trash2 size={12} /> Trash Bin
                </button>
                <button
                  onClick={() => setShowApply(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-extrabold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition cursor-pointer border-none outline-none shadow-md"
                >
                  <Plus size={13} /> Apply Leave
                </button>
              </div>
            )}
          </div>

          {/* KPI row (hide when showTrash) */}
          {!showTrash && (
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Total', value: stats.total, g: 'from-violet-500 to-purple-600', icon: <ClipboardList size={13} /> },
                { label: 'Pending', value: stats.pending, g: 'from-amber-500 to-orange-500', icon: <Hourglass size={13} /> },
                { label: 'Approved', value: stats.approved, g: 'from-emerald-500 to-teal-600', icon: <CheckCircle size={13} /> },
                { label: 'Rejected', value: stats.rejected, g: 'from-rose-500 to-red-600', icon: <XCircle size={13} /> },
                { label: 'On Leave Today', value: stats.active_today, g: 'from-blue-500 to-indigo-600', icon: <CalendarDays size={13} /> },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.g} text-white rounded-xl p-2.5 flex items-center justify-between shadow-sm`}>
                  <div>
                    <p className="text-[9px] font-bold opacity-80 uppercase tracking-wide">{s.label}</p>
                    <p className="text-xl font-extrabold">{s.value}</p>
                  </div>
                  <div className="opacity-30">{s.icon}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Trash Bin View ────────────────────────────────────────── */}
        {showTrash ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">

            {/* Trash Actions Bar */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-[11px] font-extrabold text-slate-700">Trashed Leave Applications</p>

              {selectedTrashIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">{selectedTrashIds.length} Selected</span>
                  <button
                    onClick={handleBulkRestore}
                    className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer border-none outline-none transition">
                    <RotateCcw size={11} /> Restore Selected
                  </button>
                  <button
                    onClick={handleBulkForceDelete}
                    className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer border-none outline-none transition">
                    <Trash2 size={11} /> Delete Permanently
                  </button>
                </div>
              )}
            </div>

            {/* Trash Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={trashRecords.length > 0 && selectedTrashIds.length === trashRecords.length}
                        onChange={() => {
                          if (selectedTrashIds.length === trashRecords.length) setSelectedTrashIds([]);
                          else setSelectedTrashIds(trashRecords.map(r => r.id));
                        }}
                        className="rounded accent-purple-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 w-8 text-center">#</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Leave Type</th>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2 text-center">Days</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Deleted At</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTrash ? (
                    <tr><td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading trash bin…</p>
                      </div>
                    </td></tr>
                  ) : trashRecords.length === 0 ? (
                    <tr><td colSpan={9} className="py-16 text-center text-gray-400">
                      <Trash2 size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="font-extrabold text-[11px]">Trash bin is empty</p>
                    </td></tr>
                  ) : trashRecords.map((r, idx) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-slate-50 transition">
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTrashIds.includes(r.id)}
                          onChange={() => setSelectedTrashIds(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])}
                          className="rounded accent-purple-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-[10px] font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {r.photo_url
                            ? <img src={r.photo_url} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                            : <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0"><User size={10} /></div>
                          }
                          <div>
                            <p className="font-extrabold text-slate-800 text-[11px]">{r.student_name}</p>
                            <p className="text-[9px] text-gray-400">{r.class_name}{r.section ? ` - ${r.section}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          {r.leave_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-700">
                        {fmtDate(r.from_date)} → {fmtDate(r.to_date)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{daysBetween(r.from_date, r.to_date)}d</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[150px] truncate">{r.reason}</td>
                      <td className="px-3 py-2 text-gray-400">{r.deleted_at ? fmtDate(r.deleted_at) : '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestore(r.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer bg-transparent border-none outline-none transition"
                            title="Restore">
                            <RotateCcw size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTrashIds([r.id]);
                              handleBulkForceDelete();
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer bg-transparent border-none outline-none transition"
                            title="Delete Permanently">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Active Leaves View ─────────────────────────────────── */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">

            {/* Filter bar */}
            <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center gap-2 flex-shrink-0">
              <div className="relative min-w-[180px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Student name, adm. no…"
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50" />
              </div>
              <div className="w-28">
                <Select options={statusOpts} value={statusOpts.find(o => o.value === filterStatus) ?? null}
                  onChange={opt => setFilterStatus(opt?.value ?? '')} styles={selSm} isClearable={false} />
              </div>
              <div className="w-28">
                <Select options={[{ value: '', label: 'Classes' }, ...classes]}
                  value={[{ value: '', label: 'Classes' }, ...classes].find(c => String(c.value) === filterClass) ?? null}
                  onChange={opt => setFilterClass(opt?.value ? String(opt.value) : '')}
                  styles={selSm} placeholder="Class" isClearable={false} />
              </div>
              <div className="w-32">
                <Select options={typeOpts} value={typeOpts.find(o => o.value === filterType) ?? null}
                  onChange={opt => setFilterType(opt?.value ?? '')} styles={selSm} isClearable={false} />
              </div>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-slate-50" />
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-slate-50" />
              <span className="text-[10px] text-gray-400 font-semibold ml-auto">{total} records</span>
              <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterClass(''); setFilterType(''); setFilterFrom(''); setFilterTo(''); }}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer outline-none transition">
                <RefreshCw size={11} /> Clear
              </button>
            </div>

            {/* Active Bulk Action Bar */}
            {selected.length > 0 && (
              <div className="px-3 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] font-extrabold text-purple-700">{selected.length} selected</span>
                <button onClick={() => handleBulk('approve')} disabled={bulkSaving}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer border-none outline-none transition disabled:opacity-60">
                  <Check size={11} /> Approve Selected
                </button>
                <button onClick={() => handleBulk('reject')} disabled={bulkSaving}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer border-none outline-none transition disabled:opacity-60">
                  <X size={11} /> Reject Selected
                </button>
                <button onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer border-none outline-none transition">
                  <Trash2 size={11} /> Move Selected to Trash
                </button>
                <button onClick={() => setSelected([])} className="text-[10px] text-gray-400 font-bold hover:text-gray-600 bg-transparent border-none cursor-pointer outline-none ml-auto">
                  Deselect All
                </button>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <button onClick={toggleAll} className="text-gray-400 hover:text-purple-600 cursor-pointer bg-transparent border-none outline-none">
                        {allSelected ? <CheckSquare size={13} className="text-purple-600" /> : <Square size={13} />}
                      </button>
                    </th>
                    <th className="px-3 py-2 w-8 text-center">#</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Leave Type</th>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2 text-center">Days</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Applied</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading leave applications…</p>
                      </div>
                    </td></tr>
                  ) : leaves.length === 0 ? (
                    <tr><td colSpan={10} className="py-16 text-center">
                      <FileText size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No leave applications found</p>
                      <p className="text-[10px] text-gray-400 mt-1">Click "Apply Leave" to add one</p>
                    </td></tr>
                  ) : leaves.map((leave, idx) => (
                    <LeaveRow
                      key={leave.id}
                      leave={leave}
                      serial={(page - 1) * perPage + idx + 1}
                      selected={selected.includes(leave.id)}
                      onSelect={() => toggleOne(leave.id)}
                      onApprove={() => setActionTarget({ leave, action: 'approve' })}
                      onReject={() => setActionTarget({ leave, action: 'reject' })}
                      onDelete={() => handleDelete(leave.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && leaves.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400">
                  {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => loadLeaves(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronLeft size={13} /></button>
                  {pageRange().map(p => (
                    <button key={p} onClick={() => loadLeaves(p)} className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer border-none outline-none ${p === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>{p}</button>
                  ))}
                  <button disabled={page >= lastPage} onClick={() => loadLeaves(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronRight size={13} /></button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
