import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Select from 'react-select';
import {
  ClipboardList, Plus, Search, Edit3, Trash2, RotateCcw,
  Upload, Download, FileSpreadsheet, Loader2, AlertCircle,
  CheckSquare, ChevronUp, ChevronDown, BookOpen, Calendar,
  BarChart3, Activity, Archive, TrendingUp, X, Filter,
  Eye, EyeOff, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface Examination {
  id: number;
  school_id?: number;
  academic_year_id: number;
  academic_year_label: string;
  class_id: number;
  class_name: string;
  name: string;
  exam_type: number;
  exam_type_label: string;
  term: number;
  term_label: string;
  start_date: string;
  end_date: string;
  max_marks: number;
  passing_marks: number;
  is_active: boolean;
  deleted_at?: string | null;
  created_at?: string;
  description?: string;
}

interface ExamTypeOption {
  id: number;
  name: string;
  is_active: boolean;
}

interface MasterOption {
  value: string;
  label: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  trashed: number;
  thisMonth: number;
}

const TERM_OPTIONS: MasterOption[] = [
  { value: '1', label: 'First Term' },
  { value: '2', label: 'Second Term' },
  { value: '3', label: 'Third Term' },
  { value: '4', label: 'Final Term' },
];

/* ─────────────────────────────────────────────────────────────
   TOGGLE SWITCH
───────────────────────────────────────────────────────────── */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange()}
    disabled={disabled}
    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1
      ${checked ? 'bg-green-500' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-4.5' : 'translate-x-1'}`}
    />
  </button>
);

