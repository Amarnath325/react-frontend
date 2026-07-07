import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, User, Users, Phone, Mail, XCircle, RefreshCw, Edit3,
  ChevronRight, ChevronLeft, ClipboardList, Save, Eye,
  ShieldAlert, Contact, Baby, Heart, AlertCircle, X, Check,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface ParentRecord {
  id: number;                       // student.id
  full_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  // Father
  father_name: string | null;
  father_mobile: string | null;
  father_occupation: string | null;
  // Mother
  mother_name: string | null;
  mother_mobile: string | null;
  mother_occupation: string | null;
  // Guardian
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_mobile: string | null;
  // Contact
  parent_email: string | null;
  parent_phone: string | null;
  alternate_mobile: string | null;
  // Emergency
  emergency_name: string | null;
  emergency_number: string | null;
  emergency_relation: string | null;
  user: { email: string; mobile: string; is_active: boolean } | null;
}

interface MasterOption { value: string | number; label: string; }

// ─── react-select compact styles ─────────────────────────────────────────────
const selStyles = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '8px', borderColor: s.isFocused ? '#a855f7' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(168,85,247,.15)' : 'none',
    minHeight: '30px', height: '30px',
    '&:hover': { borderColor: '#a855f7' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '30px', alignItems: 'center', display: 'flex' }),
  input:        (b: any) => ({ ...b, margin: 0, padding: 0, fontSize: '11px' }),
  placeholder:  (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue:  (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '28px' }),
  option: (b: any, s: any) => ({
    ...b, fontSize: '11px', padding: '6px 10px', cursor: 'pointer',
    backgroundColor: s.isSelected ? '#a855f7' : s.isFocused ? '#f5f3ff' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '8px', border: '1px solid #e5e7eb', zIndex: 9999 }),
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditParentModal({
  student,
  onClose,
  onSuccess,
}: { student: ParentRecord; onClose: () => void; onSuccess: (updated: ParentRecord) => void }) {
  const [form, setForm] = useState({
    father_name:        student.father_name        ?? '',
    father_mobile:      student.father_mobile      ?? '',
    father_occupation:  student.father_occupation  ?? '',
    mother_name:        student.mother_name        ?? '',
    mother_mobile:      student.mother_mobile      ?? '',
    mother_occupation:  student.mother_occupation  ?? '',
    guardian_name:      student.guardian_name      ?? '',
    guardian_relation:  student.guardian_relation  ?? '',
    guardian_mobile:    student.guardian_mobile    ?? '',
    parent_email:       student.parent_email       ?? '',
    alternate_mobile:   student.alternate_mobile   ?? '',
    emergency_name:     student.emergency_name     ?? '',
    emergency_number:   student.emergency_number   ?? '',
    emergency_relation: student.emergency_relation ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/students/${student.id}/update-parent`, form);
      if (res.data?.success) {
        toast.success('Parent details updated!');
        onSuccess({ ...student, ...form });
        onClose();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label, field, type = 'text', placeholder,
  }: { label: string; field: string; type?: string; placeholder?: string }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder ?? label}
        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white transition"
      />
    </div>
  );

  const Section = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <span className="text-purple-500">{icon}</span>
      <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wide">{title}</p>
      <div className="flex-1 h-px bg-purple-100" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {student.photo_url ? (
              <img src={student.photo_url} alt="Photo" className="w-10 h-10 rounded-xl object-cover border border-purple-100" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500">
                <User size={18} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Edit Parent / Guardian Info</h3>
              <p className="text-[10px] text-purple-600 font-mono font-bold">
                {student.full_name} — {student.admission_number} · {student.class_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none outline-none">
            <XCircle size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Father */}
          <div>
            <Section title="Father's Information" icon={<User size={13} />} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Father's Name"       field="father_name"       placeholder="Full name" />
              <Field label="Father's Mobile"     field="father_mobile"     type="tel" placeholder="+91 XXXXX XXXXX" />
              <Field label="Father's Occupation" field="father_occupation" placeholder="e.g. Engineer" />
            </div>
          </div>

          {/* Mother */}
          <div>
            <Section title="Mother's Information" icon={<Heart size={13} />} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Mother's Name"       field="mother_name"       placeholder="Full name" />
              <Field label="Mother's Mobile"     field="mother_mobile"     type="tel" placeholder="+91 XXXXX XXXXX" />
              <Field label="Mother's Occupation" field="mother_occupation" placeholder="e.g. Home Maker" />
            </div>
          </div>

          {/* Guardian */}
          <div>
            <Section title="Guardian / Secondary Contact" icon={<Contact size={13} />} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Guardian Name"    field="guardian_name"     placeholder="Full name" />
              <Field label="Relation"         field="guardian_relation" placeholder="e.g. Uncle, Grandparent" />
              <Field label="Guardian Mobile"  field="guardian_mobile"   type="tel" />
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <Section title="Contact Details" icon={<Mail size={13} />} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Parent Email"     field="parent_email"     type="email" placeholder="parent@example.com" />
              <Field label="Alternate Mobile" field="alternate_mobile" type="tel"   placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>

          {/* Emergency */}
          <div>
            <Section title="Emergency Contact" icon={<ShieldAlert size={13} />} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Emergency Person"   field="emergency_name"     placeholder="Name" />
              <Field label="Relation"           field="emergency_relation" placeholder="e.g. Father, Doctor" />
              <Field label="Emergency Number"   field="emergency_number"   type="tel" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[11px] font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer bg-transparent transition outline-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-1.5 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-60 cursor-pointer border-none outline-none"
          >
            <Save size={12} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function ParentDetailDrawer({
  student, onClose, onEdit,
}: { student: ParentRecord; onClose: () => void; onEdit: () => void }) {

  const InfoRow = ({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2 border border-slate-100 bg-slate-50/60 rounded-lg p-2.5">
        {icon && <span className="text-purple-400 mt-0.5 flex-shrink-0">{icon}</span>}
        <div>
          <p className="text-[9px] font-bold uppercase text-gray-400">{label}</p>
          <p className="text-[11px] font-bold text-slate-800">{value}</p>
        </div>
      </div>
    );
  };

  const Section = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <span className="text-purple-500">{icon}</span>
      <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wide">{title}</p>
      <div className="flex-1 h-px bg-purple-100" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] flex justify-end" style={{ zIndex: 1200 }}>
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-slate-200">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {student.photo_url ? (
              <img src={student.photo_url} alt="Photo" className="w-12 h-12 rounded-xl object-cover border-2 border-purple-100 shadow" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500 shadow">
                <Baby size={22} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">{student.full_name}</h3>
              <p className="text-[10px] font-mono text-purple-600 font-bold">{student.admission_number}</p>
              <div className="flex gap-1 mt-1">
                <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">{student.class_name}</span>
                {student.section && <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Sec {student.section}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer transition outline-none"
            >
              <Edit3 size={11} /> Edit
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none outline-none p-1">
              <XCircle size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          <div>
            <Section title="Father" icon={<User size={12} />} />
            <div className="grid grid-cols-1 gap-2">
              <InfoRow label="Father's Name"       value={student.father_name}       icon={<User size={11} />} />
              <InfoRow label="Father's Mobile"     value={student.father_mobile}     icon={<Phone size={11} />} />
              <InfoRow label="Father's Occupation" value={student.father_occupation} />
            </div>
          </div>

          <div>
            <Section title="Mother" icon={<Heart size={12} />} />
            <div className="grid grid-cols-1 gap-2">
              <InfoRow label="Mother's Name"       value={student.mother_name}       icon={<User size={11} />} />
              <InfoRow label="Mother's Mobile"     value={student.mother_mobile}     icon={<Phone size={11} />} />
              <InfoRow label="Mother's Occupation" value={student.mother_occupation} />
            </div>
          </div>

          <div>
            <Section title="Guardian / Secondary" icon={<Contact size={12} />} />
            <div className="grid grid-cols-1 gap-2">
              <InfoRow label="Guardian Name"    value={student.guardian_name}     icon={<User size={11} />} />
              <InfoRow label="Relation"         value={student.guardian_relation} />
              <InfoRow label="Guardian Mobile"  value={student.guardian_mobile}   icon={<Phone size={11} />} />
            </div>
          </div>

          <div>
            <Section title="Contact Details" icon={<Mail size={12} />} />
            <div className="grid grid-cols-1 gap-2">
              <InfoRow label="Parent Email"     value={student.parent_email}    icon={<Mail size={11} />} />
              <InfoRow label="Alternate Mobile" value={student.alternate_mobile} icon={<Phone size={11} />} />
            </div>
          </div>

          <div>
            <Section title="Emergency Contact" icon={<ShieldAlert size={12} />} />
            <div className="grid grid-cols-1 gap-2">
              <InfoRow label="Emergency Person"   value={student.emergency_name}     icon={<User size={11} />} />
              <InfoRow label="Relation"           value={student.emergency_relation} />
              <InfoRow label="Emergency Number"   value={student.emergency_number}   icon={<Phone size={11} />} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Completeness Badge ───────────────────────────────────────────────
function ContactScore({ student }: { student: ParentRecord }) {
  const fields = [
    student.father_name, student.father_mobile,
    student.mother_name, student.mother_mobile,
    student.parent_email,
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  const color = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <span className={`text-[10px] font-extrabold ${pct === 100 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
        {filled}/{fields.length}
      </span>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ParentGuardianManagement() {
  const [students, setStudents] = useState<ParentRecord[]>([]);
  const [classes, setClasses]   = useState<MasterOption[]>([]);
  const [loading, setLoading]   = useState(true);

  const [viewTarget, setViewTarget] = useState<ParentRecord | null>(null);
  const [editTarget, setEditTarget] = useState<ParentRecord | null>(null);

  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);
  const [perPage]               = useState(15);

  const [search, setSearch]           = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterContact, setFilterContact] = useState(''); // 'complete' | 'incomplete'

  const [stats, setStats] = useState({ total: 0, complete: 0, incomplete: 0 });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isComplete = (s: ParentRecord) =>
    !!(s.father_name && s.father_mobile && s.mother_name && s.mother_mobile && s.parent_email);

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: perPage };
      if (search)      params.search   = search;
      if (filterClass) params.class_id = filterClass;

      const res = await api.get('/students', { params });
      if (res.data?.success) {
        let list: ParentRecord[] = res.data.data ?? [];

        // Client-side contact completeness filter
        if (filterContact === 'complete')   list = list.filter(isComplete);
        if (filterContact === 'incomplete') list = list.filter(s => !isComplete(s));

        setStudents(list);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        const allList: ParentRecord[] = res.data.data ?? [];
        setTotal(res.data.total ?? 0);
        setStats({
          total:      allList.length,
          complete:   allList.filter(isComplete).length,
          incomplete: allList.filter(s => !isComplete(s)).length,
        });
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterContact, perPage]);

  useEffect(() => {
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadData(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [loadData]);

  const handleEditSuccess = (updated: ParentRecord) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    if (viewTarget?.id === updated.id) setViewTarget(updated);
  };

  const pageRange = () => {
    const start = Math.max(1, page - 2);
    const end   = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const statCards = [
    { label: 'Total Students',       value: total,           color: 'from-violet-500 to-purple-600',  icon: <ClipboardList size={16} /> },
    { label: 'Complete Contacts',    value: stats.complete,  color: 'from-emerald-500 to-teal-600',   icon: <Check size={16} /> },
    { label: 'Missing Contact Info', value: stats.incomplete,color: 'from-amber-500 to-orange-600',   icon: <AlertCircle size={16} /> },
  ];

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {/* Modals */}
      {viewTarget && !editTarget && (
        <ParentDetailDrawer
          student={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => setEditTarget(viewTarget)}
        />
      )}
      {editTarget && (
        <EditParentModal
          student={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={updated => { handleEditSuccess(updated); setEditTarget(null); }}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">Parent / Guardian Hub</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                Manage parent contacts, guardian links, and emergency details for every student
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            {statCards.map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-xl p-3 flex items-center justify-between shadow-sm`}>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-wide">{s.label}</p>
                  <p className="text-xl font-extrabold mt-0.5">{s.value}</p>
                </div>
                <div className="opacity-50">{s.icon}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-shrink-0 px-3 py-2 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, adm. no..."
              className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50"
            />
          </div>

          <div className="w-36">
            <Select
              options={[{ value: '', label: 'All Classes' }, ...classes]}
              value={[{ value: '', label: 'All Classes' }, ...classes].find(c => String(c.value) === filterClass) ?? null}
              onChange={opt => setFilterClass(opt?.value !== undefined && opt.value !== '' ? String(opt.value) : '')}
              styles={selStyles}
              placeholder="All Classes"
              isClearable={false}
            />
          </div>

          <div className="w-38">
            <Select
              options={[
                { value: '',           label: 'All Records' },
                { value: 'complete',   label: 'Complete Contacts' },
                { value: 'incomplete', label: 'Incomplete Contacts' },
              ]}
              value={
                filterContact === 'complete'   ? { value: 'complete',   label: 'Complete Contacts' }   :
                filterContact === 'incomplete' ? { value: 'incomplete', label: 'Incomplete Contacts' } :
                { value: '', label: 'All Records' }
              }
              onChange={opt => setFilterContact(opt?.value ?? '')}
              styles={selStyles}
              isClearable={false}
            />
          </div>

          <button
            onClick={() => { setSearch(''); setFilterClass(''); setFilterContact(''); }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer transition ml-auto outline-none"
          >
            <RefreshCw size={12} /> Clear
          </button>
        </div>

        {/* ── Table ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                <tr>
                  <th className="px-3 py-2 w-10">Photo</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Father</th>
                  <th className="px-3 py-2">Mother</th>
                  <th className="px-3 py-2">Guardian</th>
                  <th className="px-3 py-2">Email / Alt. Mobile</th>
                  <th className="px-3 py-2 text-center">Completeness</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading guardian records…</p>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Users size={40} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No records found</p>
                      <p className="text-[10px] text-gray-300 mt-1">Try adjusting your search filters</p>
                    </td>
                  </tr>
                ) : students.map(std => {
                  const complete = isComplete(std);
                  return (
                    <tr key={std.id} className="border-b border-gray-50 hover:bg-purple-50/20 transition">
                      {/* Photo */}
                      <td className="px-3 py-2">
                        {std.photo_url ? (
                          <img src={std.photo_url} alt="Photo" className="w-8 h-8 rounded-lg object-cover border border-purple-100" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-400 border border-purple-100">
                            <Baby size={14} />
                          </div>
                        )}
                      </td>
                      {/* Student */}
                      <td className="px-3 py-2">
                        <p className="font-bold text-slate-800 leading-tight">{std.full_name}</p>
                        <p className="text-[10px] font-mono text-purple-600 font-bold">{std.admission_number}</p>
                        <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-100 font-bold px-1.5 py-0.5 rounded">{std.class_name}{std.section ? ` · ${std.section}` : ''}</span>
                      </td>
                      {/* Father */}
                      <td className="px-3 py-2">
                        {std.father_name ? (
                          <>
                            <p className="font-bold text-slate-700 leading-tight">{std.father_name}</p>
                            {std.father_mobile && <p className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={9} /> {std.father_mobile}</p>}
                            {std.father_occupation && <p className="text-[9px] text-gray-400 italic">{std.father_occupation}</p>}
                          </>
                        ) : (
                          <span className="text-[10px] text-red-400 font-semibold italic flex items-center gap-1"><AlertCircle size={10} /> Not set</span>
                        )}
                      </td>
                      {/* Mother */}
                      <td className="px-3 py-2">
                        {std.mother_name ? (
                          <>
                            <p className="font-bold text-slate-700 leading-tight">{std.mother_name}</p>
                            {std.mother_mobile && <p className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={9} /> {std.mother_mobile}</p>}
                            {std.mother_occupation && <p className="text-[9px] text-gray-400 italic">{std.mother_occupation}</p>}
                          </>
                        ) : (
                          <span className="text-[10px] text-red-400 font-semibold italic flex items-center gap-1"><AlertCircle size={10} /> Not set</span>
                        )}
                      </td>
                      {/* Guardian */}
                      <td className="px-3 py-2">
                        {std.guardian_name ? (
                          <>
                            <p className="font-bold text-slate-700 leading-tight">{std.guardian_name}</p>
                            {std.guardian_relation && <p className="text-[9px] text-indigo-500 font-bold">{std.guardian_relation}</p>}
                            {std.guardian_mobile && <p className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={9} /> {std.guardian_mobile}</p>}
                          </>
                        ) : (
                          <span className="text-[9px] text-gray-400 italic">—</span>
                        )}
                      </td>
                      {/* Email / Alt Mobile */}
                      <td className="px-3 py-2">
                        {std.parent_email ? (
                          <p className="text-[10px] text-gray-600 font-semibold truncate max-w-[130px]" title={std.parent_email}>{std.parent_email}</p>
                        ) : (
                          <span className="text-[9px] text-red-400 italic font-semibold flex items-center gap-1"><AlertCircle size={9} /> No email</span>
                        )}
                        {std.alternate_mobile && (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={9} /> {std.alternate_mobile}</p>
                        )}
                        {std.emergency_name && (
                          <p className="text-[9px] text-amber-600 font-bold flex items-center gap-1 mt-0.5"><ShieldAlert size={9} /> {std.emergency_name}</p>
                        )}
                      </td>
                      {/* Completeness */}
                      <td className="px-3 py-2">
                        <div className="flex justify-center">
                          <ContactScore student={std} />
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => { setViewTarget(std); setEditTarget(null); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600 transition cursor-pointer bg-transparent border-none outline-none"
                            title="View all contact details"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => setEditTarget(std)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer border-none outline-none"
                            title="Edit parent/guardian info"
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && students.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-gray-400">
                Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total} students
              </span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => loadData(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                  <ChevronLeft size={14} />
                </button>
                {pageRange().map(p => (
                  <button
                    key={p}
                    onClick={() => loadData(p)}
                    className={`w-6 h-6 rounded text-[10px] font-bold cursor-pointer border-none outline-none transition ${p === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}
                  >
                    {p}
                  </button>
                ))}
                <button disabled={page >= lastPage} onClick={() => loadData(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
