import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Eye, User, XCircle, RefreshCw, Upload, Trash2,
  ChevronRight, ChevronLeft, ClipboardList, CheckCircle,
  FileText, ImageIcon, FileCheck, AlertCircle, Download,
  CreditCard, BookOpen, School, ShieldCheck, BadgeCheck,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ─────────────────────────────────────────────────────────────────
interface DocSlot {
  key: string;
  label: string;
  icon: React.ReactNode;
  accept: string;
  hasNumber?: boolean;
  numberKey?: string;
  numberLabel?: string;
}

interface StudentDoc {
  id: number;
  full_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  aadhaar_number: string | null;
  migration_number: string | null;
  transfer_number: string | null;
  aadhaar_card_url: string | null;
  migration_card_url: string | null;
  transfer_card_url: string | null;
  bonafide_card_url: string | null;
  character_card_url: string | null;
  marksheet_card_url: string | null;
  user: { first_name: string; last_name: string; email: string; is_active: boolean } | null;
}

interface MasterOption { value: string | number; label: string; }

// ─── Document slot definitions ──────────────────────────────────────────────
const DOC_SLOTS: DocSlot[] = [
  { key: 'aadhaar_card',     label: 'Aadhaar Card Copy',      icon: <CreditCard size={14} />,  accept: 'image/*,.pdf', hasNumber: true, numberKey: 'aadhaar_number',   numberLabel: 'Aadhaar Number' },
  { key: 'migration_card',   label: 'Migration Certificate',  icon: <FileText size={14} />,    accept: 'image/*,.pdf', hasNumber: true, numberKey: 'migration_number', numberLabel: 'Migration No.' },
  { key: 'transfer_card',    label: 'Transfer Certificate',   icon: <FileCheck size={14} />,   accept: 'image/*,.pdf', hasNumber: true, numberKey: 'transfer_number',  numberLabel: 'TC Number' },
  { key: 'bonafide_card',    label: 'Bonafide Certificate',   icon: <BadgeCheck size={14} />,  accept: 'image/*,.pdf' },
  { key: 'character_card',   label: 'Character Certificate',  icon: <ShieldCheck size={14} />, accept: 'image/*,.pdf' },
  { key: 'marksheet_card',   label: 'Marksheet File',         icon: <School size={14} />,      accept: 'image/*,.pdf' },
  { key: 'photo',            label: 'Profile Photo',          icon: <ImageIcon size={14} />,   accept: 'image/*' },
];

const DOC_URL_KEYS: Record<string, string> = {
  aadhaar_card:   'aadhaar_card_url',
  migration_card: 'migration_card_url',
  transfer_card:  'transfer_card_url',
  bonafide_card:  'bonafide_card_url',
  character_card: 'character_card_url',
  marksheet_card: 'marksheet_card_url',
  photo:          'photo_url',
};

// ─── react-select compact styles ──────────────────────────────────────────
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

