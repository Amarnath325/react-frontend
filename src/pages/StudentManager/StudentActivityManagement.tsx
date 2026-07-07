import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, Plus, Check, X,
  Trash2, CheckSquare, Square, Upload, Download, RotateCcw, ArrowLeft,
  Trophy, Star, Zap, Activity, Medal, Calendar, Users,
  BookOpen, Music, Palette, Cpu, Leaf, Heart, Award, Edit2,
  CheckCircle, Clock, XCircle,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityRecord {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number?: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  activity_date: string;
  activity_type: number;
  category: number;
  title: string;
  description: string | null;
  achievement: number | null;
  position: string | null;
  venue: string | null;
  organiser: string | null;
  status: number;
  certificate_issued: boolean;
  parent_notified: boolean;
  parent_notified_at: string | null;
  remarks: string | null;
  activity_type_name?: string;
  category_name?: string;
  achievement_name?: string;
  status_name?: string;
  recorded_by_name?: string;
  created_at: string;
  deleted_at?: string | null;
}

interface Stats {
  total: number; this_month: number; completed: number;
  upcoming: number; ongoing: number; cancelled: number;
  with_achievement: number; cert_issued: number;
}

interface MasterOption { value: number; label: string; }
interface ClassOption  { value: number; label: string; }
interface StudentOpt   { value: number; label: string; sub: string; }

