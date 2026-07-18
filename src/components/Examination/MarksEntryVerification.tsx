import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLocation } from 'react-router-dom';
import {
  ShieldCheck, Lock, Edit3, Save, Search, Trash2,
  X, RefreshCw, CheckSquare, ChevronLeft, ChevronRight,
  Archive, RotateCcw, AlertCircle, Loader2, Award, ClipboardCheck,
  CheckCircle, AlertTriangle, Download, Upload, Unlock
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────── */
interface MarkRecord {
  id?: number;
  exam_id: number;
  exam_name?: string;
  student_id: number;
  student_name: string;
  admission_no: string;
  class_name?: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  marks_obtained: string | number;
  total_marks: number;
  percentage?: number;
  grade?: string;
  status: 'Draft' | 'Verified';
  remarks?: string;
  deleted_at?: string;
}

interface Stats {
  total_exams: number;
  active_exams: number;
  upcoming_exams: number;
  total_marks: number;
  passed_marks: number;
  failed_marks: number;
  trashed_marks: number;
  avg_percentage: number;
  pass_rate: number;
}

interface DropdownOption {
  value: string;
  label: string;
  max_marks?: number;
}

/* ─────────────────────────────────────────────────────────────
   TOGGLE SWITCH COMPONENT
   ───────────────────────────────────────────────────────────── */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
}> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
      ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

/* ─────────────────────────────────────────────────────────────
   REACT-SELECT STYLES & PORTAL WRAPPER
   ───────────────────────────────────────────────────────────── */