/* ─────────────────────────────────────────────────────────────
   REACT-SELECT STYLES
───────────────────────────────────────────────────────────── */
const selectStyles = {
  control: (b: any, s: any) => ({
    ...b,
    borderRadius: '0.375rem',
    borderColor: s.isFocused ? '#6366f1' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(99,102,241,0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#fff',
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
    color: s.isSelected ? '#fff' : '#374151',
    fontSize: '11px',
    padding: '6px 8px',
    cursor: 'pointer',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 9999 }),
  clearIndicator: (b: any) => ({ ...b, padding: '2px' }),
  dropdownIndicator: (b: any) => ({ ...b, padding: '2px' }),
};

/* ─────────────────────────────────────────────────────────────
   SEARCHABLE SELECT WRAPPER
───────────────────────────────────────────────────────────── */
const SSelect: React.FC<{
  options: MasterOption[];
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
        onChange={opt => onChange((opt as MasterOption)?.value || '')}
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
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${bg} min-w-0`}>
    <div className={`p-1.5 rounded-md ${color} flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SORT HEADER
───────────────────────────────────────────────────────────── */
const SortTh: React.FC<{
  field: string;
  label: string;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (f: string) => void;
  className?: string;
}> = ({ field, label, sortField, sortDir, onSort, className = '' }) => (
  <th
    className={`py-2 px-2.5 cursor-pointer hover:bg-indigo-50 transition select-none ${className}`}
    onClick={() => onSort(field)}
  >
    <span className="flex items-center gap-0.5">
      {label}
      {sortField === field
        ? sortDir === 'asc'
          ? <ChevronUp className="w-3 h-3 text-indigo-600 flex-shrink-0" />
          : <ChevronDown className="w-3 h-3 text-indigo-600 flex-shrink-0" />
        : <span className="text-gray-300 text-[10px]">↕</span>}
    </span>
  </th>
);

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────── */
const EmptyState: React.FC<{ trashed: boolean }> = ({ trashed }) => (
  <tr>
    <td colSpan={13} className="py-12 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-indigo-50 rounded-full">
          <ClipboardList className="w-7 h-7 text-indigo-400" />
        </div>
        <p className="text-sm font-semibold text-gray-600">
          {trashed ? 'No trashed examinations found' : 'No examinations found'}
        </p>
        <p className="text-xs text-gray-400">
          {trashed ? 'Items you delete will appear here.' : 'Click "Add New" to create your first examination.'}
        </p>
      </div>
    </td>
  </tr>
);

/* ─────────────────────────────────────────────────────────────
   EMPTY FORM
───────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  academic_year_id: '',
  class_id: '',
  name: '',
  exam_type: '',
  term: '',
  start_date: '',
  end_date: '',
  max_marks: '',
  passing_marks: '',
  description: '',
  is_active: true,
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function ExaminationManager() {
  const location = useLocation();

  /* ── data ── */
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, trashed: 0, thisMonth: 0 });

  /* ── master data ── */
  const [academicYears, setAcademicYears] = useState<MasterOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [examTypes, setExamTypes] = useState<MasterOption[]>([]);

  /* ── filters ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterExamType, setFilterExamType] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ── sorting ── */
  const [sortField, setSortField] = useState('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  /* ── selection ── */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  /* ── modal ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Examination | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formSaving, setFormSaving] = useState(false);

  /* ── import ── */
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  /* ════════════════ FETCH ALL DATA ════════════════ */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/school/examinations/stats');
      if (res.data.success) setStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  const fetchExaminations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/examinations', {
        params: { trashed: showTrashed ? '1' : '0' },
      });
      if (res.data.success) setExaminations(res.data.data || []);
    } catch {
      toast.error('Failed to load examinations');
    }
    setLoading(false);
  }, [showTrashed]);

  const fetchMasterData = useCallback(async () => {
    try {
      const [ayRes, clsRes, etRes] = await Promise.all([
        api.get('/school/academic-years'),
        api.get('/master/classes'),
        api.get('/school/exam-types', { params: { trashed: '0' } }),
      ]);

      if (ayRes.data.success) {
        const data = ayRes.data.data;
        const arr = Array.isArray(data)
          ? data.map((y: any) => ({ value: String(y.id), label: y.name }))
          : Object.entries(data).map(([id, name]) => ({ value: id, label: name as string }));
        setAcademicYears(arr);
      }

      if (clsRes.data.success) {
        const data = clsRes.data.data;
        const arr = Array.isArray(data)
          ? data.map((c: any) => ({ value: String(c.id || c.m_id), label: c.name || c.m_name }))
          : Object.entries(data).map(([id, name]) => ({ value: id, label: name as string }));
        setClasses(arr);
      }

      if (etRes.data.success) {
        const arr = (etRes.data.data || [])
          .filter((t: any) => t.is_active)
          .map((t: any) => ({ value: String(t.id), label: t.name }));
        setExamTypes(arr);
      }
    } catch {
      toast.error('Failed to load master data');
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchExaminations();
    fetchStats();
    setSelectedIds([]);
  }, [fetchExaminations, fetchStats]);

  /* ════════════════ FILTER & SORT ════════════════ */
  const filtered = useMemo(() => {
    let arr = [...examinations];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.class_name.toLowerCase().includes(q) ||
        e.academic_year_label.toLowerCase().includes(q) ||
        e.exam_type_label.toLowerCase().includes(q)
      );
    }
    if (filterAcademicYear) arr = arr.filter(e => String(e.academic_year_id) === filterAcademicYear);
    if (filterClass) arr = arr.filter(e => String(e.class_id) === filterClass);
    if (filterExamType) arr = arr.filter(e => String(e.exam_type) === filterExamType);
    if (filterTerm) arr = arr.filter(e => String(e.term) === filterTerm);
    if (filterStatus !== '') arr = arr.filter(e => e.is_active === (filterStatus === '1'));

    arr.sort((a: any, b: any) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return arr;
  }, [examinations, searchTerm, filterAcademicYear, filterClass, filterExamType, filterTerm, filterStatus, sortField, sortDir]);

  const totalPages = useMemo(() => itemsPerPage === -1 ? 1 : Math.ceil(filtered.length / itemsPerPage), [filtered, itemsPerPage]);

  const paginated = useMemo(() => {
    if (itemsPerPage === -1) return filtered;
    const s = (currentPage - 1) * itemsPerPage;
    return filtered.slice(s, s + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  /* ════════════════ SORT ════════════════ */
  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  /* ════════════════ SELECTION ════════════════ */
  const isAllSelected = paginated.length > 0 && paginated.every(r => selectedIds.includes(r.id));
  const handleSelectAll = () => isAllSelected ? setSelectedIds([]) : setSelectedIds(paginated.map(r => r.id));
  const handleSelectRow = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /* ════════════════ CLEAR FILTERS ════════════════ */
  const hasFilters = searchTerm || filterAcademicYear || filterClass || filterExamType || filterTerm || filterStatus;
  const clearFilters = () => {
    setSearchTerm('');
    setFilterAcademicYear('');
    setFilterClass('');
    setFilterExamType('');
    setFilterTerm('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  /* ════════════════ CRUD ════════════════ */
  const openAdd = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const openEdit = (item: Examination) => {
    setEditingItem(item);
    setFormData({
      academic_year_id: String(item.academic_year_id),
      class_id: String(item.class_id),
      name: item.name,
      exam_type: String(item.exam_type),
      term: String(item.term),
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      max_marks: String(item.max_marks),
      passing_marks: String(item.passing_marks),
      description: item.description || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.academic_year_id || !formData.class_id || !formData.name.trim() ||
      !formData.exam_type || !formData.term || !formData.start_date || !formData.end_date ||
      !formData.max_marks || !formData.passing_marks) {
      toast.error('Please fill all required fields');
      return;
    }
    setFormSaving(true);
    try {
      const payload = {
        academic_year_id: Number(formData.academic_year_id),
        class_id: Number(formData.class_id),
        name: formData.name.trim(),
        exam_type: Number(formData.exam_type),
        term: Number(formData.term),
        start_date: formData.start_date,
        end_date: formData.end_date,
        max_marks: Number(formData.max_marks),
        passing_marks: Number(formData.passing_marks),
        description: formData.description || null,
        is_active: formData.is_active,
      };

      if (editingItem) {
        await api.put(`/school/examinations/${editingItem.id}`, payload);
        toast.success('Examination updated successfully');
      } else {
        await api.post('/school/examinations', payload);
        toast.success('Examination created successfully');
      }
      setIsModalOpen(false);
      fetchExaminations();
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    }
    setFormSaving(false);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/school/examinations/${id}/toggle-status`);
      setExaminations(prev => prev.map(e => e.id === id ? { ...e, is_active: !e.is_active } : e));
      fetchStats();
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Move "${name}" to trash?`)) return;
    try {
      await api.delete(`/school/examinations/${id}`);
      toast.success('Moved to trash');
      fetchExaminations();
      fetchStats();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/examinations/${id}/restore`);
      toast.success('Examination restored');
      fetchExaminations();
      fetchStats();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/school/examinations/${id}/force`);
      toast.success('Permanently deleted');
      fetchExaminations();
      fetchStats();
    } catch { toast.error('Force delete failed'); }
  };

  /* ════════════════ BULK ACTIONS ════════════════ */
  const handleBulkStatus = async (status: boolean) => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/examinations/bulk-status', { ids: selectedIds, is_active: status });
      toast.success(`${selectedIds.length} record(s) ${status ? 'activated' : 'deactivated'}`);
      setSelectedIds([]);
      fetchExaminations();
      fetchStats();
    } catch { toast.error('Bulk status update failed'); }
    setBulkUpdating(false);
  };

  const handleBulkDelete = async (force = false) => {
    if (!selectedIds.length) return;
    const msg = force
      ? `Permanently delete ${selectedIds.length} record(s)? This cannot be undone.`
      : `Move ${selectedIds.length} record(s) to trash?`;
    if (!window.confirm(msg)) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/examinations/bulk-delete', { ids: selectedIds, force });
      toast.success(force ? 'Permanently deleted' : 'Moved to trash');
      setSelectedIds([]);
      fetchExaminations();
      fetchStats();
    } catch { toast.error('Bulk delete failed'); }
    setBulkUpdating(false);
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/examinations/bulk-restore', { ids: selectedIds });
      toast.success(`${selectedIds.length} record(s) restored`);
      setSelectedIds([]);
      fetchExaminations();
      fetchStats();
    } catch { toast.error('Bulk restore failed'); }
    setBulkUpdating(false);
  };

  /* ════════════════ EXPORT ════════════════ */
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Examinations');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 6 },
        { header: 'Academic Year', key: 'academic_year', width: 16 },
        { header: 'Class', key: 'class', width: 12 },
        { header: 'Exam Name', key: 'name', width: 30 },
        { header: 'Exam Type', key: 'exam_type', width: 18 },
        { header: 'Term', key: 'term', width: 14 },
        { header: 'Start Date', key: 'start_date', width: 14 },
        { header: 'End Date', key: 'end_date', width: 14 },
        { header: 'Max Marks', key: 'max_marks', width: 12 },
        { header: 'Passing Marks', key: 'passing_marks', width: 14 },
        { header: 'Status', key: 'status', width: 10 },
      ];
      const headerRow = sheet.getRow(1);
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      headerRow.height = 22;

      filtered.forEach(row => {
        sheet.addRow({
          id: row.id,
          academic_year: row.academic_year_label,
          class: row.class_name,
          name: row.name,
          exam_type: row.exam_type_label,
          term: row.term_label,
          start_date: row.start_date,
          end_date: row.end_date,
          max_marks: row.max_marks,
          passing_marks: row.passing_marks,
          status: row.is_active ? 'Active' : 'Inactive',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `examinations_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  /* ════════════════ SAMPLE TEMPLATE ════════════════ */
  const handleSampleDownload = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Examinations Import');
      sheet.columns = [
        { header: 'Academic Year *', key: 'academic_year', width: 18 },
        { header: 'Class *', key: 'class', width: 14 },
        { header: 'Exam Name *', key: 'exam_name', width: 30 },
        { header: 'Exam Type *', key: 'exam_type', width: 18 },
        { header: 'Term *', key: 'term', width: 16 },
        { header: 'Start Date * (YYYY-MM-DD)', key: 'start_date', width: 26 },
        { header: 'End Date * (YYYY-MM-DD)', key: 'end_date', width: 24 },
        { header: 'Max Marks *', key: 'max_marks', width: 12 },
        { header: 'Passing Marks *', key: 'passing_marks', width: 16 },
        { header: 'Status (Active/Inactive)', key: 'status', width: 24 },
      ];
      const headerRow = sheet.getRow(1);
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      headerRow.height = 22;

      const ayLabel = academicYears[0]?.label || '2025-2026';
      const clsLabel = classes[0]?.label || 'Class 10';
      const etLabel = examTypes[0]?.label || 'Quarterly';

      [
        [ayLabel, clsLabel, 'First Unit Test', etLabel, 'First Term', '2025-04-10', '2025-04-15', 100, 35, 'Active'],
        [ayLabel, clsLabel, 'Half Yearly Exam', etLabel, 'Second Term', '2025-09-01', '2025-09-10', 100, 35, 'Active'],
        [ayLabel, clsLabel, 'Annual Exam', etLabel, 'Final Term', '2026-02-01', '2026-02-15', 100, 35, 'Active'],
      ].forEach(row => sheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'examinations_import_template.xlsx');
      toast.success('Sample template downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  /* ════════════════ IMPORT FILE PARSE ════════════════ */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
        setImportRows(rows);
        setIsImportOpen(true);
      } catch {
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  /* ════════════════ IMPORT SUBMIT ════════════════ */
  const handleImportSubmit = async () => {
    if (!importRows.length) return;
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i];
      const rowNum = i + 2;
      try {
        const ayLabel = String(row['Academic Year *'] || row['Academic Year'] || '').trim();
        const clsLabel = String(row['Class *'] || row['Class'] || '').trim();
        const examName = String(row['Exam Name *'] || row['Exam Name'] || '').trim();
        const etLabel = String(row['Exam Type *'] || row['Exam Type'] || '').trim();
        const termLabel = String(row['Term *'] || row['Term'] || '').trim();
        const startDate = String(row['Start Date * (YYYY-MM-DD)'] || row['Start Date'] || '').trim();
        const endDate = String(row['End Date * (YYYY-MM-DD)'] || row['End Date'] || '').trim();
        const maxMarks = Number(row['Max Marks *'] || row['Max Marks'] || 0);
        const passingMarks = Number(row['Passing Marks *'] || row['Passing Marks'] || 0);
        const statusStr = String(row['Status (Active/Inactive)'] || row['Status'] || 'Active').trim();

        if (!ayLabel || !clsLabel || !examName || !etLabel || !termLabel || !startDate || !endDate) {
          errors.push({ row: rowNum, error: 'Missing required fields' });
          errorCount++;
          continue;
        }

        const ayItem = academicYears.find(a => a.label.toLowerCase() === ayLabel.toLowerCase());
        const clsItem = classes.find(c => c.label.toLowerCase() === clsLabel.toLowerCase());
        const etItem = examTypes.find(t => t.label.toLowerCase() === etLabel.toLowerCase());
        const termItem = TERM_OPTIONS.find(t => t.label.toLowerCase() === termLabel.toLowerCase());

        if (!ayItem) { errors.push({ row: rowNum, error: `Academic year not found: ${ayLabel}` }); errorCount++; continue; }
        if (!clsItem) { errors.push({ row: rowNum, error: `Class not found: ${clsLabel}` }); errorCount++; continue; }
        if (!etItem) { errors.push({ row: rowNum, error: `Exam type not found: ${etLabel}` }); errorCount++; continue; }
        if (!termItem) { errors.push({ row: rowNum, error: `Term not found: ${termLabel}` }); errorCount++; continue; }

        const res = await api.post('/school/examinations/bulk-import', {
          data: [{
            academic_year_id: Number(ayItem.value),
            class_id: Number(clsItem.value),
            exam_name: examName,
            exam_type_id: Number(etItem.value),
            term_id: Number(termItem.value),
            start_date: startDate,
            end_date: endDate,
            max_marks: maxMarks,
            passing_marks: passingMarks,
            is_active: statusStr.toLowerCase() !== 'inactive',
          }],
        });

        if (res.data.success && res.data.imported_count > 0) successCount++;
        else { errors.push({ row: rowNum, error: res.data.message || 'Import failed' }); errorCount++; }

      } catch (err: any) {
        errors.push({ row: rowNum, error: err?.response?.data?.message || err.message });
        errorCount++;
      }
    }

    setImporting(false);

    if (successCount > 0 && errorCount === 0) {
      toast.success(`✅ ${successCount} record(s) imported successfully!`);
      setIsImportOpen(false);
      fetchExaminations();
      fetchStats();
    } else if (successCount > 0 && errorCount > 0) {
      toast.success(`✅ ${successCount} imported, ⚠️ ${errorCount} failed.`);
      setIsImportOpen(false);
      fetchExaminations();
      fetchStats();
    } else {
      toast.error(`All ${errorCount} records failed to import.`);
    }
  };

  /* ════════════════ DATE FORMAT ════════════════ */
  const formatDate = (d: string) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* ════════════════ STATUS OPTIONS ════════════════ */
  const statusOptions: MasterOption[] = [
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' },
  ];

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="p-4 space-y-3 text-xs">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Exam Setup Control</h1>
            <p className="text-[10px] text-gray-500">Manage school examinations, schedules and marking schemes</p>
          </div>
        </div>
        <button
          onClick={() => { fetchExaminations(); fetchStats(); }}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">Refresh</span>
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <StatCard
          label="Total Exams"
          value={stats.total}
          icon={<ClipboardList className="w-3.5 h-3.5 text-white" />}
          color="bg-indigo-500"
          bg="bg-indigo-50 border-indigo-100"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<Activity className="w-3.5 h-3.5 text-white" />}
          color="bg-green-500"
          bg="bg-green-50 border-green-100"
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          icon={<EyeOff className="w-3.5 h-3.5 text-white" />}
          color="bg-amber-500"
          bg="bg-amber-50 border-amber-100"
        />
        <StatCard
          label="Trashed"
          value={stats.trashed}
          icon={<Archive className="w-3.5 h-3.5 text-white" />}
          color="bg-red-500"
          bg="bg-red-50 border-red-100"
        />
        <StatCard
          label="This Month"
          value={stats.thisMonth}
          icon={<TrendingUp className="w-3.5 h-3.5 text-white" />}
          color="bg-blue-500"
          bg="bg-blue-50 border-blue-100"
        />
      </div>

      {/* ── Primary Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-200">
        {/* Left: Search + Pagination + Trashed */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search examinations..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-6 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white h-7 w-44"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Per page */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-7">
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(e.target.value === 'all' ? -1 : Number(e.target.value)); setCurrentPage(1); }}
              className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Trashed toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-2 py-0.5 h-7">
            <Archive className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 font-semibold">Trashed</span>
            <ToggleSwitch
              checked={showTrashed}
              onChange={() => { setShowTrashed(v => !v); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSampleDownload}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition text-[11px] font-medium h-7"
            title="Download sample import template"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sample
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition cursor-pointer text-[11px] font-medium h-7">
            <Upload className="w-3.5 h-3.5" />
            Import
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition text-[11px] font-medium h-7"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-[11px] font-semibold h-7 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white px-2.5 py-2 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase">
          <Filter className="w-3 h-3" />
          Filters:
        </div>
        <SSelect options={academicYears} value={filterAcademicYear} onChange={v => { setFilterAcademicYear(v); setCurrentPage(1); }} placeholder="Academic Year" className="w-36" />
        <SSelect options={classes} value={filterClass} onChange={v => { setFilterClass(v); setCurrentPage(1); }} placeholder="Class" className="w-32" />
        <SSelect options={examTypes} value={filterExamType} onChange={v => { setFilterExamType(v); setCurrentPage(1); }} placeholder="Exam Type" className="w-36" />
        <SSelect options={TERM_OPTIONS} value={filterTerm} onChange={v => { setFilterTerm(v); setCurrentPage(1); }} placeholder="Term" className="w-32" />
        <SSelect options={statusOptions} value={filterStatus} onChange={v => { setFilterStatus(v); setCurrentPage(1); }} placeholder="Status" className="w-28" />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-0.5 text-[11px] text-red-500 hover:text-red-700 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-[10px] text-gray-400 font-medium">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg text-[11px] text-indigo-800">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatus(true)}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-green-50 hover:border-green-400 transition disabled:opacity-50 text-green-700 font-medium"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatus(false)}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-amber-50 hover:border-amber-400 transition disabled:opacity-50 text-amber-700 font-medium"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => handleBulkDelete(false)}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-red-50 hover:border-red-400 transition disabled:opacity-50 text-red-600 font-medium"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-green-50 transition disabled:opacity-50 text-green-700 font-medium"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleBulkDelete(true)}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-red-300 rounded hover:bg-red-50 transition disabled:opacity-50 text-red-700 font-medium"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-0.5 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading examinations...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wide">
                  <th className="py-2 px-2.5 w-7">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                    />
                  </th>
                  <th className="py-2 px-2.5 w-8 text-center">#</th>
                  <SortTh field="academic_year_label" label="Academic Year" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="class_name" label="Class" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="name" label="Exam Name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="exam_type_label" label="Exam Type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="term_label" label="Term" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th className="py-2 px-2.5">Start Date</th>
                  <th className="py-2 px-2.5">End Date</th>
                  <SortTh field="max_marks" label="Max" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                  <SortTh field="passing_marks" label="Pass" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                  <SortTh field="is_active" label="Status" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center w-24" />
                  <th className="py-2 px-2.5 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0
                  ? <EmptyState trashed={showTrashed} />
                  : paginated.map((exam, idx) => (
                    <tr key={exam.id} className={`hover:bg-indigo-50/40 transition ${selectedIds.includes(exam.id) ? 'bg-indigo-50/60' : ''}`}>
                      <td className="py-1.5 px-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(exam.id)}
                          onChange={() => handleSelectRow(exam.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                        />
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-gray-400 font-mono">
                        {itemsPerPage === -1 ? idx + 1 : (currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-1.5 px-2.5 text-gray-600">{exam.academic_year_label}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-gray-900">{exam.class_name}</td>
                      <td className="py-1.5 px-2.5">
                        <span className="font-medium text-gray-800">{exam.name}</span>
                      </td>
                      <td className="py-1.5 px-2.5">
                        <span className="px-1.5 py-0.5 text-[10px] bg-violet-50 text-violet-700 rounded-full font-medium border border-violet-100">
                          {exam.exam_type_label}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5">
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
                          {exam.term_label}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-gray-600 whitespace-nowrap">{formatDate(exam.start_date)}</td>
                      <td className="py-1.5 px-2.5 text-gray-600 whitespace-nowrap">{formatDate(exam.end_date)}</td>
                      <td className="py-1.5 px-2.5 text-right font-semibold text-gray-900">{exam.max_marks}</td>
                      <td className="py-1.5 px-2.5 text-right text-gray-600">{exam.passing_marks}</td>
                      <td className="py-1.5 px-2.5 text-center">
                        {!exam.deleted_at ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <ToggleSwitch
                              checked={exam.is_active}
                              onChange={() => handleToggleStatus(exam.id)}
                            />
                            <span className={`text-[10px] font-medium ${exam.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                              {exam.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-semibold">Trashed</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!exam.deleted_at ? (
                            <>
                              <button
                                onClick={() => openEdit(exam)}
                                className="p-1 text-indigo-500 hover:bg-indigo-100 rounded transition"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(exam.id, exam.name)}
                                className="p-1 text-red-500 hover:bg-red-100 rounded transition"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestore(exam.id)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded transition"
                                title="Restore"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleForceDelete(exam.id, exam.name)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[11px]">
          <p className="text-gray-500">
            Showing{' '}
            <span className="font-semibold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span>
            {' '}–{' '}
            <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span>
            {' '}of{' '}
            <span className="font-semibold text-gray-700">{filtered.length}</span> results
          </p>
          <nav className="isolate inline-flex -space-x-px rounded shadow-sm">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = totalPages <= 7 ? i + 1 : (
                currentPage <= 4 ? i + 1 :
                  currentPage >= totalPages - 3 ? totalPages - 6 + i :
                    currentPage - 3 + i
              );
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-2.5 py-0.5 font-semibold focus:z-20 ${currentPage === page
                    ? 'z-10 bg-indigo-600 text-white'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      )}

      {/* ════════════════════════════════════════
          ADD / EDIT MODAL
      ════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {editingItem ? 'Edit Examination' : 'Add New Examination'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
              {/* Row 1: Academic Year + Class */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <SSelect
                    options={academicYears}
                    value={formData.academic_year_id}
                    onChange={v => setFormData(p => ({ ...p, academic_year_id: v }))}
                    placeholder="Select Year"
                    isClearable={false}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <SSelect
                    options={classes}
                    value={formData.class_id}
                    onChange={v => setFormData(p => ({ ...p, class_id: v }))}
                    placeholder="Select Class"
                    isClearable={false}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Exam Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Exam Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Half Yearly Examination 2025"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs"
                  required
                />
              </div>

              {/* Row 2: Exam Type + Term */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Exam Type <span className="text-red-500">*</span>
                  </label>
                  <SSelect
                    options={examTypes}
                    value={formData.exam_type}
                    onChange={v => setFormData(p => ({ ...p, exam_type: v }))}
                    placeholder="Select Type"
                    isClearable={false}
                    className="w-full"
                  />
                  {examTypes.length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-0.5">No exam types found. Add via Exam Types menu.</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Term <span className="text-red-500">*</span>
                  </label>
                  <SSelect
                    options={TERM_OPTIONS}
                    value={formData.term}
                    onChange={v => setFormData(p => ({ ...p, term: v }))}
                    placeholder="Select Term"
                    isClearable={false}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Row 3: Start Date + End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    min={formData.start_date}
                    onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Max Marks + Passing Marks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Max Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.max_marks}
                    onChange={e => setFormData(p => ({ ...p, max_marks: e.target.value }))}
                    placeholder="100"
                    min={1}
                    max={1000}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Passing Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.passing_marks}
                    onChange={e => setFormData(p => ({ ...p, passing_marks: e.target.value }))}
                    placeholder="35"
                    min={0}
                    max={Number(formData.max_marks) || 1000}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs"
                    required
                  />
                </div>
              </div>

              {/* Row 5: Description + Active Status */}
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description / Notes</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Optional notes about this examination..."
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 h-[34px]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Active</span>
                  <ToggleSwitch
                    checked={formData.is_active}
                    onChange={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-semibold disabled:opacity-60"
                >
                  {formSaving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <>{editingItem ? 'Update Examination' : 'Create Examination'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          IMPORT MODAL
      ════════════════════════════════════════ */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold text-white">Import Examinations</h3>
                </div>
                <button
                  onClick={() => setIsImportOpen(false)}
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 text-xs">
              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100 mb-4">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-indigo-800 mb-0.5">Preview — {importRows.length} row(s) ready to import</p>
                  <p className="text-indigo-600">
                    Values must match existing records. Academic Year, Class, and Exam Type must exactly match the names in the system.
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="bg-indigo-600 text-white">
                      {importRows[0] && Object.keys(importRows[0]).map(k => (
                        <th key={k} className="py-1.5 px-2 font-semibold whitespace-nowrap">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="py-1 px-2 text-gray-700 whitespace-nowrap">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importRows.length > 10 && (
                <p className="text-[10px] text-gray-500 mt-1">Showing first 10 of {importRows.length} rows.</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-3 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={importing}
                className="flex items-center gap-1.5 px-5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold disabled:opacity-60"
              >
                {importing ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="w-3.5 h-3.5" /> Import {importRows.length} Records</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}