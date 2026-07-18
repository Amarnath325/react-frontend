import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import {
  ShieldCheck, Lock, Unlock, Edit3, Search, Trash2,
  X, RefreshCw, CheckSquare, ChevronLeft, ChevronRight,
  Archive, RotateCcw, AlertCircle, Loader2, Award,
  CheckCircle, AlertTriangle, Download, Upload,
  BarChart2, TrendingUp, BookOpen, ClipboardCheck,
  Eye, XCircle, Shield
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────── */
interface MarkRecord {
  id: number;
  exam_id: number;
  exam_name: string;
  student_id: number;
  student_name: string;
  admission_no: string;
  class_name: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  status: 'Draft' | 'Verified';
  remarks: string | null;
  deleted_at: string | null;
}

interface VerificationStats {
  total: number;
  draft: number;
  verified: number;
  trashed: number;
  passed: number;
  failed: number;
  avg_pct: number;
  pass_rate: number;
  verify_rate: number;
  by_exam: ExamBreakdown[];
}

interface ExamBreakdown {
  exam_id: number;
  exam_name: string;
  class_name: string;
  total: number;
  verified: number;
  draft: number;
  pct_verified: number;
}

interface DropdownOption {
  value: string;
  label: string;
}

/* ─────────────────────────────────────────────────────────────
   REACT-SELECT STYLES
   ───────────────────────────────────────────────────────────── */
const selectStyles = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '0.375rem',
    borderColor: s.isFocused ? '#6366f1' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(99,102,241,0.15)' : 'none',
    minHeight: '28px', height: '28px', backgroundColor: '#fff',
    '&:hover': { borderColor: s.isFocused ? '#6366f1' : '#d1d5db' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '28px', display: 'flex', alignItems: 'center' }),
  input: (b: any) => ({ ...b, margin: '0', padding: '0', fontSize: '11px' }),
  placeholder: (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '26px' }),
  option: (b: any, s: any) => ({
    ...b,
    backgroundColor: s.isSelected ? '#6366f1' : s.isFocused ? '#f3f4f6' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151', fontSize: '11px', padding: '6px 8px', cursor: 'pointer',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 99999 }),
  menuPortal: (b: any) => ({ ...b, zIndex: 99999 }),
  clearIndicator: (b: any) => ({ ...b, padding: '2px' }),
  dropdownIndicator: (b: any) => ({ ...b, padding: '2px' }),
};

const SSelect: React.FC<{
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  className?: string;
}> = ({ options, value, onChange, placeholder = 'Select...', isClearable = true, className = 'w-40' }) => {
  const selected = options.find(o => o.value === value) || null;
  return (
    <div className={className}>
      <Select
        options={options}
        value={selected}
        onChange={opt => onChange((opt as DropdownOption)?.value || '')}
        placeholder={placeholder}
        isClearable={isClearable}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────────────────────── */
const KpiCard: React.FC<{
  label: string; value: string | number; icon: React.ReactNode;
  color: string; bg: string; border: string; sub?: string;
}> = ({ label, value, icon, color, bg, border, sub }) => (
  <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${border} ${bg} shadow-sm flex-1 min-w-0`}>
    <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider truncate">{label}</p>
      <p className="text-xl font-black text-gray-800 leading-tight">{value}</p>
      {sub && <p className="text-[9px] text-gray-400 font-medium truncate">{sub}</p>}
    </div>
  </div>
);

const SortTh: React.FC<{
  field: string; label: string; sortField: string;
  sortDir: 'asc' | 'desc'; onSort: (f: string) => void; className?: string;
}> = ({ field, label, sortField, sortDir, onSort, className = '' }) => {
  const active = sortField === field;
  return (
    <th onClick={() => onSort(field)}
      className={`py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors select-none ${className}`}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="text-gray-400">{active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </div>
    </th>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = status === 'Verified'
    ? { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Lock className="w-2.5 h-2.5" /> }
    : { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Edit3 className="w-2.5 h-2.5" /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${cfg.cls}`}>
      {cfg.icon}{status}
    </span>
  );
};

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const colors: Record<string, string> = {
    'A+': 'bg-emerald-100 text-emerald-700', 'A': 'bg-emerald-50 text-emerald-600',
    'B+': 'bg-teal-100 text-teal-700', 'B': 'bg-blue-100 text-blue-700',
    'C+': 'bg-amber-100 text-amber-700', 'C': 'bg-amber-50 text-amber-600',
    'D': 'bg-orange-100 text-orange-700', 'F': 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black font-mono ${colors[grade] || 'bg-gray-100 text-gray-500'}`}>
      {grade || '\u2014'}
    </span>
  );
};

const ProgressBar: React.FC<{ pct: number }> = ({ pct }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
    <span className="text-[10px] font-bold text-gray-600 w-8 text-right">{pct}%</span>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   CSV HELPERS
   ───────────────────────────────────────────────────────────── */
function parseCSV(text: string): Record<string, string>[] {
  const result: Record<string, string>[] = [];
  const lines = text.split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row: string[] = [];
    let inQ = false, cur = '';
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { row.push(cur.trim().replace(/^["']|["']$/g, '')); cur = ''; }
      else { cur += c; }
    }
    row.push(cur.trim().replace(/^["']|["']$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });
    result.push(obj);
  }
  return result;
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function MarksVerificationAudit() {
  const [vstats, setVstats] = useState<VerificationStats>({
    total: 0, draft: 0, verified: 0, trashed: 0,
    passed: 0, failed: 0, avg_pct: 0, pass_rate: 0, verify_rate: 0, by_exam: [],
  });
  const [marks, setMarks]               = useState<MarkRecord[]>([]);
  const [loading, setLoading]           = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [academicYears, setAcademicYears] = useState<DropdownOption[]>([]);
  const [classes, setClasses]             = useState<DropdownOption[]>([]);
  const [examinations, setExaminations]   = useState<DropdownOption[]>([]);
  const [subjects, setSubjects]           = useState<DropdownOption[]>([]);
  const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

  const [selectedYear, setSelectedYear]       = useState('');
  const [selectedClass, setSelectedClass]     = useState('');
  const [selectedExam, setSelectedExam]       = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filterGrade, setFilterGrade]         = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [searchTerm, setSearchTerm]           = useState('');
  const [showTrashed, setShowTrashed]         = useState(false);

  const [selectedIds, setSelectedIds]   = useState<number[]>([]);
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField]       = useState('student_name');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');

  const [detailRow, setDetailRow] = useState<MarkRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<{
    open: boolean; imported: number; failed: number; errors: Record<number, string[]>;
  } | null>(null);

  const [showBreakdown, setShowBreakdown] = useState(true);

  /* ── Fetch ── */
  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get('/student-exams/marks/verification-stats');
      if (r.data.success) setVstats(r.data.data);
    } catch { /* silent */ }
  }, []);

  const fetchMasters = useCallback(async () => {
    try {
      const [mR, eR] = await Promise.all([
        api.get('/student-exams/masters'),
        api.get('/student-exams/exams'),
      ]);
      if (mR.data.success) {
        const { academicYears: ay, classes: cl } = mR.data.data;
        setAcademicYears((ay || []).map((y: any) => ({ value: String(y.value), label: y.label })));
        setClasses((cl || []).map((c: any) => ({ value: String(c.value), label: c.label })));
      }
      if (eR.data.success) {
        setExaminations((eR.data.data || []).map((e: any) => ({
          value: String(e.id), label: `${e.class_name} — ${e.name}`,
        })));
      }
    } catch { toast.error('Failed to load filter options'); }
  }, []);

  useEffect(() => {
    if (!selectedClass) { setSubjects([]); setSelectedSubject(''); return; }
    api.get(`/student-exams/subjects/by-class/${selectedClass}`)
      .then(r => { if (r.data.success) setSubjects((r.data.data || []).map((s: any) => ({ value: String(s.value), label: s.label }))); })
      .catch(() => {});
  }, [selectedClass]);

  const fetchMarks = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/student-exams/marks', {
        params: {
          trashed: showTrashed ? '1' : '0',
          academic_year_id: selectedYear   || undefined,
          exam_id:          selectedExam   || undefined,
          subject_id:       selectedSubject|| undefined,
          grade:            filterGrade    || undefined,
          status:           filterStatus   || undefined,
        },
      });
      if (r.data.success) setMarks(r.data.data);
    } catch { toast.error('Failed to load marks'); }
    finally { setLoading(false); }
  }, [showTrashed, selectedYear, selectedExam, selectedSubject, filterGrade, filterStatus]);

  useEffect(() => { fetchStats(); fetchMasters(); }, [fetchStats, fetchMasters]);
  useEffect(() => { fetchMarks(); setCurrentPage(1); setSelectedIds([]); }, [fetchMarks]);

  /* ── Computed ── */
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return marks;
    const q = searchTerm.toLowerCase();
    return marks.filter(m =>
      m.student_name.toLowerCase().includes(q) ||
      m.admission_no.toLowerCase().includes(q) ||
      m.exam_name.toLowerCase().includes(q) ||
      m.subject_name.toLowerCase().includes(q)
    );
  }, [marks, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = (a as any)[sortField] ?? '';
      const vb = (b as any)[sortField] ?? '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const paginated   = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const isAllSel    = paginated.length > 0 && paginated.every(r => selectedIds.includes(r.id));
  const isSomeSel   = selectedIds.length > 0;
  const hasFilters  = !!(selectedYear || selectedClass || selectedExam || selectedSubject || filterGrade || filterStatus || searchTerm);

  const handleSort = (f: string) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  };

  const handleSelectAll = () => {
    const ids = paginated.map(r => r.id);
    setSelectedIds(isAllSel ? selectedIds.filter(id => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  };
  const toggleSelect = (id: number) =>
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  /* ── Row Actions ── */
  const rowVerify = async (id: number) => {
    try { await api.post('/student-exams/marks/bulk-status', { ids: [id], status: 'Verified' }); toast.success('Verified & locked'); fetchMarks(); fetchStats(); }
    catch { toast.error('Failed'); }
  };
  const rowRevert = async (id: number) => {
    try { await api.post('/student-exams/marks/bulk-status', { ids: [id], status: 'Draft' }); toast.success('Reverted to Draft'); fetchMarks(); fetchStats(); }
    catch { toast.error('Failed'); }
  };
  const rowTrash = async (id: number) => {
    if (!confirm('Move this record to trash?')) return;
    try { await api.delete(`/student-exams/marks/${id}`); toast.success('Trashed'); fetchMarks(); fetchStats(); }
    catch { toast.error('Failed'); }
  };
  const rowRestore = async (id: number) => {
    try { await api.post(`/student-exams/marks/${id}/restore`); toast.success('Restored'); fetchMarks(); fetchStats(); }
    catch { toast.error('Failed'); }
  };
  const rowForce = async (id: number) => {
    if (!confirm('Permanently delete? This cannot be undone.')) return;
    try { await api.delete(`/student-exams/marks/${id}/force`); toast.success('Deleted'); fetchMarks(); fetchStats(); }
    catch { toast.error('Failed'); }
  };

  /* ── Bulk Actions ── */
  const bulkAction = async (action: string) => {
    if (!isSomeSel) return;
    setBulkUpdating(true);
    try {
      if (action === 'verify')  { await api.post('/student-exams/marks/bulk-status',  { ids: selectedIds, status: 'Verified' }); toast.success(`${selectedIds.length} verified`); }
      if (action === 'revert')  { await api.post('/student-exams/marks/bulk-status',  { ids: selectedIds, status: 'Draft'    }); toast.success(`${selectedIds.length} reverted`); }
      if (action === 'trash')   { await api.post('/student-exams/marks/bulk-delete',  { ids: selectedIds                     }); toast.success(`${selectedIds.length} trashed`); }
      if (action === 'restore') { await api.post('/student-exams/marks/bulk-restore', { ids: selectedIds                     }); toast.success(`${selectedIds.length} restored`); }
      if (action === 'force')   {
        if (!confirm(`Permanently delete ${selectedIds.length} record(s)?`)) { setBulkUpdating(false); return; }
        await api.post('/student-exams/marks/bulk-delete', { ids: selectedIds, force: true });
        toast.success('Permanently deleted');
      }
      setSelectedIds([]);
      fetchMarks();
      fetchStats();
    } catch { toast.error('Bulk action failed'); }
    finally { setBulkUpdating(false); }
  };

  /* ── Export / Import ── */
  const handleExport = () => {
    const qs = selectedExam ? `?exam_id=${selectedExam}` : '';
    window.open(`http://localhost:8000/api/school/student-exams/marks/export${qs}`, '_blank');
  };
  const handleSample = () => window.open('http://localhost:8000/api/school/student-exams/marks/sample', '_blank');
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (!rows.length) { toast.error('Empty or invalid CSV'); return; }
    try {
      const r = await api.post('/student-exams/marks/bulk-import', { data: rows });
      setImportReport({ open: true, imported: r.data.imported_count ?? 0, failed: r.data.error_count ?? 0, errors: r.data.errors ?? {} });
      fetchMarks(); fetchStats();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Import failed'); }
    e.target.value = '';
  };

  const clearFilters = () => {
    setSelectedYear(''); setSelectedClass(''); setSelectedExam('');
    setSelectedSubject(''); setFilterGrade(''); setFilterStatus('');
    setSearchTerm(''); setShowTrashed(false); setCurrentPage(1);
  };

  /* ════════════════════════ RENDER ════════════════════════════ */
  return (
    <div className="flex flex-col gap-3 p-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-black text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Marks Verification &amp; Audit
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Lock, verify, and audit student examination marks before publishing results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchStats(); fetchMarks(); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setShowBreakdown(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition shadow-sm">
            <BarChart2 className="w-3.5 h-3.5" /> {showBreakdown ? 'Hide' : 'Show'} Breakdown
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <KpiCard label="Total Records"  value={vstats.total}            icon={<BookOpen     className="w-4 h-4 text-white" />} color="bg-indigo-600"  bg="bg-indigo-50"  border="border-indigo-100" />
        <KpiCard label="Draft"          value={vstats.draft}            icon={<Edit3        className="w-4 h-4 text-white" />} color="bg-amber-500"   bg="bg-amber-50"   border="border-amber-100"  sub="Pending review" />
        <KpiCard label="Verified"       value={vstats.verified}         icon={<Lock         className="w-4 h-4 text-white" />} color="bg-emerald-600" bg="bg-emerald-50" border="border-emerald-100" sub="Locked & audited" />
        <KpiCard label="Trashed"        value={vstats.trashed}          icon={<Trash2       className="w-4 h-4 text-white" />} color="bg-rose-500"    bg="bg-rose-50"    border="border-rose-100"   />
        <KpiCard label="Verify Rate"    value={`${vstats.verify_rate}%`} icon={<Shield      className="w-4 h-4 text-white" />} color="bg-violet-600"  bg="bg-violet-50"  border="border-violet-100" />
        <KpiCard label="Pass Rate"      value={`${vstats.pass_rate}%`}  icon={<Award        className="w-4 h-4 text-white" />} color="bg-teal-600"    bg="bg-teal-50"    border="border-teal-100"   />
        <KpiCard label="Avg Score"      value={`${vstats.avg_pct}%`}    icon={<TrendingUp   className="w-4 h-4 text-white" />} color="bg-sky-600"     bg="bg-sky-50"     border="border-sky-100"    />
      </div>

      {/* Exam Breakdown */}
      {showBreakdown && vstats.by_exam.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/80">
            <h2 className="text-[11px] font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-500" /> Verification Progress by Examination
            </h2>
            <span className="text-[10px] text-gray-400">{vstats.by_exam.length} exam(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/40">
                  {['Examination', 'Class', 'Total', 'Verified', 'Pending', 'Progress'].map(h => (
                    <th key={h} className={`py-1.5 px-3 font-bold text-gray-500 uppercase text-[10px] ${['Total','Verified','Pending'].includes(h) ? 'text-center' : 'text-left'} ${h === 'Progress' ? 'w-52' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vstats.by_exam.map(ex => (
                  <tr key={ex.exam_id} className="border-b border-gray-50 hover:bg-indigo-50/20 transition-colors">
                    <td className="py-2 px-3 font-semibold text-gray-700">{ex.exam_name}</td>
                    <td className="py-2 px-3 text-gray-500">{ex.class_name}</td>
                    <td className="py-2 px-3 text-center font-bold text-gray-700">{ex.total}</td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-600">{ex.verified}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-bold ${ex.draft > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{ex.draft}</span>
                    </td>
                    <td className="py-2 px-3 w-52">
                      {ex.total > 0 ? <ProgressBar pct={ex.pct_verified} /> : <span className="text-[10px] text-gray-300 italic">No records</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2 py-0.5 h-7 w-60">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input type="text" value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search student, exam, subject..."
            className="flex-1 text-[11px] outline-none bg-transparent text-gray-700 placeholder-gray-400" />
          {searchTerm && <button onClick={() => setSearchTerm('')}><X className="w-3 h-3 text-gray-400" /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="h-7 border border-gray-300 rounded-lg text-[11px] text-gray-600 px-1.5 bg-white">
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
          </select>
          <button onClick={() => { setShowTrashed(v => !v); setCurrentPage(1); setSelectedIds([]); }}
            className={`flex items-center gap-1.5 border rounded-lg px-2 py-0.5 h-7 text-[11px] font-semibold transition
              ${showTrashed ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-gray-300 text-gray-500'}`}>
            <Archive className="w-3 h-3" /> {showTrashed ? 'Trashed ✓' : 'Trashed'}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleSample}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-[11px] font-semibold h-7">
            <Download className="w-3.5 h-3.5" /> Sample
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-[11px] font-semibold h-7">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-[11px] font-semibold h-7">
            <Download className="w-3.5 h-3.5 text-green-600" /> Export
          </button>
          <button onClick={() => bulkAction('verify')} disabled={!isSomeSel || bulkUpdating}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold h-7 shadow-sm disabled:opacity-50 transition">
            <ShieldCheck className="w-3.5 h-3.5" /> Verify Selected
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Bulk Action Bar */}
      {isSomeSel && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
          <span className="text-[11px] font-bold text-indigo-700">{selectedIds.length} selected</span>
          <div className="flex items-center gap-1.5 ml-2 flex-wrap">
            <button onClick={() => bulkAction('verify')} disabled={bulkUpdating}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50">
              <Lock className="w-3 h-3" /> Lock &amp; Verify
            </button>
            <button onClick={() => bulkAction('revert')} disabled={bulkUpdating}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50">
              <Unlock className="w-3 h-3" /> Revert to Draft
            </button>
            {!showTrashed ? (
              <button onClick={() => bulkAction('trash')} disabled={bulkUpdating}
                className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50">
                <Trash2 className="w-3 h-3" /> Trash
              </button>
            ) : (
              <>
                <button onClick={() => bulkAction('restore')} disabled={bulkUpdating}
                  className="flex items-center gap-1 px-2.5 py-0.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50">
                  <RotateCcw className="w-3 h-3" /> Restore
                </button>
                <button onClick={() => bulkAction('force')} disabled={bulkUpdating}
                  className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50">
                  <XCircle className="w-3 h-3" /> Force Delete
                </button>
              </>
            )}
          </div>
          {bulkUpdating && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin ml-1" />}
          <button onClick={() => setSelectedIds([])} className="ml-auto text-indigo-400 hover:text-indigo-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
        <SSelect options={academicYears} value={selectedYear}    onChange={v => { setSelectedYear(v);    setCurrentPage(1); }} placeholder="Academic Year" className="w-36" />
        <SSelect options={classes}       value={selectedClass}   onChange={v => { setSelectedClass(v);   setCurrentPage(1); }} placeholder="Class"         className="w-28" />
        <SSelect options={subjects}      value={selectedSubject} onChange={v => { setSelectedSubject(v); setCurrentPage(1); }} placeholder="Subject"       className="w-40" />
        <SSelect options={examinations}  value={selectedExam}    onChange={v => { setSelectedExam(v);    setCurrentPage(1); }} placeholder="Examination"   className="w-48" />
        <SSelect options={grades.map(g => ({ value: g, label: `Grade ${g}` }))} value={filterGrade} onChange={v => { setFilterGrade(v); setCurrentPage(1); }} placeholder="Grade" className="w-28" />
        <SSelect
          options={[{ value: 'Draft', label: '📝 Draft' }, { value: 'Verified', label: '🔒 Verified' }]}
          value={filterStatus} onChange={v => { setFilterStatus(v); setCurrentPage(1); }} placeholder="Status" className="w-32"
        />
        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-0.5 text-[11px] text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5 rounded hover:bg-rose-50 transition">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-[10px] text-gray-400 font-bold">
          {sorted.length} record{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-2 px-3 w-8">
                  <input type="checkbox" checked={isAllSel} onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5 cursor-pointer" />
                </th>
                <SortTh field="admission_no"   label="Adm No"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortTh field="student_name"   label="Student"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortTh field="class_name"     label="Class"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortTh field="exam_name"      label="Exam"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortTh field="subject_name"   label="Subject"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortTh field="marks_obtained" label="Score"    sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                <SortTh field="percentage"     label="%"        sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                <SortTh field="grade"          label="Grade"    sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center" />
                <SortTh field="status"         label="Status"   sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center" />
                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="py-14 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                  <p className="text-[11px] text-gray-400">Loading records...</p>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={11} className="py-16 text-center">
                  <ClipboardCheck className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-[12px] font-bold text-gray-400">No marks records found.</p>
                  <p className="text-[10px] text-gray-300 mt-1">Adjust filters or enter marks via the Marks Entry module.</p>
                </td></tr>
              ) : paginated.map((row, idx) => {
                const isSel      = selectedIds.includes(row.id);
                const isVerified = row.status === 'Verified';
                return (
                  <tr key={row.id}
                    className={`border-b border-slate-50 transition-colors
                      ${isSel ? 'bg-indigo-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                      hover:bg-indigo-50/30`}>
                    <td className="py-2 px-3">
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(row.id)}
                        className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5 cursor-pointer" />
                    </td>
                    <td className="py-2 px-3 font-mono text-gray-500 text-[10px]">{row.admission_no || '\u2014'}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[7px] font-black text-white">{(row.student_name || '?').charAt(0)}</span>
                        </div>
                        <span className="font-semibold text-gray-700 truncate max-w-[110px]">{row.student_name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-500">{row.class_name}</td>
                    <td className="py-2 px-3 text-gray-700 font-medium truncate max-w-[100px]">{row.exam_name}</td>
                    <td className="py-2 px-3 text-gray-600 truncate max-w-[90px]">
                      {row.subject_name}
                      {row.subject_code && <span className="text-[9px] text-gray-400 ml-1">({row.subject_code})</span>}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="font-black text-gray-800">{row.marks_obtained}</span>
                      <span className="text-[9px] text-gray-400">/{row.total_marks}</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`font-bold ${(row.percentage ?? 0) >= 33 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(row.percentage ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center"><GradeBadge grade={row.grade} /></td>
                    <td className="py-2 px-3 text-center"><StatusBadge status={row.status} /></td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-center gap-0.5">
                        {!row.deleted_at ? (
                          <>
                            <button onClick={() => setDetailRow(row)} title="View Detail"
                              className="p-1 rounded hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {!isVerified ? (
                              <button onClick={() => rowVerify(row.id)} title="Verify & Lock"
                                className="p-1 rounded hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 transition">
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button onClick={() => rowRevert(row.id)} title="Revert to Draft"
                                className="p-1 rounded hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition">
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => rowTrash(row.id)} title="Trash"
                              className="p-1 rounded hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => rowRestore(row.id)} title="Restore"
                              className="p-1 rounded hover:bg-sky-50 text-sky-500 hover:text-sky-700 transition">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => rowForce(row.id)} title="Force Delete"
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
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
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
          <span className="text-[10px] text-gray-500 font-semibold">
            Page {currentPage} of {totalPages} &middot; {sorted.length} total
          </span>
          <div className="flex items-center gap-1">
            {[
              { label: '\u00ab', fn: () => setCurrentPage(1),              dis: currentPage === 1         },
              { label: <ChevronLeft  className="w-3 h-3" />, fn: () => setCurrentPage(p => Math.max(1, p-1)),          dis: currentPage === 1         },
            ].map((b, i) => (
              <button key={i} onClick={b.fn} disabled={b.dis}
                className="px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 text-gray-600 transition text-[10px] font-bold">
                {b.label}
              </button>
            ))}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (page > totalPages) return null;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`px-2 py-0.5 rounded border text-[10px] font-bold transition
                    ${page === currentPage ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}>
                  {page}
                </button>
              );
            })}
            {[
              { label: <ChevronRight className="w-3 h-3" />, fn: () => setCurrentPage(p => Math.min(totalPages, p+1)), dis: currentPage === totalPages },
              { label: '\u00bb', fn: () => setCurrentPage(totalPages),     dis: currentPage === totalPages },
            ].map((b, i) => (
              <button key={i} onClick={b.fn} disabled={b.dis}
                className="px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 text-gray-600 transition text-[10px] font-bold">
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDetailRow(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Record Detail</h3>
                <p className="text-[11px] text-indigo-200">{detailRow.student_name} &middot; {detailRow.admission_no}</p>
              </div>
              <button onClick={() => setDetailRow(null)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-[12px]">
              {([
                ['Examination',  detailRow.exam_name],
                ['Class',        detailRow.class_name],
                ['Subject',      `${detailRow.subject_name}${detailRow.subject_code ? ` (${detailRow.subject_code})` : ''}`],
                ['Score',        `${detailRow.marks_obtained} / ${detailRow.total_marks}`],
                ['Percentage',   `${(detailRow.percentage ?? 0).toFixed(1)}%`],
                ['Grade',        detailRow.grade || '\u2014'],
                ['Status',       detailRow.status],
                ['Remarks',      detailRow.remarks || '\u2014'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-400 font-semibold w-28 flex-shrink-0">{k}</span>
                  <span className="text-gray-800 font-bold text-right break-all">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              {detailRow.status === 'Draft' ? (
                <button onClick={() => { rowVerify(detailRow.id); setDetailRow(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold transition">
                  <Lock className="w-3.5 h-3.5" /> Verify &amp; Lock
                </button>
              ) : (
                <button onClick={() => { rowRevert(detailRow.id); setDetailRow(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[12px] font-bold transition">
                  <Unlock className="w-3.5 h-3.5" /> Revert to Draft
                </button>
              )}
              <button onClick={() => { rowTrash(detailRow.id); setDetailRow(null); }}
                className="py-2 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[12px] font-bold border border-rose-200 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setDetailRow(null)}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[12px] font-bold transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Report Dialog */}
      {importReport?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setImportReport(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Import Report
              </h3>
              <button onClick={() => setImportReport(null)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <div><p className="text-[9px] text-emerald-600 font-bold uppercase">Imported</p>
                    <p className="text-lg font-black text-emerald-700">{importReport.imported}</p></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <div><p className="text-[9px] text-rose-600 font-bold uppercase">Failed</p>
                    <p className="text-lg font-black text-rose-700">{importReport.failed}</p></div>
                </div>
              </div>
              {Object.keys(importReport.errors).length > 0 && (
                <div className="max-h-56 overflow-y-auto space-y-1.5">
                  {Object.entries(importReport.errors).map(([row, errs]) => (
                    <div key={row} className="text-[11px] bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5">
                      <span className="font-bold text-rose-600 mr-2">Row {row}:</span>
                      <span className="text-rose-500">{(errs as string[]).join(' \u00b7 ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setImportReport(null)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[12px] font-bold transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