// ─── Upload Modal ───────────────────────────────────────────────────────────
function UploadModal({
  student,
  onClose,
  onSuccess,
}: { student: StudentDoc; onClose: () => void; onSuccess: (updated: StudentDoc) => void }) {
  const [files, setFiles]     = useState<Record<string, File | null>>({});
  const [numbers, setNumbers] = useState<Record<string, string>>({
    aadhaar_number:   student.aadhaar_number   ?? '',
    migration_number: student.migration_number ?? '',
    transfer_number:  student.transfer_number  ?? '',
  });
  const [saving, setSaving]   = useState(false);
  const fileRefs              = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = (key: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleSave = async () => {
    const hasChange = Object.values(files).some(f => f !== null && f !== undefined)
      || Object.keys(numbers).some(k => {
        const orig = (student as any)[k] ?? '';
        return numbers[k] !== orig;
      });

    if (!hasChange) { toast('No changes to save', { icon: 'ℹ️' }); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      DOC_SLOTS.forEach(slot => {
        if (files[slot.key]) fd.append(slot.key, files[slot.key]!);
      });
      Object.entries(numbers).forEach(([k, v]) => { if (v) fd.append(k, v); });

      const res = await api.post(`/students/${student.id}/update-documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        toast.success('Documents updated successfully!');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const getDocUrl = (slot: DocSlot): string | null => (student as any)[DOC_URL_KEYS[slot.key]] ?? null;
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

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
              <h3 className="text-sm font-extrabold text-slate-800">{student.full_name}</h3>
              <p className="text-[10px] font-mono text-purple-600 font-bold">{student.admission_number} • {student.class_name}{student.section ? ` – Sec ${student.section}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none outline-none">
            <XCircle size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-[11px] text-gray-500 font-semibold">Select files to upload or replace. Accepted formats: Image, PDF.</p>

          {DOC_SLOTS.map(slot => {
            const existingUrl = getDocUrl(slot);
            const selectedFile = files[slot.key];

            return (
              <div key={slot.key} className="border border-gray-100 rounded-xl bg-slate-50/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">{slot.icon}</span>
                    <p className="text-[11px] font-bold text-slate-700">{slot.label}</p>
                    {existingUrl && !selectedFile && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                        <CheckCircle size={9} /> Uploaded
                      </span>
                    )}
                    {selectedFile && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <Upload size={9} /> New file selected
                      </span>
                    )}
                    {!existingUrl && !selectedFile && (
                      <span className="text-[9px] text-gray-400 font-semibold italic">Not uploaded</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {existingUrl && !selectedFile && (
                      <a
                        href={existingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-white border border-purple-100 px-2 py-1 rounded-lg hover:bg-purple-50 cursor-pointer transition"
                      >
                        <Eye size={10} /> View
                      </a>
                    )}
                    <button
                      onClick={() => fileRefs.current[slot.key]?.click()}
                      className="flex items-center gap-1 text-[10px] font-bold text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded-lg hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 cursor-pointer transition"
                    >
                      <Upload size={10} /> {existingUrl ? 'Replace' : 'Upload'}
                    </button>
                    <input
                      type="file"
                      accept={slot.accept}
                      className="hidden"
                      ref={el => fileRefs.current[slot.key] = el}
                      onChange={e => handleFileChange(slot.key, e.target.files?.[0] ?? null)}
                    />
                    {selectedFile && (
                      <button
                        onClick={() => handleFileChange(slot.key, null)}
                        className="text-[10px] text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer p-1 rounded hover:bg-red-50 transition outline-none"
                        title="Remove selection"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected file preview */}
                {selectedFile && (
                  <div className="text-[10px] text-gray-600 bg-white border border-amber-100 rounded-lg px-2.5 py-1.5 font-semibold truncate">
                    📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}

                {/* Existing image preview */}
                {existingUrl && !selectedFile && isImage(existingUrl) && (
                  <img src={existingUrl} alt={slot.label} className="h-16 w-auto rounded-lg border border-gray-200 object-cover" />
                )}

                {/* Reference number input */}
                {slot.hasNumber && slot.numberKey && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-0.5 block">{slot.numberLabel}</label>
                    <input
                      value={numbers[slot.numberKey] ?? ''}
                      onChange={e => setNumbers(prev => ({ ...prev, [slot.numberKey!]: e.target.value }))}
                      placeholder={`Enter ${slot.numberLabel}`}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-purple-400 bg-white"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[11px] font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer bg-transparent transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-1.5 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-60 cursor-pointer border-none"
          >
            {saving ? 'Saving…' : 'Save Documents'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document Status Badge ──────────────────────────────────────────────────
function DocBadge({ uploaded, label }: { uploaded: boolean; label: string }) {
  return (
    <div
      title={label}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold whitespace-nowrap ${
        uploaded
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-gray-50 border-gray-200 text-gray-400'
      }`}
    >
      {uploaded ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
      {label}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function StudentDocumentManagement() {
  const [students, setStudents]       = useState<StudentDoc[]>([]);
  const [classes, setClasses]         = useState<MasterOption[]>([]);
  const [loading, setLoading]         = useState(true);
  const [uploadTarget, setUploadTarget] = useState<StudentDoc | null>(null);

  const [stats, setStats] = useState({ total: 0, complete: 0, partial: 0, missing: 0 });

  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);
  const [perPage]               = useState(15);

  const [search, setSearch]           = useState('');
  const [filterClass, setFilterClass] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const docCount = (s: StudentDoc) =>
    [s.aadhaar_card_url, s.migration_card_url, s.transfer_card_url,
     s.bonafide_card_url, s.character_card_url, s.marksheet_card_url]
     .filter(Boolean).length;

  const computeStats = useCallback((list: StudentDoc[]) => {
    let complete = 0, partial = 0, missing = 0;
    list.forEach(s => {
      const cnt = docCount(s);
      if (cnt === 6) complete++;
      else if (cnt > 0) partial++;
      else missing++;
    });
    setStats({ total: list.length, complete, partial, missing });
  }, []);

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: perPage };
      if (search)      params.search   = search;
      if (filterClass) params.class_id = filterClass;

      const res = await api.get('/students', { params });
      if (res.data?.success) {
        const list = res.data.data ?? [];
        setStudents(list);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
        computeStats(list);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, perPage, computeStats]);

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

  const handleUploadSuccess = (updated: StudentDoc) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
  };

  const pageRange = () => {
    const start = Math.max(1, page - 2);
    const end   = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const statCards = [
    { label: 'Total Students',    value: total,          color: 'from-purple-500 to-indigo-600', icon: <ClipboardList size={16} /> },
    { label: 'Complete Docs',     value: stats.complete, color: 'from-emerald-500 to-teal-600',  icon: <CheckCircle size={16} /> },
    { label: 'Partial Docs',      value: stats.partial,  color: 'from-amber-500 to-orange-600',  icon: <AlertCircle size={16} /> },
    { label: 'Missing All Docs',  value: stats.missing,  color: 'from-rose-500 to-red-600',      icon: <XCircle size={16} /> },
  ];

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {uploadTarget && (
        <UploadModal
          student={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSuccess={handleUploadSuccess}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">Student Document Management</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                Upload, verify and manage official certificates and document files for each student
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-3">
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

        {/* ── Filter Bar ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-shrink-0 px-3 py-2 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, admission no..."
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

          <button
            onClick={() => { setSearch(''); setFilterClass(''); }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer transition ml-auto outline-none"
          >
            <RefreshCw size={12} /> Clear
          </button>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                <tr>
                  <th className="px-4 py-2 w-10">Photo</th>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Class</th>
                  <th className="px-4 py-2">Document Status</th>
                  <th className="px-4 py-2 text-center">Completeness</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading students…</p>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <FileText size={40} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No students found</p>
                      <p className="text-[10px] text-gray-300 mt-1">Adjust filters to see results</p>
                    </td>
                  </tr>
                ) : students.map(std => {
                  const cnt = docCount(std);
                  const pct = Math.round((cnt / 6) * 100);
                  const barColor = pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-amber-400' : 'bg-red-400';

                  return (
                    <tr key={std.id} className="border-b border-gray-50 hover:bg-purple-50/20 transition">
                      {/* Photo */}
                      <td className="px-4 py-2">
                        {std.photo_url ? (
                          <img src={std.photo_url} alt="Photo" className="w-8 h-8 rounded-lg object-cover border border-purple-100" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-400 border border-purple-100">
                            <User size={14} />
                          </div>
                        )}
                      </td>
                      {/* Student Info */}
                      <td className="px-4 py-2">
                        <p className="font-bold text-slate-800">{std.full_name}</p>
                        <p className="text-[10px] font-mono text-purple-600 font-bold">{std.admission_number || '—'}</p>
                        <p className="text-[10px] text-gray-400">{std.user?.email || '—'}</p>
                      </td>
                      {/* Class */}
                      <td className="px-4 py-2">
                        <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                          {std.class_name || '—'}
                        </span>
                        {std.section && (
                          <p className="text-[9px] text-gray-400 mt-0.5">Sec: {std.section}</p>
                        )}
                      </td>
                      {/* Doc Status Badges */}
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          <DocBadge uploaded={!!std.aadhaar_card_url}   label="Aadhaar" />
                          <DocBadge uploaded={!!std.migration_card_url} label="Migration" />
                          <DocBadge uploaded={!!std.transfer_card_url}  label="TC" />
                          <DocBadge uploaded={!!std.bonafide_card_url}  label="Bonafide" />
                          <DocBadge uploaded={!!std.character_card_url} label="Character" />
                          <DocBadge uploaded={!!std.marksheet_card_url} label="Marksheet" />
                        </div>
                      </td>
                      {/* Progress Bar */}
                      <td className="px-4 py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-[10px] font-extrabold ${pct === 100 ? 'text-green-600' : pct > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                            {cnt}/6 docs
                          </span>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold">{pct}%</span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setUploadTarget(std)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer border-none outline-none"
                          >
                            <Upload size={11} /> Manage Docs
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ─────────────────────────────────────────────── */}
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