const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#6366f1' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(99,102,241,0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#fff',
    '&:hover': { borderColor: state.isFocused ? '#6366f1' : '#d1d5db' },
  }),
  valueContainer: (base: any) => ({ ...base, padding: '0 8px', height: '28px', display: 'flex', alignItems: 'center' }),
  input: (base: any) => ({ ...base, margin: '0', padding: '0', fontSize: '11px' }),
  placeholder: (base: any) => ({ ...base, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (base: any) => ({ ...base, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (base: any) => ({ ...base, height: '26px' }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#f3f4f6' : 'transparent',
    color: state.isSelected ? '#fff' : '#374151',
    fontSize: '11px',
    padding: '6px 8px',
    cursor: 'pointer',
  }),
  menu: (base: any) => ({ ...base, borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 99999 }),
  menuPortal: (base: any) => ({ ...base, zIndex: 99999 }),
  clearIndicator: (base: any) => ({ ...base, padding: '2px' }),
  dropdownIndicator: (base: any) => ({ ...base, padding: '2px' }),
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
   STATS CARD
   ───────────────────────────────────────────────────────────── */
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${bg} min-w-0`}>
    <div className={`p-1.5 rounded-md ${color} flex-shrink-0 text-white`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-lg font-bold text-gray-800 leading-tight truncate">
        {value}
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SORTABLE COLUMN HEADER
   ───────────────────────────────────────────────────────────── */
const SortTh: React.FC<{
  field: string;
  label: string;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (f: string) => void;
  className?: string;
}> = ({ field, label, sortField, sortDir, onSort, className = '' }) => {
  const active = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors select-none ${className}`}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="text-gray-400 font-normal">
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </div>
    </th>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN REGISTRY MODULE
   ───────────────────────────────────────────────────────────── */
export default function MarksEntryVerification() {
  const location = useLocation();
  const isVerification = location.pathname.includes('verification');

  /* ── State variables ── */
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total_exams: 0,
    active_exams: 0,
    upcoming_exams: 0,
    total_marks: 0,
    passed_marks: 0,
    failed_marks: 0,
    trashed_marks: 0,
    avg_percentage: 0,
    pass_rate: 0,
  });

  /* ── Master Options arrays ── */
  const [examinations, setExaminations] = useState<DropdownOption[]>([]);
  const [classes, setClasses] = useState<DropdownOption[]>([]);
  const [academicYears, setAcademicYears] = useState<DropdownOption[]>([]);
  const [subjects, setSubjects] = useState<DropdownOption[]>([]);
  const [grades, setGrades] = useState<string[]>([]);

  /* ── Filter select parameters ── */
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── Selection rows mapping ── */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  /* ── Entry Registry state ── */
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarks, setEditedMarks] = useState<MarkRecord[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);

  /* ── Excel Uploader tooling ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<{
    open: boolean;
    imported: number;
    failed: number;
    errors: Record<number, string[]>;
  } | null>(null);

  /* ── Pagination parameters ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ── Sorting parameters ── */
  const [sortField, setSortField] = useState('student_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* ════════════════ FETCH STATS & MASTERS ════════════════ */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/student-exams/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch { /* Silent fail */ }
  }, []);

  const fetchMasters = useCallback(async () => {
    try {
      const [mastRes, examRes] = await Promise.all([
        api.get('/student-exams/masters'),
        api.get('/student-exams/exams', { params: { is_active: '1' } }),
      ]);

      if (mastRes.data.success) {
        const { academicYears, classes, grades } = mastRes.data.data;
        setAcademicYears((academicYears || []).map((y: any) => ({ value: String(y.value), label: y.label })));
        setClasses((classes || []).map((c: any) => ({ value: String(c.value), label: c.label })));
        setGrades(grades || []);
      }

      if (examRes.data.success) {
        const examOpts = (examRes.data.data || []).map((e: any) => ({
          value: String(e.id),
          label: `${e.class_name} - ${e.name}`,
        }));
        setExaminations(examOpts);
      }
    } catch {
      toast.error('Failed to load master metadata');
    }
  }, []);

  /* ── Load subjects on Class select change ── */
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }
    const loadSubjects = async () => {
      try {
        const res = await api.get(`/student-exams/subjects/by-class/${selectedClass}`);
        if (res.data.success) {
          setSubjects((res.data.data || []).map((s: any) => ({ value: String(s.value), label: s.label, max_marks: s.max_marks })));
        }
      } catch {
        toast.error('Failed to load class subjects');
      }
    };
    loadSubjects();
  }, [selectedClass]);

  /* ════════════════ LIST FETCHING ════════════════ */
  const fetchMarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/student-exams/marks', {
        params: {
          trashed: showTrashed ? '1' : '0',
          academic_year_id: selectedYear || undefined,
          exam_id: selectedExam || undefined,
          subject_id: selectedSubject || undefined,
          grade: filterGrade || undefined,
          status: filterStatus || undefined,
        },
      });
      if (res.data.success) {
        setMarks(res.data.data || []);
      }
    } catch {
      toast.error('Failed to fetch marks records');
    }
    setLoading(false);
  }, [showTrashed, selectedExam, selectedSubject, filterGrade, filterStatus]);

  useEffect(() => {
    fetchMasters();
    fetchStats();
  }, [fetchMasters, fetchStats]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks, selectedYear]);

  /* ════════════════ START MARKS BATCH ENTRY ════════════════ */
  const handleStartEditing = async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) {
      toast.error('Please select Examination, Class, and Subject first to enter marks.');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch existing marks for this exam/subject
      const existingRes = await api.get('/student-exams/marks', {
        params: { exam_id: selectedExam, subject_id: selectedSubject },
      });
      const existingList: MarkRecord[] = existingRes.data.success ? existingRes.data.data : [];

      // 2. Fetch all student records enrolled in this class
      const studentRes = await api.get('/student-exams/students/search', {
        params: { class_id: selectedClass },
      });
      const studentList = studentRes.data.success ? studentRes.data.data : [];

      if (studentList.length === 0) {
        toast.error('No students found registered under the selected class.');
        setLoading(false);
        return;
      }

      // Find selected subject's max marks (default 100)
      const subObj = subjects.find(s => s.value === selectedSubject);
      const maxMarks = subObj?.max_marks || 100;

      // 3. Map students to edit rows
      const entries: MarkRecord[] = studentList.map((stu: any) => {
        const match = existingList.find(m => m.student_id === stu.value);
        return {
          id: match?.id,
          exam_id: Number(selectedExam),
          student_id: stu.value,
          student_name: stu.name,
          admission_no: stu.admission_number,
          subject_id: Number(selectedSubject),
          marks_obtained: match ? String(match.marks_obtained) : '',
          total_marks: maxMarks,
          status: match ? match.status : 'Draft',
          remarks: match ? match.remarks || '' : '',
        };
      });

      setEditedMarks(entries);
      setIsEditing(true);
    } catch {
      toast.error('Failed to load marks entry sheet');
    }
    setLoading(false);
  };

  /* ── Form value modification cell change ── */
  const handleScoreChange = (stuId: number, val: string) => {
    // Allows decimal scores
    const clean = val.replace(/[^0-9.]/g, '');
    setEditedMarks(prev =>
      prev.map(row => {
        if (row.student_id === stuId) {
          return { ...row, marks_obtained: clean };
        }
        return row;
      })
    );
  };

  const handleRemarkChange = (stuId: number, val: string) => {
    setEditedMarks(prev =>
      prev.map(row => {
        if (row.student_id === stuId) {
          return { ...row, remarks: val };
        }
        return row;
      })
    );
  };

  /* ════════════════ SAVE BATCH ENTRY DRAFT ════════════════ */
  const handleSaveDraft = async () => {
    // Validation: check that obtained scores do not exceed total marks
    const invalidRow = editedMarks.find(
      r => r.marks_obtained !== '' && Number(r.marks_obtained) > r.total_marks
    );

    if (invalidRow) {
      toast.error(
        `Obtained score (${invalidRow.marks_obtained}) for ${invalidRow.student_name} exceeds paper maximum marks limit (${invalidRow.total_marks}).`
      );
      return;
    }

    setSavingDraft(true);
    try {
      // Map payload: drop blank scores
      const marksPayload = editedMarks
        .filter(r => r.marks_obtained !== '')
        .map(r => ({
          student_id: r.student_id,
          subject_id: r.subject_id,
          marks_obtained: Number(r.marks_obtained),
          remarks: r.remarks || null,
        }));

      if (marksPayload.length === 0) {
        toast.error('No marks entered to save.');
        setSavingDraft(false);
        return;
      }

      const res = await api.post('/student-exams/marks/bulk-save', {
        exam_id: selectedExam,
        marks: marksPayload,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Marks saved successfully');
        setIsEditing(false);
        fetchMarks();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save marks registry dataset');
    }
    setSavingDraft(false);
  };

  /* ════════════════ SINGLE LOCK / TOGGLE STATUS ════════════════ */
  const handleVerifyLock = async (id: number) => {
    try {
      const res = await api.post('/student-exams/marks/bulk-status', {
        ids: [id],
        status: 'Verified',
      });
      if (res.data.success) {
        toast.success('Marks locked and verified successfully');
        fetchMarks();
        fetchStats();
      }
    } catch {
      toast.error('Verification failed');
    }
  };

  /* ════════════════ BULK TRANSITIONS & RESTORATIONS ════════════════ */
  const handleBulkStatusChange = async (newStatus: 'Draft' | 'Verified') => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    try {
      await api.post('/student-exams/marks/bulk-status', {
        ids: selectedIds,
        status: newStatus,
      });
      toast.success(`${selectedIds.length} marks record(s) marked as ${newStatus}`);
      setSelectedIds([]);
      fetchMarks();
      fetchStats();
    } catch {
      toast.error('Failed to complete status update transition');
    }
    setBulkUpdating(false);
  };

  const handleBulkDelete = async (force = false) => {
    if (selectedIds.length === 0) return;
    const msg = force
      ? `Permanently delete ${selectedIds.length} mark record(s)? This action is irreversible.`
      : `Move ${selectedIds.length} mark record(s) to trash?`;
    if (!window.confirm(msg)) return;

    setBulkUpdating(true);
    try {
      await api.post('/student-exams/marks/bulk-delete', {
        ids: selectedIds,
        force,
      });
      toast.success(force ? 'Records permanently deleted' : 'Moved to trash');
      setSelectedIds([]);
      fetchMarks();
      fetchStats();
    } catch {
      toast.error('Bulk deletion failed');
    }
    setBulkUpdating(false);
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    try {
      await api.post('/student-exams/marks/bulk-restore', { ids: selectedIds });
      toast.success(`${selectedIds.length} marks record(s) restored successfully`);
      setSelectedIds([]);
      fetchMarks();
      fetchStats();
    } catch {
      toast.error('Bulk restoration failed');
    }
    setBulkUpdating(false);
  };

  const handleSingleRestore = async (id: number) => {
    try {
      const res = await api.post(`/student-exams/marks/${id}/restore`);
      if (res.data.success) {
        toast.success('Record restored');
        fetchMarks();
        fetchStats();
      }
    } catch {
      toast.error('Failed to restore record');
    }
  };

  const handleSingleForceDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this mark record?')) return;
    try {
      const res = await api.delete(`/student-exams/marks/${id}/force`);
      if (res.data.success) {
        toast.success('Record deleted permanently');
        fetchMarks();
        fetchStats();
      }
    } catch {
      toast.error('Deletion failed');
    }
  };

  /* ════════════════ CSV TEMPLATES AND DATA EXPORT ════════════════ */
  const handleExportCSV = () => {
    const token = localStorage.getItem('token') || '';
    const examParam = selectedExam ? `&exam_id=${selectedExam}` : '';
    const exportUrl = `${api.defaults.baseURL}/student-exams/marks/export?token=${token}${examParam}`;
    window.open(exportUrl, '_blank');
    toast.success('Downloading marks export CSV');
  };

  const handleDownloadSample = () => {
    const sampleUrl = `${api.defaults.baseURL}/student-exams/marks/sample`;
    window.open(sampleUrl, '_blank');
    toast.success('Downloading import sample template');
  };

  /* ── Excel File Reader Parsing ── */
  const parseCSV = (text: string) => {
    const result = [];
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row: string[] = [];
      let insideQuote = false;
      let entries = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(entries.trim().replace(/^["']|["']$/g, ''));
          entries = '';
        } else {
          entries += char;
        }
      }
      row.push(entries.trim().replace(/^["']|["']$/g, ''));

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      result.push(obj);
    }
    return result;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          toast.error('The selected CSV file is empty or invalid.');
          return;
        }

        const res = await api.post('/student-exams/marks/bulk-import', { data: parsed });
        if (res.data.success) {
          toast.success(res.data.message || 'Bulk import complete');
          fetchMarks();
          fetchStats();

          if (res.data.error_count > 0) {
            setImportReport({
              open: true,
              imported: res.data.imported_count,
              failed: res.data.error_count,
              errors: res.data.errors,
            });
          }
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to import CSV dataset');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ════════════════ FILTERS, SEARCH & SORTING ════════════════ */
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const clearFilters = () => {
    setSelectedYear('');
    setSelectedClass('');
    setSelectedExam('');
    setSelectedSubject('');
    setFilterGrade('');
    setFilterStatus('');
    setSearchTerm('');
  };

  const hasFilters = selectedYear || selectedClass || selectedExam || selectedSubject || filterGrade || filterStatus || searchTerm;

  const filtered = useMemo(() => {
    return marks.filter(item => {
      const name = (item.student_name || '').toLowerCase();
      const adm = (item.admission_no || '').toLowerCase();
      const s = searchTerm.toLowerCase();
      const matchSearch = name.includes(s) || adm.includes(s);

      return matchSearch;
    });
  }, [marks, searchTerm]);

  const sorted = useMemo(() => {
    const data = [...filtered];
    data.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filtered, sortField, sortDir]);

  /* ── Selection rows list helpers ── */
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = pagedItems.map(m => m.id).filter(id => id !== undefined) as number[];
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = pagedItems.map(m => m.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleRowSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /* ── Pagination helpers ── */
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const pagedItems = useMemo(() => {
    if (itemsPerPage === -1) return sorted;
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  const isAllSelected = pagedItems.length > 0 && pagedItems.every(m => m.id && selectedIds.includes(m.id));

  /* ════════════════ RENDER JSX ════════════════ */
  return (
    <div className="p-4 space-y-3 text-xs">

      {/* ── Hidden file uploader ── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {isVerification ? 'Marks Verification & Audit' : 'Marks Entry Registry'}
            </h1>
            <p className="text-[10px] text-gray-500">
              {isVerification
                ? 'Audit and lock student examination marks. Verified marks are frozen and cannot be modified.'
                : 'Record obtained student marks, compute percentages and grades, and update student performance registry.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { fetchMarks(); fetchStats(); }}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-650 hover:bg-indigo-50 rounded transition"
          title="Refresh dataset"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold">Refresh</span>
        </button>
      </div>

      {/* ── KPI Metrics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard
          label="Total Marks Records"
          value={stats.total_marks}
          icon={<ClipboardCheck className="w-3.5 h-3.5 text-white" />}
          color="bg-indigo-500"
          bg="bg-indigo-50 border-indigo-100"
        />
        <StatCard
          label="Passed Records"
          value={stats.passed_marks}
          icon={<CheckCircle className="w-3.5 h-3.5 text-white" />}
          color="bg-green-500"
          bg="bg-green-50 border-green-100"
        />
        <StatCard
          label="Failed Records"
          value={stats.failed_marks}
          icon={<AlertCircle className="w-3.5 h-3.5 text-white" />}
          color="bg-rose-500"
          bg="bg-rose-50 border-rose-100"
        />
        <StatCard
          label="Average score"
          value={`${stats.avg_percentage}%`}
          icon={<Award className="w-3.5 h-3.5 text-white" />}
          color="bg-amber-500"
          bg="bg-amber-50 border-amber-100"
        />
        <StatCard
          label="Overall Pass Rate"
          value={`${stats.pass_rate}%`}
          icon={<CheckSquare className="w-3.5 h-3.5 text-white" />}
          color="bg-teal-500"
          bg="bg-teal-50 border-teal-100"
        />
        <StatCard
          label="Trashed Records"
          value={stats.trashed_marks}
          icon={<Archive className="w-3.5 h-3.5 text-white" />}
          color="bg-slate-500"
          bg="bg-slate-50 border-slate-100"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name/admission no..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white h-7 w-52 font-medium"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Page size select */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-7">
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>

          {/* Trashed toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-2 py-0.5 h-7">
            <Archive className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 font-semibold">Trashed</span>
            <ToggleSwitch
              checked={showTrashed}
              onChange={() => { setShowTrashed(v => !v); setCurrentPage(1); setSelectedIds([]); }}
            />
          </div>

          {/* Select all checkbox */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-2.5 py-0.5 h-7">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[10px] text-gray-500 font-semibold select-none">Select All</span>
          </div>
        </div>

        {/* Excel import/export toolbar buttons */}
        {!isEditing && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
              title="Download CSV Import Schema Template"
            >
              <Download className="w-3.5 h-3.5" />
              Sample
            </button>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
              title="Import Marks CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
              title="Export Marks to CSV"
            >
              <Download className="w-3.5 h-3.5 text-green-600" />
              Export
            </button>

            {!isVerification ? (
              <button
                onClick={handleStartEditing}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-[11px] font-bold h-7 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Enter Marks Sheet
              </button>
            ) : (
              <button
                onClick={() => handleBulkStatusChange('Verified')}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-[11px] font-bold h-7 shadow-sm disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Lock & Verify Selected
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Filters row ── */}
      {!isEditing && (
        <div className="flex flex-wrap items-center gap-2 bg-white px-2.5 py-2 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
          </div>
          <SSelect options={academicYears} value={selectedYear} onChange={v => { setSelectedYear(v); setCurrentPage(1); }} placeholder="Select Year" className="w-32" />
          <SSelect options={classes} value={selectedClass} onChange={v => { setSelectedClass(v); setCurrentPage(1); }} placeholder="Select Class" className="w-32" />
          <SSelect options={subjects} value={selectedSubject} onChange={v => { setSelectedSubject(v); setCurrentPage(1); }} placeholder="Select Subject" className="w-44" />
          <SSelect options={examinations} value={selectedExam} onChange={v => { setSelectedExam(v); setCurrentPage(1); }} placeholder="Select Examination" className="w-48" />
          <SSelect options={grades.map(g => ({ value: g, label: `Grade ${g}` }))} value={filterGrade} onChange={v => { setFilterGrade(v); setCurrentPage(1); }} placeholder="Filter Grade" className="w-28" />
          <SSelect
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Verified', label: 'Verified (Locked)' },
            ]}
            value={filterStatus}
            onChange={v => { setFilterStatus(v); setCurrentPage(1); }}
            placeholder="Filter Status"
            className="w-32"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-0.5 text-[11px] text-red-500 hover:text-red-700 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}

          <span className="ml-auto text-[10px] text-gray-400 font-bold">
            {sorted.length} record{sorted.length !== 1 ? 's' : ''} filtered
          </span>
        </div>
      )}

      {/* ── Bulk Actions Floating Bar ── */}
      {selectedIds.length > 0 && !isEditing && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg text-indigo-800 shadow-sm animate-fade-in flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              {selectedIds.length} Selected
            </span>
            <span className="text-[10.5px] font-semibold">Bulk actions available for selected rows:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatusChange('Verified')}
                  disabled={bulkUpdating}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold shadow-xs transition"
                >
                  <Lock className="w-3 h-3" /> Lock (Verify)
                </button>
                <button
                  onClick={() => handleBulkStatusChange('Draft')}
                  disabled={bulkUpdating}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold shadow-xs transition"
                >
                  <Unlock className="w-3 h-3" /> Unlock (Draft)
                </button>
                <button
                  onClick={() => handleBulkDelete(false)}
                  disabled={bulkUpdating}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 text-white hover:bg-rose-700 rounded text-[10px] font-bold shadow-xs transition"
                >
                  <Trash2 className="w-3 h-3" /> Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkUpdating}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white border-green-300 text-green-700 hover:bg-green-100 rounded text-[10px] font-bold shadow-xs transition"
                >
                  <RotateCcw className="w-3 h-3" /> Restore Records
                </button>
                <button
                  onClick={() => handleBulkDelete(true)}
                  disabled={bulkUpdating}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white hover:bg-red-700 rounded text-[10px] font-bold shadow-xs transition"
                >
                  <Trash2 className="w-3 h-3" /> Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Batch Marks Entry Sheet Form Grid ── */}
      {isEditing && (
        <div className="bg-white border border-indigo-200 rounded-lg shadow p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-150 pb-3 flex-shrink-0">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                ✍️ Batch Marks Entry Matrix
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Class: {classes.find(c => c.value === selectedClass)?.label} |
                Subject: {subjects.find(s => s.value === selectedSubject)?.label} |
                Paper Maximum Marks: {editedMarks[0]?.total_marks}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="flex items-center gap-1 px-4 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition disabled:opacity-50"
              >
                {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Draft
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase">
                  <th className="py-2.5 px-3.5">Admission No.</th>
                  <th className="py-2.5 px-3.5">Student Candidate</th>
                  <th className="py-2.5 px-3.5 text-center w-40">Obtained Score (Max: {editedMarks[0]?.total_marks})</th>
                  <th className="py-2.5 px-3.5">Remarks / Observation Notes</th>
                  <th className="py-2.5 px-3.5 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-[11px] font-semibold text-gray-700">
                {editedMarks.map(row => (
                  <tr key={row.student_id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3.5 font-mono text-gray-500">{row.admission_no}</td>
                    <td className="py-2 px-3.5 text-gray-900 font-bold">{row.student_name}</td>
                    <td className="py-2 px-3.5 text-center">
                      <input
                        type="text"
                        placeholder="e.g. 74.50"
                        value={row.marks_obtained}
                        onChange={e => handleScoreChange(row.student_id, e.target.value)}
                        disabled={row.status === 'Verified'}
                        className="w-24 text-center py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </td>
                    <td className="py-2 px-3.5">
                      <input
                        type="text"
                        placeholder="Write remarks..."
                        value={row.remarks}
                        onChange={e => handleRemarkChange(row.student_id, e.target.value)}
                        disabled={row.status === 'Verified'}
                        className="w-full py-1 px-2 rounded border border-gray-300 focus:outline-none text-[10.5px] disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </td>
                    <td className="py-2 px-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold ${row.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Table Sheet ── */}
      {!isEditing && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <SortTh field="admission_no" label="Admission No" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="student_name" label="Student Name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="class_name" label="Class" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="exam_name" label="Examination" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="subject_name" label="Subject" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="marks_obtained" label="Score" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center" />
                  <SortTh field="percentage" label="Percentage" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center" />
                  <SortTh field="grade" label="Grade" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center" />
                  <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-[11px] font-semibold text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-1 text-indigo-600 font-bold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading registry marks...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Award className="w-8 h-8 text-gray-300" />
                        <p className="font-bold text-gray-500">No marks records found.</p>
                        <p className="text-[10px] text-gray-400">Select filters or click "Enter Marks Sheet" to start recording scores.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedItems.map(item => {
                    const isRowSelected = item.id ? selectedIds.includes(item.id) : false;
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/50 ${isRowSelected ? 'bg-indigo-50/20' : ''}`}>
                        <td className="py-2 px-3.5 text-center">
                          {item.id && (
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() => handleRowSelect(item.id!)}
                              className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="py-2 px-3.5 font-mono text-gray-500">{item.admission_no}</td>
                        <td className="py-2 px-3.5 font-bold text-gray-900">{item.student_name}</td>
                        <td className="py-2 px-3.5">{item.class_name}</td>
                        <td className="py-2 px-3.5">{item.exam_name}</td>
                        <td className="py-2 px-3.5">
                          <span className="font-mono text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-[9.5px] mr-1">
                            {item.subject_code}
                          </span>
                          {item.subject_name}
                        </td>
                        <td className="py-2 px-3.5 text-center font-bold text-gray-800">
                          {item.marks_obtained} <span className="text-gray-450 font-normal">/ {item.total_marks}</span>
                        </td>
                        <td className="py-2 px-3.5 text-center text-gray-600">{item.percentage}%</td>
                        <td className="py-2 px-3.5 text-center font-bold text-slate-800">
                          <span className={`inline-block px-1.5 py-0.5 rounded font-mono text-[10px] ${item.grade === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                            {item.grade}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-500 max-w-[150px] truncate" title={item.remarks}>
                          {item.remarks || '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${item.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            {item.status === 'Verified' ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {!showTrashed ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {isVerification && item.status === 'Draft' && (
                                <button
                                  onClick={() => handleVerifyLock(item.id!)}
                                  className="flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[9.5px] shadow-xs"
                                  title="Verify and Lock Record"
                                >
                                  <Lock className="w-2.5 h-2.5" /> Verify
                                </button>
                              )}
                              {item.status === 'Draft' && (
                                <button
                                  onClick={() => {
                                    // Set parameters and launch editing mode
                                    setSelectedExam(String(item.exam_id));
                                    setSelectedSubject(String(item.subject_id));
                                    // Resolves corresponding class from examinations dropdown
                                    const ex = examinations.find(e => e.value === String(item.exam_id));
                                    if (ex) {
                                      // Mapped class label format is "Class X - A - Quarterly Exam"
                                      // Let's resolve class options
                                      const clName = ex.label.split(' - ')[0];
                                      const matchedCl = classes.find(c => c.label.toLowerCase().includes(clName.toLowerCase()));
                                      if (matchedCl) {
                                        setSelectedClass(matchedCl.value);
                                      }
                                    }
                                    handleStartEditing();
                                  }}
                                  className="p-1 text-gray-500 hover:text-indigo-655 hover:bg-gray-100 rounded"
                                  title="Edit marks sheet"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Move this marks record to trash?')) return;
                                  try {
                                    await api.delete(`/student-exams/marks/${item.id}`);
                                    toast.success('Moved to trash');
                                    fetchMarks();
                                    fetchStats();
                                  } catch { toast.error('Trashing failed'); }
                                }}
                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSingleRestore(item.id!)}
                                className="flex items-center gap-0.5 px-2 py-0.5 bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 rounded font-bold text-[9.5px]"
                                title="Restore mark record"
                              >
                                <RotateCcw className="w-2.5 h-2.5" /> Restore
                              </button>
                              <button
                                onClick={() => handleSingleForceDelete(item.id!)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table pagination row ── */}
          {totalPages > 1 && !isEditing && (
            <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50 flex-shrink-0">
              <span className="text-[10px] text-gray-500 font-semibold">
                Showing page {currentPage} of {totalPages} ({sorted.length} records total)
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 text-gray-500 hover:text-indigo-650 disabled:opacity-40 disabled:hover:text-gray-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 text-gray-500 hover:text-indigo-650 disabled:opacity-40 disabled:hover:text-gray-500"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk Import Report Details Dialog ── */}
      {importReport?.open && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[100000] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-150">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex-shrink-0 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold">Marks Bulk Import Execution Report</h3>
              </div>
              <button
                onClick={() => setImportReport(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-gray-700">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-lg">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1">Uploaded</span>
                  <span className="text-lg font-bold text-gray-800">{importReport.imported + importReport.failed}</span>
                </div>
                <div className="p-3.5 bg-green-50 border border-green-150 rounded-lg">
                  <span className="text-[10px] text-green-600 font-bold block uppercase mb-1">Imported</span>
                  <span className="text-lg font-bold text-green-700">{importReport.imported}</span>
                </div>
                <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-lg">
                  <span className="text-[10px] text-rose-600 font-bold block uppercase mb-1">Failed Rows</span>
                  <span className="text-lg font-bold text-rose-700">{importReport.failed}</span>
                </div>
              </div>

              {Object.keys(importReport.errors).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Row Errors List</h4>
                  <div className="border border-gray-200 rounded divide-y divide-gray-150 max-h-56 overflow-y-auto font-mono text-[10.5px]">
                    {Object.entries(importReport.errors).map(([row, errList]) => (
                      <div key={row} className="p-2.5 bg-gray-50 flex items-start gap-2.5">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[9px]">Row {row}</span>
                        <div className="flex-1 text-gray-650 leading-relaxed font-semibold">
                          {errList.map((err, idx) => <p key={idx}>{err}</p>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-3 flex justify-end bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setImportReport(null)}
                className="px-4 py-1.5 bg-indigo-650 text-white rounded text-xs font-bold hover:bg-indigo-700 transition"
              >
                Acknowledge report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
