import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, User, ChevronLeft, ChevronRight, RefreshCw, Plus, Check, X,
  Trash2, CheckSquare, Square, Upload, Download, RotateCcw, ArrowLeft,
  AlertTriangle, Shield, FileText, Edit2, Clock, CheckCircle, XCircle,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────────
type DiscStatus = 'Open' | 'Under Review' | 'Resolved' | 'Closed';

interface DisciplineRecord {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number?: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  incident_date: string;
  incident_type: string;
  severity: string;
  description: string;
  action_taken: string | null;
  action_details: string | null;
  status: DiscStatus;
  parent_notified: boolean;
  parent_notified_at: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  reported_by_name?: string;
  created_at: string;
  deleted_at?: string | null;
}

interface Stats {
  total: number; open: number; under_review: number;
  resolved: number; closed: number; this_month: number;
  follow_up_due: number; parent_not_notified: number;
}

interface MasterOption { value: string; label: string; }
interface ClassOption  { value: number; label: string; }
interface StudentOpt   { value: number; label: string; sub: string; }

// ─── Severity config ──────────────────────────────────────────────────────────
const SEV_CFG: Record<string, { color: string; bg: string; border: string }> = {
  Minor:    { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  Moderate: { color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  Major:    { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  Critical: { color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
};

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Open':         { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    icon: <AlertTriangle size={10} /> },
  'Under Review': { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <Clock size={10} /> },
  'Resolved':     { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle size={10} /> },
  'Closed':       { color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',   icon: <XCircle size={10} /> },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const selSm = {
  control: (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: '#e5e7eb', boxShadow: 'none', '&:hover': { borderColor: '#a855f7' } }),
  menu: (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option: (b: any, s: any) => ({ ...b, fontSize: 11, padding: '4px 10px', background: s.isSelected ? '#7c3aed' : s.isFocused ? '#f3e8ff' : 'white', color: s.isSelected ? 'white' : '#1e293b' }),
  singleValue: (b: any) => ({ ...b, color: '#334155', fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: '0 4px' }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px' }),
  indicatorSeparator: () => ({ display: 'none' }),
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG['Open'];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEV_CFG[severity] ?? SEV_CFG['Minor'];
  return (
    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {severity}
    </span>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
interface FormState {
  student_id: number | '';
  incident_date: string;
  incident_type: string;
  severity: string;
  description: string;
  action_taken: string;
  action_details: string;
  status: string;
  parent_notified: boolean;
  follow_up_date: string;
  follow_up_notes: string;
}

const EMPTY_FORM: FormState = {
  student_id: '', incident_date: '', incident_type: '',
  severity: '', description: '', action_taken: '', action_details: '',
  status: 'Open', parent_notified: false, follow_up_date: '', follow_up_notes: '',
};

function IncidentModal({
  record, classes, masters, onClose, onSuccess,
}: {
  record: DisciplineRecord | null;
  classes: ClassOption[];
  masters: { incident_types: MasterOption[]; severities: MasterOption[]; actions: MasterOption[]; statuses: MasterOption[] };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [form, setForm] = useState<FormState>(
    isEdit ? {
      student_id:     record!.student_id,
      incident_date:  record!.incident_date,
      incident_type:  record!.incident_type,
      severity:       record!.severity,
      description:    record!.description,
      action_taken:   record!.action_taken ?? '',
      action_details: record!.action_details ?? '',
      status:         record!.status,
      parent_notified:record!.parent_notified,
      follow_up_date: record!.follow_up_date ?? '',
      follow_up_notes:record!.follow_up_notes ?? '',
    } : { ...EMPTY_FORM }
  );

  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents]           = useState<StudentOpt[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStudents = async (classId: string) => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      const res = await api.get('/students', { params: { class_id: classId, per_page: 999 } });
      if (res.data?.success)
        setStudents((res.data.data ?? []).map((s: any) => ({
          value: s.id, label: s.full_name,
          sub: `${s.admission_number}${s.roll_number ? ' · Roll: ' + s.roll_number : ''}`,
        })));
    } catch { toast.error('Failed to load students'); }
    finally { setLoadingStudents(false); }
  };

  const f = (field: keyof FormState, val: any) => setForm(p => ({ ...p, [field]: val }));

  const handleSubmit = async () => {
    if (!isEdit && !form.student_id) { toast.error('Select a student'); return; }
    if (!form.incident_date)  { toast.error('Incident date is required'); return; }
    if (!form.incident_type)  { toast.error('Select incident type'); return; }
    if (!form.severity)       { toast.error('Select severity'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, student_id: Number(form.student_id) };
      const res = isEdit
        ? await api.put(`/student-discipline/${record!.id}`, payload)
        : await api.post('/student-discipline/', payload);
      if (res.data?.success) { toast.success(res.data.message); onSuccess(); }
      else toast.error(res.data?.message ?? 'Failed');
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Error'); }
    finally { setSaving(false); }
  };

  const studentOpts = students.map(s => ({ value: s.value, label: s.label, sub: s.sub }));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Shield size={16} />
            </div>
            <p className="text-[13px] font-extrabold text-slate-800">{isEdit ? 'Edit Incident Record' : 'Record New Incident'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer outline-none"><X size={16} /></button>
        </div>

        <div className="px-5 py-3 space-y-2.5">
          {/* Student picker (only on create) */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Class</label>
                <Select options={[{ value: '', label: 'Select class…' }, ...classes]}
                  value={[{ value: '', label: 'Select class…' }, ...classes].find(c => String(c.value) === selectedClass) ?? null}
                  onChange={opt => { setSelectedClass(opt?.value ? String(opt.value) : ''); loadStudents(opt?.value ? String(opt.value) : ''); f('student_id', ''); }}
                  styles={selSm} isClearable={false} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Student <span className="text-red-500">*</span></label>
                <Select options={studentOpts} isLoading={loadingStudents}
                  value={studentOpts.find(s => s.value === form.student_id) ?? null}
                  onChange={opt => f('student_id', opt?.value ?? '')}
                  formatOptionLabel={(o: any) => (<div><p className="text-[11px] font-bold text-slate-700 leading-none">{o.label}</p><p className="text-[9px] text-gray-400 mt-0.5 leading-none">{o.sub}</p></div>)}
                  styles={selSm} placeholder="Pick student…" isClearable={false} />
              </div>
            </div>
          )}
          {isEdit && (
            <div className="bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
              {record!.photo_url
                ? <img src={record!.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                : <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400"><User size={12} /></div>
              }
              <div>
                <p className="text-[12px] font-extrabold text-slate-800">{record!.student_name}</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">{record!.class_name} {record!.section} · {record!.admission_number}</p>
              </div>
            </div>
          )}

          {/* Incident Date + Type */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Incident Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.incident_date} onChange={e => f('incident_date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Incident Type <span className="text-red-500">*</span></label>
              <Select options={masters.incident_types}
                value={masters.incident_types.find(o => o.value === form.incident_type) ?? null}
                onChange={opt => f('incident_type', opt?.value ?? '')}
                styles={selSm} placeholder="Select type…" isClearable={false} />
            </div>
          </div>

          {/* Severity + Status */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Severity <span className="text-red-500">*</span></label>
              <Select options={masters.severities}
                value={masters.severities.find(o => o.value === form.severity) ?? null}
                onChange={opt => f('severity', opt?.value ?? '')}
                styles={selSm} placeholder="Select severity…" isClearable={false} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Status</label>
              <Select options={masters.statuses}
                value={masters.statuses.find(o => o.value === form.status) ?? null}
                onChange={opt => f('status', opt?.value ?? 'Open')}
                styles={selSm} isClearable={false} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Description <span className="text-red-500">*</span></label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)}
              rows={2} placeholder="Describe the incident in detail…"
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] outline-none focus:border-purple-400 bg-white resize-none" />
          </div>

          {/* Action Taken + Parent Notified */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Action Taken</label>
              <Select options={masters.actions}
                value={masters.actions.find(o => o.value === form.action_taken) ?? null}
                onChange={opt => f('action_taken', opt?.value ?? '')}
                styles={selSm} placeholder="Select action…" isClearable />
            </div>
            <div className="flex items-center pt-3.5 pl-1">
              <input type="checkbox" id="parent_notified" checked={form.parent_notified}
                onChange={e => f('parent_notified', e.target.checked)}
                className="rounded accent-purple-600 cursor-pointer w-3.5 h-3.5" />
              <label htmlFor="parent_notified" className="text-[11px] font-semibold text-slate-700 cursor-pointer ml-2 select-none">
                Parent / Guardian notified
              </label>
            </div>
          </div>

          {/* Action Details */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Action Details</label>
            <input type="text" value={form.action_details} onChange={e => f('action_details', e.target.value)}
              placeholder="Additional action notes…"
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
          </div>

          {/* Follow-up */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Follow-up Date</label>
              <input type="date" value={form.follow_up_date} onChange={e => f('follow_up_date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block">Follow-up Notes</label>
              <input type="text" value={form.follow_up_notes} onChange={e => f('follow_up_notes', e.target.value)}
                placeholder="What to check on follow-up…"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white" />
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 flex justify-end gap-2 sticky bottom-0 bg-white border-t border-gray-100 pt-3">
          <button onClick={onClose} className="px-4 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer outline-none">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-extrabold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-60 cursor-pointer border-none outline-none transition">
            {saving ? <><div className="w-3 h-3 border-b border-white rounded-full animate-spin" />Saving…</> : <><Check size={12} />{isEdit ? 'Update Record' : 'Save Incident'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function DisciplineRow({
  rec, serial, selected, onSelect, onEdit, onDelete,
}: {
  rec: DisciplineRecord; serial: number; selected: boolean;
  onSelect: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <tr className={`border-b border-gray-50 hover:bg-rose-50/10 transition ${selected ? 'bg-rose-50/30' : ''}`}>
      <td className="px-3 py-2 text-center">
        <button onClick={onSelect} className="text-gray-400 hover:text-rose-600 cursor-pointer bg-transparent border-none outline-none">
          {selected ? <CheckSquare size={13} className="text-rose-600" /> : <Square size={13} />}
        </button>
      </td>
      <td className="px-3 py-2 text-center text-[10px] font-bold text-gray-400">{serial}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {rec.photo_url
            ? <img src={rec.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-rose-100 flex-shrink-0" />
            : <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 flex-shrink-0"><User size={12} /></div>
          }
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800 text-[11px] truncate">{rec.student_name}</p>
            <p className="text-[9px] text-gray-400 truncate">{rec.class_name}{rec.section ? ` - ${rec.section}` : ''} · {rec.admission_number}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-[11px] font-bold text-slate-700">{fmtDate(rec.incident_date)}</td>
      <td className="px-3 py-2">
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
          {rec.incident_type}
        </span>
      </td>
      <td className="px-3 py-2"><SeverityBadge severity={rec.severity} /></td>
      <td className="px-3 py-2 max-w-[160px]">
        <p className="text-[10px] text-slate-600 line-clamp-2 leading-tight">{rec.description}</p>
      </td>
      <td className="px-3 py-2">
        {rec.action_taken
          ? <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{rec.action_taken}</span>
          : <span className="text-[10px] text-gray-300">—</span>}
      </td>
      <td className="px-3 py-2"><StatusBadge status={rec.status} /></td>
      <td className="px-3 py-2 text-center">
        {rec.parent_notified
          ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Yes</span>
          : <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">No</span>}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button onClick={onEdit}
            className="p-1 text-blue-500 hover:bg-blue-50 rounded cursor-pointer bg-transparent border-none outline-none transition" title="Edit">
            <Edit2 size={12} />
          </button>
          <button onClick={onDelete}
            className="p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded cursor-pointer bg-transparent border-none outline-none transition" title="Move to Trash">
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StudentDisciplineManagement() {
  const [records, setRecords]   = useState<DisciplineRecord[]>([]);
  const [loading, setLoading]   = useState(false);
  const [stats, setStats]       = useState<Stats>({ total: 0, open: 0, under_review: 0, resolved: 0, closed: 0, this_month: 0, follow_up_due: 0, parent_not_notified: 0 });
  const [classes, setClasses]   = useState<ClassOption[]>([]);
  const [masters, setMasters]   = useState<{ incident_types: MasterOption[]; severities: MasterOption[]; actions: MasterOption[]; statuses: MasterOption[] }>({
    incident_types: [], severities: [], actions: [], statuses: [],
  });

  // Filters
  const [search, setSearch]           = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterSev, setFilterSev]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom]   = useState('');
  const [filterTo, setFilterTo]       = useState('');
  const [page, setPage]               = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [perPage]                     = useState(15);

  // Selection
  const [selected, setSelected] = useState<number[]>([]);

  // Trash
  const [showTrash, setShowTrash]               = useState(false);
  const [trashRecords, setTrashRecords]         = useState<DisciplineRecord[]>([]);
  const [loadingTrash, setLoadingTrash]         = useState(false);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);

  // Import
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal
  const [showModal, setShowModal]         = useState(false);
  const [editRecord, setEditRecord]       = useState<DisciplineRecord | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => { });

    api.get('/student-discipline/masters').then(res => {
      if (res.data?.success) setMasters(res.data.data);
    }).catch(() => { });

    loadStats();
  }, []);

  const loadStats = () => {
    api.get('/student-discipline/stats').then(res => {
      if (res.data?.success) setStats(res.data.data);
    }).catch(() => { });
  };

  // ── Load records ───────────────────────────────────────────────────────────
  const loadRecords = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, per_page: perPage };
      if (search)       params.search        = search;
      if (filterClass)  params.class_id      = filterClass;
      if (filterType)   params.incident_type = filterType;
      if (filterSev)    params.severity      = filterSev;
      if (filterStatus) params.status        = filterStatus;
      if (filterFrom)   params.from_date     = filterFrom;
      if (filterTo)     params.to_date       = filterTo;

      const res = await api.get('/student-discipline/', { params });
      if (res.data?.success) {
        setRecords(res.data.data ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
        setSelected([]);
      }
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [search, filterClass, filterType, filterSev, filterStatus, filterFrom, filterTo, perPage]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadRecords(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [loadRecords]);

  useEffect(() => { if (showTrash) loadTrashRecords(); }, [showTrash]);

  const handleSuccess = () => { setShowModal(false); setEditRecord(null); loadRecords(page); loadStats(); };

  // ── Trash ──────────────────────────────────────────────────────────────────
  const loadTrashRecords = async () => {
    setLoadingTrash(true);
    try {
      const res = await api.get('/student-discipline/trashed');
      if (res.data?.success) { setTrashRecords(res.data.data ?? []); setSelectedTrashIds([]); }
    } catch { toast.error('Failed to load trash'); }
    finally { setLoadingTrash(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Move this record to trash?')) return;
    try {
      const res = await api.delete(`/student-discipline/${id}`);
      if (res.data?.success) { toast.success(res.data.message); loadRecords(page); loadStats(); }
    } catch { toast.error('Delete failed'); }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Move ${selected.length} record(s) to trash?`)) return;
    try {
      const res = await api.post('/student-discipline/bulk-delete', { ids: selected });
      if (res.data?.success) { toast.success(res.data.message); setSelected([]); loadRecords(page); loadStats(); }
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await api.post(`/student-discipline/restore/${id}`);
      if (res.data?.success) { toast.success(res.data.message); loadTrashRecords(); loadStats(); }
    } catch { toast.error('Restore failed'); }
  };

  const handleBulkRestore = async () => {
    if (selectedTrashIds.length === 0) return;
    try {
      const res = await api.post('/student-discipline/bulk-restore', { ids: selectedTrashIds });
      if (res.data?.success) { toast.success(res.data.message); setSelectedTrashIds([]); loadTrashRecords(); loadStats(); }
    } catch { toast.error('Bulk restore failed'); }
  };

  const handleBulkForceDelete = async () => {
    if (selectedTrashIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedTrashIds.length} record(s)? This cannot be undone.`)) return;
    try {
      const res = await api.post('/student-discipline/bulk-force-delete', { ids: selectedTrashIds });
      if (res.data?.success) { toast.success(res.data.message); setSelectedTrashIds([]); loadTrashRecords(); loadStats(); }
    } catch { toast.error('Permanent delete failed'); }
  };

  // ── CSV ────────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await api.get('/student-discipline/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `student_discipline_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    } catch { toast.error('Export failed'); }
  };

  const handleSample = async () => {
    try {
      const res = await api.get('/student-discipline/sample', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'student_discipline_sample.csv'; a.click();
    } catch { toast.error('Failed to download sample'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await api.post('/student-discipline/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.success) {
        toast.success(res.data.message);
        if (res.data.errors?.length) toast(res.data.errors.join('\n'), { icon: '⚠️', duration: 6000 });
        loadRecords(1); loadStats();
      } else { toast.error(res.data?.message ?? 'Import failed'); }
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Import failed'); }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleOne = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));
  const allSelected = records.length > 0 && selected.length === records.length;

  const pageRange = () => {
    const start = Math.max(1, page - 2); const end = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Dropdown options
  const typeOpts    = [{ value: '', label: 'All Types' }, ...masters.incident_types];
  const sevOpts     = [{ value: '', label: 'All Severity' }, ...masters.severities];
  const statusOpts  = [{ value: '', label: 'All Status' }, ...masters.statuses];

  const clearFilters = () => { setSearch(''); setFilterClass(''); setFilterType(''); setFilterSev(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); };

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-80px)] lg:h-[calc(100vh-112px)] overflow-hidden flex flex-col">

      {/* Modals */}
      {showModal && (
        <IncidentModal
          record={editRecord}
          classes={classes}
          masters={masters}
          onClose={() => { setShowModal(false); setEditRecord(null); }}
          onSuccess={handleSuccess}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight flex items-center gap-2">
                <Shield size={16} className="text-rose-500" />
                {showTrash ? 'Discipline Desk — Trash Bin' : 'Student Discipline Desk'}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                {showTrash ? 'Manage, restore or permanently delete discipline records' : 'Record, track and manage student disciplinary incidents'}
              </p>
            </div>

            {showTrash ? (
              <button onClick={() => setShowTrash(false)}
                className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-extrabold bg-slate-600 text-white rounded-xl hover:bg-slate-700 cursor-pointer border-none outline-none shadow-md transition">
                <ArrowLeft size={13} /> Back to Records
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={importing}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-white text-slate-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <Upload size={12} /> {importing ? 'Importing…' : 'Import CSV'}
                </button>
                <button onClick={handleExport}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-white text-slate-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <Download size={12} /> Export CSV
                </button>
                <button onClick={handleSample}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer transition bg-transparent border-none">
                  Sample
                </button>
                <button onClick={() => setShowTrash(true)}
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 cursor-pointer transition">
                  <Trash2 size={12} /> Trash Bin
                </button>
                <button onClick={() => { setEditRecord(null); setShowModal(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-extrabold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition cursor-pointer border-none outline-none shadow-md">
                  <Plus size={13} /> Record Incident
                </button>
              </div>
            )}
          </div>

          {/* KPI cards */}
          {!showTrash && (
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5">
              {[
                { label: 'Total',        value: stats.total,               g: 'from-slate-600 to-slate-700',   icon: <FileText size={12} /> },
                { label: 'Open',         value: stats.open,                g: 'from-rose-500 to-red-600',      icon: <AlertTriangle size={12} /> },
                { label: 'Under Review', value: stats.under_review,        g: 'from-amber-500 to-orange-500',  icon: <Clock size={12} /> },
                { label: 'Resolved',     value: stats.resolved,            g: 'from-emerald-500 to-teal-600',  icon: <CheckCircle size={12} /> },
                { label: 'Closed',       value: stats.closed,              g: 'from-slate-400 to-slate-500',   icon: <XCircle size={12} /> },
                { label: 'This Month',   value: stats.this_month,          g: 'from-violet-500 to-purple-600', icon: <Clock size={12} /> },
                { label: 'Follow-up Due',value: stats.follow_up_due,       g: 'from-sky-500 to-blue-600',      icon: <FileText size={12} /> },
                { label: 'Parent Pending',value: stats.parent_not_notified,g: 'from-pink-500 to-rose-600',     icon: <User size={12} /> },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.g} text-white rounded-lg p-2 flex items-center justify-between shadow-sm`}>
                  <div>
                    <p className="text-[8px] font-bold opacity-85 uppercase tracking-wide leading-none">{s.label}</p>
                    <p className="text-sm font-black leading-none mt-1">{s.value}</p>
                  </div>
                  <div className="opacity-20 flex-shrink-0">{s.icon}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Trash View ─────────────────────────────────────────────── */}
        {showTrash ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-[11px] font-extrabold text-slate-700">Trashed Discipline Records</p>
              {selectedTrashIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">{selectedTrashIds.length} Selected</span>
                  <button onClick={handleBulkRestore}
                    className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer border-none outline-none transition">
                    <RotateCcw size={11} /> Restore Selected
                  </button>
                  <button onClick={handleBulkForceDelete}
                    className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer border-none outline-none transition">
                    <Trash2 size={11} /> Delete Permanently
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">
                      <input type="checkbox"
                        checked={trashRecords.length > 0 && selectedTrashIds.length === trashRecords.length}
                        onChange={() => setSelectedTrashIds(selectedTrashIds.length === trashRecords.length ? [] : trashRecords.map(r => r.id))}
                        className="rounded accent-rose-600 cursor-pointer" />
                    </th>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Severity</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Deleted</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTrash ? (
                    <tr><td colSpan={9} className="py-16 text-center">
                      <div className="w-7 h-7 border-b-2 border-rose-500 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-gray-400">Loading trash…</p>
                    </td></tr>
                  ) : trashRecords.length === 0 ? (
                    <tr><td colSpan={9} className="py-16 text-center text-gray-400">
                      <Trash2 size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="font-extrabold text-[11px]">Trash bin is empty</p>
                    </td></tr>
                  ) : trashRecords.map((r, idx) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-slate-50 transition">
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={selectedTrashIds.includes(r.id)}
                          onChange={() => setSelectedTrashIds(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])}
                          className="rounded accent-rose-600 cursor-pointer" />
                      </td>
                      <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {r.photo_url ? <img src={r.photo_url} alt="" className="w-6 h-6 rounded-lg object-cover" /> : <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><User size={10} /></div>}
                          <div>
                            <p className="font-extrabold text-slate-800">{r.student_name}</p>
                            <p className="text-[9px] text-gray-400">{r.class_name}{r.section ? ` - ${r.section}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-700">{fmtDate(r.incident_date)}</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{r.incident_type}</span></td>
                      <td className="px-3 py-2"><SeverityBadge severity={r.severity} /></td>
                      <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2 text-gray-400">{r.deleted_at ? fmtDate(r.deleted_at) : '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleRestore(r.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer bg-transparent border-none outline-none transition" title="Restore"><RotateCcw size={12} /></button>
                          <button onClick={() => { setSelectedTrashIds([r.id]); handleBulkForceDelete(); }} className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer bg-transparent border-none outline-none transition" title="Delete Permanently"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Active Records View ────────────────────────────────── */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">

            {/* Filter Bar */}
            <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center gap-2 flex-shrink-0">
              <div className="relative min-w-[180px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Student name, adm. no…"
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-rose-400 bg-slate-50" />
              </div>
              <div className="w-28">
                <Select options={[{ value: '', label: 'All Classes' }, ...classes]}
                  value={[{ value: '', label: 'All Classes' }, ...classes].find(c => String(c.value) === filterClass) ?? null}
                  onChange={opt => setFilterClass(opt?.value ? String(opt.value) : '')}
                  styles={selSm} placeholder="Class" isClearable={false} />
              </div>
              <div className="w-36">
                <Select options={typeOpts} value={typeOpts.find(o => o.value === filterType) ?? null}
                  onChange={opt => setFilterType(opt?.value ?? '')} styles={selSm} isClearable={false} />
              </div>
              <div className="w-28">
                <Select options={sevOpts} value={sevOpts.find(o => o.value === filterSev) ?? null}
                  onChange={opt => setFilterSev(opt?.value ?? '')} styles={selSm} isClearable={false} />
              </div>
              <div className="w-28">
                <Select options={statusOpts} value={statusOpts.find(o => o.value === filterStatus) ?? null}
                  onChange={opt => setFilterStatus(opt?.value ?? '')} styles={selSm} isClearable={false} />
              </div>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-rose-400 bg-slate-50" />
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-rose-400 bg-slate-50" />
              <span className="text-[10px] text-gray-400 font-semibold ml-auto">{total} records</span>
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-rose-600 bg-transparent border-none cursor-pointer outline-none transition">
                <RefreshCw size={11} /> Clear
              </button>
            </div>

            {/* Bulk Action Bar */}
            {selected.length > 0 && (
              <div className="px-3 py-2 bg-rose-50 border-b border-rose-100 flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] font-extrabold text-rose-700">{selected.length} selected</span>
                <button onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer border-none outline-none transition">
                  <Trash2 size={11} /> Move to Trash
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
                      <button onClick={toggleAll} className="text-gray-400 hover:text-rose-600 cursor-pointer bg-transparent border-none outline-none">
                        {allSelected ? <CheckSquare size={13} className="text-rose-600" /> : <Square size={13} />}
                      </button>
                    </th>
                    <th className="px-3 py-2 w-8 text-center">#</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Incident Type</th>
                    <th className="px-3 py-2">Severity</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Action Taken</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-center">Parent</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-rose-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading records…</p>
                      </div>
                    </td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={11} className="py-16 text-center">
                      <FileText size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No discipline records found</p>
                      <p className="text-[10px] text-gray-400 mt-1">Click "Record Incident" to add one</p>
                    </td></tr>
                  ) : records.map((rec, idx) => (
                    <DisciplineRow
                      key={rec.id}
                      rec={rec}
                      serial={(page - 1) * perPage + idx + 1}
                      selected={selected.includes(rec.id)}
                      onSelect={() => toggleOne(rec.id)}
                      onEdit={() => { setEditRecord(rec); setShowModal(true); }}
                      onDelete={() => handleDelete(rec.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && records.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400">
                  {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => loadRecords(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronLeft size={13} /></button>
                  {pageRange().map(p => (
                    <button key={p} onClick={() => loadRecords(p)} className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer border-none outline-none ${p === page ? 'bg-rose-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>{p}</button>
                  ))}
                  <button disabled={page >= lastPage} onClick={() => loadRecords(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronRight size={13} /></button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