// ─── Status / Type config ─────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Upcoming':  { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: <Clock size={10}/> },
  'Ongoing':   { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <Activity size={10}/> },
  'Completed': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle size={10}/> },
  'Cancelled': { color: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200',   icon: <XCircle size={10}/> },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  'Sports':       <Trophy size={12} className="text-orange-500"/>,
  'Cultural':     <Music size={12} className="text-pink-500"/>,
  'Academic':     <BookOpen size={12} className="text-blue-500"/>,
  'Science & Tech': <Cpu size={12} className="text-indigo-500"/>,
  'Arts & Craft': <Palette size={12} className="text-purple-500"/>,
  'Music & Dance': <Music size={12} className="text-rose-500"/>,
  'Social Service': <Heart size={12} className="text-red-500"/>,
  'Co-curricular': <Star size={12} className="text-amber-500"/>,
  'Leadership':   <Users size={12} className="text-teal-500"/>,
  'Environment':  <Leaf size={12} className="text-green-500"/>,
  'Other':        <Zap size={12} className="text-slate-500"/>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const selSm = {
  control:   (b: any) => ({ ...b, minHeight: 28, fontSize: 11, borderColor: '#e5e7eb', boxShadow: 'none', '&:hover': { borderColor: '#10b981' } }),
  menu:      (b: any) => ({ ...b, fontSize: 11, zIndex: 50 }),
  option:    (b: any, s: any) => ({ ...b, fontSize: 11, padding: '4px 10px', background: s.isSelected ? '#059669' : s.isFocused ? '#d1fae5' : 'white', color: s.isSelected ? 'white' : '#1e293b' }),
  singleValue:(b: any) => ({ ...b, color: '#334155', fontSize: 11 }),
  dropdownIndicator: (b: any) => ({ ...b, padding: '0 4px' }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px' }),
  indicatorSeparator: () => ({ display: 'none' }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: <Clock size={10}/> };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon} {status}
    </span>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  record: ActivityRecord | null;
  masters: { activity_types: MasterOption[]; categories: MasterOption[]; achievements: MasterOption[]; statuses: MasterOption[] };
  classes: ClassOption[];
}

const INIT_FORM = {
  student_id: null as number | null, class_id: null as number | null,
  activity_date: '', activity_type: '' as any, category: '' as any, title: '',
  description: '', achievement: '' as any, position: '', venue: '', organiser: '',
  status: '' as any, certificate_issued: false, parent_notified: false, remarks: '',
};

function ActivityModal({ open, onClose, onSaved, record, masters, classes }: ModalProps) {
  const [form, setForm]       = useState({ ...INIT_FORM });
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        student_id:          record.student_id,
        class_id:            null,
        activity_date:       record.activity_date?.split('T')[0] ?? '',
        activity_type:       record.activity_type,
        category:            record.category,
        title:               record.title,
        description:         record.description ?? '',
        achievement:         record.achievement ?? '',
        position:            record.position ?? '',
        venue:               record.venue ?? '',
        organiser:           record.organiser ?? '',
        status:              record.status,
        certificate_issued:  record.certificate_issued,
        parent_notified:     record.parent_notified,
        remarks:             record.remarks ?? '',
      });
    } else {
      setForm({
        ...INIT_FORM,
        status: masters.statuses.find(s => s.label === 'Upcoming')?.value ?? '',
      });
      loadStudents(null);
    }
  }, [open, record, masters]);

  const loadStudents = async (classId?: number | null) => {
    setLoadingStudents(true);
    try {
      const params: any = { per_page: 999 };
      if (classId) params.class_id = classId;
      const res = await api.get('/students', { params });
      if (res.data?.success) {
        const list = (res.data.data ?? []).map((s: any) => ({
          value: s.id,
          label: s.full_name ?? `Student #${s.id}`,
          sub: `${s.admission_number}${s.roll_number ? ' · Roll: ' + s.roll_number : ''}`,
        }));
        setStudents(list);
      }
    } catch { setStudents([]); }
    setLoadingStudents(false);
  };

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!record && !form.student_id) { toast.error('Please select a student'); return; }
    if (!form.activity_date) { toast.error('Activity date is required'); return; }
    if (!form.activity_type) { toast.error('Activity type is required'); return; }
    if (!form.category)      { toast.error('Category is required'); return; }
    if (!form.title.trim())  { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        student_id:         form.student_id,
        activity_date:      form.activity_date,
        activity_type:      form.activity_type,
        category:           form.category,
        title:              form.title,
        description:        form.description || null,
        achievement:        form.achievement || null,
        position:           form.position || null,
        venue:              form.venue || null,
        organiser:          form.organiser || null,
        status:             form.status,
        certificate_issued: form.certificate_issued,
        parent_notified:    form.parent_notified,
        remarks:            form.remarks || null,
      };
      if (record) {
        await api.put(`/student-activities/${record.id}`, payload);
        toast.success('Activity updated');
      } else {
        await api.post('/student-activities/', payload);
        toast.success('Activity recorded');
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error saving');
    }
    setSaving(false);
  };

  if (!open) return null;

  const typeOpts  = masters.activity_types.map(o => ({ value: o.value, label: o.label }));
  const catOpts   = masters.categories.map(o => ({ value: o.value, label: o.label }));
  const achOpts   = masters.achievements.map(o => ({ value: o.value, label: o.label }));
  const statOpts  = masters.statuses.map(o => ({ value: o.value, label: o.label }));
  const clsOpts   = classes.map(c => ({ value: c.value, label: c.label }));
  const stuOpts   = students.map(s => ({ value: s.value, label: `${s.label} (${s.sub})` }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] transform lg:translate-x-16 transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <Trophy size={16} className="text-white"/>
            <div>
              <p className="text-white text-sm font-bold">{record ? 'Edit Activity' : 'Record New Activity'}</p>
              <p className="text-emerald-100 text-[10px]">Track student achievements & participation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16}/></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 text-xs">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Left Column */}
            <div className="space-y-3.5">
              {/* Student picker (only for new) */}
              {!record ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Class</label>
                    <Select options={clsOpts} placeholder="Select class…" styles={selSm}
                      maxMenuHeight={160} menuPortalTarget={document.body}
                      onChange={o => { setField('class_id', o?.value ?? null); loadStudents(o?.value ?? null); setField('student_id', null); }}
                      isClearable
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Student *</label>
                    <Select options={stuOpts} isLoading={loadingStudents} placeholder="Select student…" styles={selSm}
                      maxMenuHeight={160} menuPortalTarget={document.body}
                      onChange={o => setField('student_id', o?.value ?? null)}
                      value={stuOpts.find(o => o.value === form.student_id) ?? null}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Student</label>
                  <input type="text" readOnly value={record.student_name}
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 focus:outline-none"/>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Activity Title *</label>
                <input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. District Cricket Championship"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"/>
              </div>

              {/* Row: date + type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Activity Date *</label>
                  <input type="date" value={form.activity_date} onChange={e => setField('activity_date', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Activity Type *</label>
                  <Select options={typeOpts} placeholder="Type…" styles={selSm}
                    maxMenuHeight={160} menuPortalTarget={document.body}
                    value={typeOpts.find(o => o.value === form.activity_type) ?? null}
                    onChange={o => setField('activity_type', o?.value ?? '')}
                  />
                </div>
              </div>

              {/* Row: category + status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Category *</label>
                  <Select options={catOpts} placeholder="Category…" styles={selSm}
                    maxMenuHeight={160} menuPortalTarget={document.body}
                    value={catOpts.find(o => o.value === form.category) ?? null}
                    onChange={o => setField('category', o?.value ?? '')}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Status</label>
                  <Select options={statOpts} placeholder="Status…" styles={selSm}
                    maxMenuHeight={160} menuPortalTarget={document.body}
                    value={statOpts.find(o => o.value === form.status) ?? null}
                    onChange={o => setField('status', o?.value ?? 'Upcoming')}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Description</label>
                <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={2}
                  placeholder="Brief description of the activity…"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"/>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3.5">
              {/* Row: achievement + position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Achievement</label>
                  <Select options={achOpts} placeholder="Achievement…" isClearable styles={selSm}
                    maxMenuHeight={160} menuPortalTarget={document.body}
                    value={achOpts.find(o => o.value === form.achievement) ?? null}
                    onChange={o => setField('achievement', o?.value ?? '')}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Position / Rank</label>
                  <input value={form.position} onChange={e => setField('position', e.target.value)} placeholder="e.g. 1st Place, Captain"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"/>
                </div>
              </div>

              {/* Row: venue + organiser */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Venue</label>
                  <input value={form.venue} onChange={e => setField('venue', e.target.value)} placeholder="Event venue / location"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Organiser</label>
                  <input value={form.organiser} onChange={e => setField('organiser', e.target.value)} placeholder="Organising body / institution"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"/>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Remarks</label>
                <textarea value={form.remarks} onChange={e => setField('remarks', e.target.value)} rows={2}
                  placeholder="Additional notes or remarks…"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"/>
              </div>

              {/* Flags */}
              <div className="pt-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.certificate_issued} onChange={e => setField('certificate_issued', e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-600"/>
                  <span className="text-[11px] font-semibold text-slate-700">Certificate Issued</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.parent_notified} onChange={e => setField('parent_notified', e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-600"/>
                  <span className="text-[11px] font-semibold text-slate-700">Parent Notified</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <RefreshCw size={12} className="animate-spin"/> : <Check size={12}/>}
            {saving ? 'Saving…' : (record ? 'Update' : 'Record Activity')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityRow({
  rec, serial, selected, onSelect, onEdit, onDelete,
}: {
  rec: ActivityRecord; serial: number; selected: boolean;
  onSelect: (id: number) => void; onEdit: (r: ActivityRecord) => void; onDelete: (id: number) => void;
}) {
  const typeIcon = TYPE_ICON[rec.activity_type_name ?? 'Other'] ?? <Zap size={12}/>;

  return (
    <tr className={`border-b border-slate-100 hover:bg-emerald-50/30 transition-colors ${selected ? 'bg-emerald-50/50' : ''}`}>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onSelect(rec.id)} className="text-slate-400 hover:text-emerald-600">
          {selected ? <CheckSquare size={13} className="text-emerald-600"/> : <Square size={13}/>}
        </button>
      </td>
      <td className="px-2 py-2 text-center text-[10px] font-bold text-slate-400">{serial}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
            {rec.photo_url ? <img src={rec.photo_url} className="w-full h-full rounded-full object-cover"/> : rec.student_name[0]}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">{rec.student_name}</p>
            <p className="text-[9px] text-slate-400 font-medium">{rec.admission_number} · {rec.class_name}{rec.section ? `-${rec.section}` : ''}</p>
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <div>
          <p className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-1">{rec.title}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {typeIcon}
            <span className="text-[9px] text-slate-500">{rec.activity_type_name ?? 'Other'}</span>
            <span className="text-[9px] text-slate-300">·</span>
            <span className="text-[9px] text-slate-400">{rec.category_name ?? '—'}</span>
          </div>
        </div>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-[10px] text-slate-600 font-medium">{fmtDate(rec.activity_date)}</span>
      </td>
      <td className="px-2 py-2 text-center">
        {rec.achievement_name ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Medal size={9}/> {rec.achievement_name}
          </span>
        ) : <span className="text-[10px] text-slate-300">—</span>}
      </td>
      <td className="px-2 py-2 text-center"><StatusBadge status={rec.status_name ?? 'Upcoming'}/></td>
      <td className="px-2 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          {rec.certificate_issued && <Award size={12} className="text-emerald-500" title="Certificate Issued"/>}
          {rec.parent_notified    && <Users size={12} className="text-blue-400" title="Parent Notified"/>}
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onEdit(rec)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600" title="Edit">
            <Edit2 size={12}/>
          </button>
          <button onClick={() => onDelete(rec.id)} className="p-1 rounded hover:bg-rose-100 text-rose-500" title="Move to Trash">
            <Trash2 size={12}/>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, subtext, color, border
}: {
  label: string; value: number; icon: React.ReactNode; subtext: string | React.ReactNode; color: string; border: string;
}) {
  return (
    <div className={`bg-white rounded-lg p-1.5 border-l-2 ${border} border-y border-r border-slate-100 shadow-sm flex items-center justify-between flex-1 min-w-0`}>
      <div className="space-y-0.5 min-w-0 pr-1">
        <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate" title={label}>{label}</p>
        <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
        <p className="text-[7.5px] text-slate-500 font-semibold truncate" title={typeof subtext === 'string' ? subtext : ''}>{subtext}</p>
      </div>
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentActivityManagement() {
  const [records, setRecords]       = useState<ActivityRecord[]>([]);
  const [stats, setStats]           = useState<Stats>({ total:0,this_month:0,completed:0,upcoming:0,ongoing:0,cancelled:0,with_achievement:0,cert_issued:0 });
  const [masters, setMasters]       = useState({ activity_types: [] as MasterOption[], categories: [] as MasterOption[], achievements: [] as MasterOption[], statuses: [] as MasterOption[] });
  const [classes, setClasses]       = useState<ClassOption[]>([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);
  const [total, setTotal]           = useState(0);

  // Filters
  const [search, setSearch]         = useState('');
  const [filterClass, setFilterClass]     = useState<ClassOption | null>(null);
  const [filterType, setFilterType]       = useState<MasterOption | null>(null);
  const [filterCategory, setFilterCat]    = useState<MasterOption | null>(null);
  const [filterStatus, setFilterStatus]   = useState<MasterOption | null>(null);
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');

  // Bulk select
  const [selected, setSelected]     = useState<number[]>([]);

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [editRecord, setEditRecord] = useState<ActivityRecord | null>(null);

  // Trash
  const [showTrash, setShowTrash]   = useState(false);
  const [trashRecords, setTrashRecords]     = useState<ActivityRecord[]>([]);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);

  // Import
  const importRef = useRef<HTMLInputElement>(null);

  // ─── Load masters + classes once ─────────────────────────────────────────
  useEffect(() => {
    api.get('/student-activities/masters').then(res => { if (res.data.success) setMasters(res.data.data); });
    api.get('/student-activities/stats').then(res => { if (res.data.success) setStats(res.data.data); });
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data) {
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
      }
    }).catch(() => {});
  }, []);

  // ─── Fetch records ────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pg, per_page: 15 };
      if (search)         params.search        = search;
      if (filterClass)    params.class_id      = filterClass.value;
      if (filterType)     params.activity_type = filterType.value;
      if (filterCategory) params.category      = filterCategory.value;
      if (filterStatus)   params.status        = filterStatus.value;
      if (fromDate)       params.from_date     = fromDate;
      if (toDate)         params.to_date       = toDate;

      const res = await api.get('/student-activities/', { params });
      setRecords(res.data.data ?? []);
      setPage(res.data.current_page ?? 1);
      setLastPage(res.data.last_page ?? 1);
      setTotal(res.data.total ?? 0);
      setSelected([]);
    } catch { toast.error('Failed to load records'); }
    setLoading(false);
  }, [search, filterClass, filterType, filterCategory, filterStatus, fromDate, toDate]);

  useEffect(() => { fetchRecords(1); }, [search, filterClass, filterType, filterCategory, filterStatus, fromDate, toDate]);

  // Refresh stats after mutations
  const refreshStats = () => {
    api.get('/student-activities/stats').then(res => { if (res.data.success) setStats(res.data.data); });
  };

  // ─── Trash ops ───────────────────────────────────────────────────────────
  const fetchTrash = async () => {
    try {
      const res = await api.get('/student-activities/trashed');
      setTrashRecords(res.data.data ?? []);
      setSelectedTrashIds([]);
    } catch { toast.error('Failed to load trash'); }
  };

  const openTrash = () => { setShowTrash(true); fetchTrash(); };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this record to trash?')) return;
    try {
      await api.delete(`/student-activities/${id}`);
      toast.success('Moved to trash');
      fetchRecords(page);
      refreshStats();
    } catch { toast.error('Error'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`Move ${selected.length} record(s) to trash?`)) return;
    try {
      await api.post('/student-activities/bulk-delete', { ids: selected });
      toast.success(`${selected.length} record(s) moved to trash`);
      fetchRecords(page);
      refreshStats();
    } catch { toast.error('Error'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/student-activities/restore/${id}`);
      toast.success('Restored'); fetchTrash(); refreshStats();
    } catch { toast.error('Error'); }
  };

  const handleBulkRestore = async () => {
    if (!selectedTrashIds.length) return;
    try {
      await api.post('/student-activities/bulk-restore', { ids: selectedTrashIds });
      toast.success('Records restored'); fetchTrash(); refreshStats();
    } catch { toast.error('Error'); }
  };

  const handleBulkForceDelete = async () => {
    if (!selectedTrashIds.length) return;
    if (!confirm(`Permanently delete ${selectedTrashIds.length} record(s)? This cannot be undone.`)) return;
    try {
      await api.post('/student-activities/bulk-force-delete', { ids: selectedTrashIds });
      toast.success('Permanently deleted'); fetchTrash();
    } catch { toast.error('Error'); }
  };

  // ─── CSV ops ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await api.get('/student-activities/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `student_activities_${new Date().toISOString().split('T')[0]}.csv`; a.click();
      toast.success('Export ready');
    } catch { toast.error('Export failed'); }
  };

  const handleSample = async () => {
    try {
      const res = await api.get('/student-activities/sample', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = 'student_activities_sample.csv'; a.click();
    } catch { toast.error('Failed to download sample'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await api.post('/student-activities/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        toast.success(res.data.message);
        if (res.data.errors?.length) toast.error(`Errors: ${res.data.errors.slice(0, 3).join('; ')}`);
        fetchRecords(1); refreshStats();
      } else { toast.error(res.data.message); }
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  // ─── Select helpers ───────────────────────────────────────────────────────
  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll    = () => setSelected(selected.length === records.length ? [] : records.map(r => r.id));
  const toggleTrash  = (id: number) => setSelectedTrashIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAllTrash = () => setSelectedTrashIds(selectedTrashIds.length === trashRecords.length ? [] : trashRecords.map(r => r.id));

  const typeOpts  = masters.activity_types.map(o => ({ value: o.value, label: o.label }));
  const catOpts   = masters.categories.map(o => ({ value: o.value, label: o.label }));
  const statOpts  = masters.statuses.map(o => ({ value: o.value, label: o.label }));
  const clsOpts   = classes.map(c => ({ value: c.value, label: c.label }));

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {/* ── Modal ── */}
      <ActivityModal
        open={showModal} onClose={() => { setShowModal(false); setEditRecord(null); }}
        onSaved={() => { fetchRecords(page); refreshStats(); }}
        record={editRecord} masters={masters} classes={classes}
      />

      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showTrash && (
            <button onClick={() => setShowTrash(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <ArrowLeft size={14}/>
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Trophy size={16} className="text-white"/>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">
              {showTrash ? 'Activity Records — Trash Bin' : 'Student Activity Management'}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              {showTrash ? 'Restore or permanently delete trashed activity records' : 'Track student achievements, participation & extra-curricular activities'}
            </p>
          </div>
        </div>

        {!showTrash && (
          <div className="flex items-center gap-2">
            <button onClick={handleSample} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Download size={12}/> Sample
            </button>
            <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Upload size={12}/> Import
            </button>
            <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold">
              <Download size={12}/> Export
            </button>
            <button onClick={openTrash} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
              <Trash2 size={12}/> Trash
              {trashRecords.length > 0 && <span className="bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold">{trashRecords.length}</span>}
            </button>
            <button onClick={() => { setEditRecord(null); setShowModal(true); }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm">
              <Plus size={12}/> Add Activity
            </button>
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      {!showTrash && (
        <div className="flex-shrink-0 px-4 py-2 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5">
            <StatCard
              label="Total Activities"
              value={stats.total}
              icon={<Activity size={11} className="text-slate-600"/>}
              subtext="Total records stored"
              color="bg-slate-100"
              border="border-slate-400"
            />
            <StatCard
              label="This Month"
              value={stats.this_month}
              icon={<Calendar size={11} className="text-blue-600"/>}
              subtext="Recorded in current month"
              color="bg-blue-50"
              border="border-blue-400"
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={<CheckCircle size={11} className="text-emerald-600"/>}
              subtext="Activities finished"
              color="bg-emerald-50"
              border="border-emerald-400"
            />
            <StatCard
              label="Upcoming"
              value={stats.upcoming}
              icon={<Clock size={11} className="text-indigo-600"/>}
              subtext="Scheduled activities"
              color="bg-indigo-50"
              border="border-indigo-400"
            />
            <StatCard
              label="Ongoing"
              value={stats.ongoing}
              icon={<Zap size={11} className="text-amber-600"/>}
              subtext="Currently in progress"
              color="bg-amber-50"
              border="border-amber-400"
            />
            <StatCard
              label="Cancelled"
              value={stats.cancelled}
              icon={<XCircle size={11} className="text-rose-600"/>}
              subtext="Cancelled records"
              color="bg-rose-50"
              border="border-rose-400"
            />
            <StatCard
              label="Achievements"
              value={stats.with_achievement}
              icon={<Medal size={11} className="text-orange-600"/>}
              subtext="Medals or places won"
              color="bg-orange-50"
              border="border-orange-400"
            />
            <StatCard
              label="Certs Issued"
              value={stats.cert_issued}
              icon={<Award size={11} className="text-purple-600"/>}
              subtext="Certificates awarded"
              color="bg-purple-50"
              border="border-purple-400"
            />
          </div>
        </div>
      )}

      {/* ── Trash View ── */}
      {showTrash ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Trash toolbar */}
          <div className="flex-shrink-0 px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-slate-700">
              Trashed Activity Records <span className="text-rose-500 ml-1">({trashRecords.length})</span>
            </p>
            {selectedTrashIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-medium">{selectedTrashIds.length} selected</span>
                <button onClick={handleBulkRestore}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700">
                  <RotateCcw size={10}/> Restore
                </button>
                <button onClick={handleBulkForceDelete}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700">
                  <Trash2 size={10}/> Delete Forever
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {trashRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Trash2 size={32} className="mb-2 opacity-30"/>
                <p className="text-sm font-bold">Trash is empty</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2 text-left">
                      <button onClick={toggleAllTrash}>
                        {selectedTrashIds.length === trashRecords.length ? <CheckSquare size={13} className="text-emerald-600"/> : <Square size={13} className="text-slate-400"/>}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Student</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Activity</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Deleted</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashRecords.map(r => (
                    <tr key={r.id} className={`border-b border-slate-100 hover:bg-rose-50/30 ${selectedTrashIds.includes(r.id) ? 'bg-rose-50/40' : ''}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => toggleTrash(r.id)}>
                          {selectedTrashIds.includes(r.id) ? <CheckSquare size={13} className="text-emerald-600"/> : <Square size={13} className="text-slate-400"/>}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-bold text-slate-700">{r.student_name}</p>
                        <p className="text-[9px] text-slate-400">{r.admission_number} · {r.class_name}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-700">{r.title}</p>
                        <p className="text-[9px] text-slate-400">{r.activity_type_name ?? 'Other'} · {r.category_name ?? '—'}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{fmtDate(r.activity_date)}</td>
                      <td className="px-3 py-2"><StatusBadge status={r.status_name ?? 'Upcoming'}/></td>
                      <td className="px-3 py-2 text-[10px] text-slate-400">{fmtDate(r.deleted_at ?? null)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleRestore(r.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold">
                            <RotateCcw size={10}/> Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* ── Main Table View ── */
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-slate-100 flex flex-row flex-nowrap overflow-x-auto items-center gap-1.5 scrollbar-thin">
            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search student, title…"
                className="pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-emerald-500"/>
            </div>
            <div className="w-28 flex-shrink-0">
              <Select options={clsOpts} placeholder="Class…" isClearable styles={selSm}
                maxMenuHeight={160} menuPortalTarget={document.body}
                value={filterClass} onChange={o => { setFilterClass(o as ClassOption | null); setPage(1); }}/>
            </div>
            <div className="w-28 flex-shrink-0">
              <Select options={typeOpts} placeholder="Type…" isClearable styles={selSm}
                maxMenuHeight={160} menuPortalTarget={document.body}
                value={filterType} onChange={o => { setFilterType(o as MasterOption | null); setPage(1); }}/>
            </div>
            <div className="w-28 flex-shrink-0">
              <Select options={catOpts} placeholder="Category…" isClearable styles={selSm}
                maxMenuHeight={160} menuPortalTarget={document.body}
                value={filterCategory} onChange={o => { setFilterCat(o as MasterOption | null); setPage(1); }}/>
            </div>
            <div className="w-28 flex-shrink-0">
              <Select options={statOpts} placeholder="Status…" isClearable styles={selSm}
                maxMenuHeight={160} menuPortalTarget={document.body}
                value={filterStatus} onChange={o => { setFilterStatus(o as MasterOption | null); setPage(1); }}/>
            </div>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-28 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-shrink-0"/>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-28 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-shrink-0"/>
            <button onClick={() => fetchRecords(page)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex-shrink-0">
              <RefreshCw size={12}/>
            </button>
            {selected.length > 0 && (
              <button onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-100 flex-shrink-0 ml-auto">
                <Trash2 size={11}/> Trash {selected.length}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
                <tr>
                  <th className="px-2 py-2.5 text-center w-8">
                    <button onClick={toggleAll}>
                      {selected.length === records.length && records.length > 0
                        ? <CheckSquare size={13} className="text-emerald-600"/>
                        : <Square size={13} className="text-slate-400"/>}
                    </button>
                  </th>
                  <th className="px-2 py-2.5 text-center w-8 text-[10px] font-bold text-slate-400 uppercase">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="px-2 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Activity</th>
                  <th className="px-2 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-2 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">Achievement</th>
                  <th className="px-2 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-2 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">Flags</th>
                  <th className="px-2 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <RefreshCw size={20} className="animate-spin mx-auto text-emerald-400"/>
                    <p className="text-slate-400 text-xs mt-2 font-medium">Loading records…</p>
                  </td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <Trophy size={32} className="mx-auto text-slate-200 mb-2"/>
                    <p className="text-slate-400 font-bold">No activity records found</p>
                    <p className="text-slate-300 text-[10px] mt-1">Add a new activity or adjust your filters</p>
                  </td></tr>
                ) : records.map((rec, i) => (
                  <ActivityRow key={rec.id} rec={rec} serial={(page - 1) * 15 + i + 1}
                    selected={selected.includes(rec.id)}
                    onSelect={toggleSelect}
                    onEdit={r => { setEditRecord(r); setShowModal(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-2 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-medium">
                Showing {records.length} of {total} records · Page {page}/{lastPage}
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetchRecords(page - 1); }}
                  className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeft size={12}/>
                </button>
                <button disabled={page >= lastPage} onClick={() => { setPage(p => p + 1); fetchRecords(page + 1); }}
                  className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                  <ChevronRight size={12}/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
