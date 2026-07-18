import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLocation } from 'react-router-dom';
import {
  Layers, MapPin, Grid, Users, Search, Plus, Trash2,
  X, RefreshCw, Printer, CheckSquare,
  ChevronLeft, ChevronRight, Archive,
  Loader2, ClipboardList, Activity, Info, Filter, Edit3, RotateCcw,
  Download, Upload, AlertTriangle
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface AllocatedStudent {
  id: number;
  student_id: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface ExamRoomAllocation {
  id: number;
  examination_id: number;
  examination_name: string;
  academic_year_id: number | null;
  academic_year_name: string;
  class_id: number;
  class_name: string;
  room_name: string;
  capacity: number;
  seat_rows: number;
  seat_cols: number;
  allocated_student_ids: number[];
  allocated_students: (AllocatedStudent | null)[];
  is_active: boolean;
  deleted_at?: string | null;
  created_at?: string;
}

interface ExaminationOption {
  id: number;
  name: string;
  class_id: number;
  class_name: string;
  academic_year_id: number;
}

interface MasterOption {
  value: string;
  label: string;
}

interface Stats {
  total: number;
  rooms: number;
  active: number;
  trashed: number;
  mappedStudentsCount: number;
}

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
  menu: (b: any) => ({ ...b, borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 99999 }),
  menuPortal: (b: any) => ({ ...b, zIndex: 99999 }),
  clearIndicator: (b: any) => ({ ...b, padding: '2px' }),
  dropdownIndicator: (b: any) => ({ ...b, padding: '2px' }),
};

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
      <p className="text-lg font-bold text-gray-800 leading-tight">
        {value}
      </p>
    </div>
  </div>
);



const EMPTY_FORM = {
  examination_id: '',
  class_id: '',
  room_name: '',
  capacity: '40',
  seat_rows: '5',
  seat_cols: '8',
  is_active: true,
};

const statusOptions = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
];

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function ExamSeatingManager() {
  const location = useLocation();
  const isRoomAllocation = location.pathname.includes('room-allocation');

  const [allocations, setAllocations] = useState<ExamRoomAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, rooms: 0, active: 0, trashed: 0, mappedStudentsCount: 0 });

  /* ── masters metadata ── */
  const [examinations, setExaminations] = useState<ExaminationOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [academicYears, setAcademicYears] = useState<MasterOption[]>([]);

  /* ── filters ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterExam, setFilterExam] = useState('');
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

  /* ── add/edit modal ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamRoomAllocation | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formSaving, setFormSaving] = useState(false);

  /* ── grid matrix preview modal ── */
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ExamRoomAllocation | null>(null);
  const [searchDeskQuery, setSearchDeskQuery] = useState('');

  /* ════════════════ FETCH DATA ════════════════ */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/school/exam-room-allocations/stats');
      if (res.data.success) setStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/exam-room-allocations', {
        params: { trashed: showTrashed ? '1' : '0' },
      });
      if (res.data.success) setAllocations(res.data.data || []);
    } catch {
      toast.error('Failed to load room allocations');
    }
    setLoading(false);
  }, [showTrashed]);

  const fetchMasters = useCallback(async () => {
    try {
      const [exRes, clRes, ayRes] = await Promise.all([
        api.get('/school/examinations', { params: { trashed: '0' } }),
        api.get('/master/classes'),
        api.get('/school/academic-years'),
      ]);

      if (exRes.data.success) setExaminations(exRes.data.data || []);

      if (clRes.data.success) {
        const data = clRes.data.data;
        const arr = Array.isArray(data)
          ? data.map((c: any) => ({ value: String(c.id || c.m_id), label: c.name || c.m_name }))
          : Object.entries(data).map(([id, name]) => ({ value: id, label: name as string }));
        setClasses(arr);
      }

      if (ayRes.data.success) {
        const data = ayRes.data.data;
        const arr = Array.isArray(data)
          ? data.map((y: any) => ({ value: String(y.id), label: y.name }))
          : Object.entries(data).map(([id, name]) => ({ value: id, label: name as string }));
        setAcademicYears(arr);
      }
    } catch {
      toast.error('Failed to load master metadata');
    }
  }, []);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchAllocations();
    fetchStats();
    setSelectedIds([]);
  }, [fetchAllocations, fetchStats]);

  /* ── Auto select class when examination is selected in add mode ── */
  useEffect(() => {
    if (!editingItem && formData.examination_id) {
      const selectedExam = examinations.find(e => String(e.id) === formData.examination_id);
      if (selectedExam) {
        setFormData(prev => ({
          ...prev,
          class_id: String(selectedExam.class_id)
        }));
      }
    }
  }, [formData.examination_id, examinations, editingItem]);

  /* ════════════════ FILTER & SORT ════════════════ */
  const filtered = useMemo(() => {
    let arr = [...allocations];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(a =>
        a.room_name.toLowerCase().includes(q) ||
        a.examination_name.toLowerCase().includes(q) ||
        a.class_name.toLowerCase().includes(q)
      );
    }

    if (filterAcademicYear) arr = arr.filter(a => String(a.academic_year_id) === filterAcademicYear);
    if (filterClass) arr = arr.filter(a => String(a.class_id) === filterClass);
    if (filterExam) arr = arr.filter(a => String(a.examination_id) === filterExam);
    if (filterStatus !== '') arr = arr.filter(a => a.is_active === (filterStatus === '1'));

    arr.sort((a: any, b: any) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return arr;
  }, [allocations, searchTerm, filterAcademicYear, filterClass, filterExam, filterStatus, sortField, sortDir]);

  const totalPages = useMemo(() => itemsPerPage === -1 ? 1 : Math.ceil(filtered.length / itemsPerPage), [filtered, itemsPerPage]);

  const paginated = useMemo(() => {
    if (itemsPerPage === -1) return filtered;
    const s = (currentPage - 1) * itemsPerPage;
    return filtered.slice(s, s + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const isAllSelected = paginated.length > 0 && paginated.every(r => selectedIds.includes(r.id));
  const handleSelectAll = () => isAllSelected ? setSelectedIds([]) : setSelectedIds(paginated.map(r => r.id));
  const handleSelectRow = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const hasFilters = searchTerm || filterAcademicYear || filterClass || filterExam || filterStatus;
  const clearFilters = () => {
    setSearchTerm('');
    setFilterAcademicYear('');
    setFilterClass('');
    setFilterExam('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  /* ════════════════ CRUD ACTIONS ════════════════ */
  const openAdd = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const openEdit = (item: ExamRoomAllocation) => {
    setEditingItem(item);
    setFormData({
      examination_id: String(item.examination_id),
      class_id: String(item.class_id),
      room_name: item.room_name,
      capacity: String(item.capacity),
      seat_rows: String(item.seat_rows),
      seat_cols: String(item.seat_cols),
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examination_id || !formData.class_id || !formData.room_name || !formData.capacity || !formData.seat_rows || !formData.seat_cols) {
      toast.error('Please fill all required fields');
      return;
    }

    const gridCap = Number(formData.seat_rows) * Number(formData.seat_cols);
    if (gridCap > Number(formData.capacity)) {
      toast.error(`Matrix capacity (${gridCap} seats) cannot exceed room capacity (${formData.capacity}).`);
      return;
    }

    setFormSaving(true);
    try {
      const payload = {
        examination_id: Number(formData.examination_id),
        class_id: Number(formData.class_id),
        room_name: formData.room_name,
        capacity: Number(formData.capacity),
        seat_rows: Number(formData.seat_rows),
        seat_cols: Number(formData.seat_cols),
        is_active: formData.is_active,
      };

      if (editingItem) {
        await api.put(`/school/exam-room-allocations/${editingItem.id}`, payload);
        toast.success('Room allocation updated');
      } else {
        await api.post('/school/exam-room-allocations', payload);
        toast.success('Room allocated & seating arrangement generated');
      }
      setIsModalOpen(false);
      fetchAllocations();
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save room allocation');
    }
    setFormSaving(false);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/school/exam-room-allocations/${id}/toggle-status`);
      setAllocations(prev => prev.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a));
      fetchStats();
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Move allocation for "${name}" to trash?`)) return;
    try {
      await api.delete(`/school/exam-room-allocations/${id}`);
      toast.success('Moved to trash');
      fetchAllocations();
      fetchStats();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/exam-room-allocations/${id}/restore`);
      toast.success('Allocation restored');
      fetchAllocations();
      fetchStats();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete room allocation for "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/school/exam-room-allocations/${id}/force`);
      toast.success('Permanently deleted');
      fetchAllocations();
      fetchStats();
    } catch { toast.error('Force delete failed'); }
  };

  /* ════════════════ BULK ACTIONS ════════════════ */
  const handleBulkStatus = async (status: boolean) => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-room-allocations/bulk-status', { ids: selectedIds, is_active: status });
      toast.success(`${selectedIds.length} allocation(s) status updated`);
      setSelectedIds([]);
      fetchAllocations();
      fetchStats();
    } catch { toast.error('Bulk status update failed'); }
    setBulkUpdating(false);
  };

  const handleBulkDelete = async (force = false) => {
    if (!selectedIds.length) return;
    const msg = force
      ? `Permanently delete ${selectedIds.length} allocation(s)? This cannot be undone.`
      : `Move ${selectedIds.length} allocation(s) to trash?`;
    if (!window.confirm(msg)) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-room-allocations/bulk-delete', { ids: selectedIds, force });
      toast.success(force ? 'Permanently deleted' : 'Moved to trash');
      setSelectedIds([]);
      fetchAllocations();
      fetchStats();
    } catch { toast.error('Bulk delete failed'); }
    setBulkUpdating(false);
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-room-allocations/bulk-restore', { ids: selectedIds });
      toast.success(`${selectedIds.length} allocation(s) restored`);
      setSelectedIds([]);
      fetchAllocations();
      fetchStats();
    } catch { toast.error('Bulk restore failed'); }
    setBulkUpdating(false);
  };

  /* ════════════════ SEATING MATRIX VIEW ════════════════ */
  const openLayout = (item: ExamRoomAllocation) => {
    setActiveItem(item);
    setSearchDeskQuery('');
    setIsLayoutOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<{
    open: boolean;
    imported: number;
    failed: number;
    errors: Record<number, string[]>;
  } | null>(null);

  /* ── ⧉ CSV EXPORT & TEMPLATES ── */
  const handleExport = () => {
    const token = localStorage.getItem('token') || '';
    const exportUrl = `${api.defaults.baseURL}/school/exam-room-allocations/export?token=${token}`;
    window.open(exportUrl, '_blank');
    toast.success('Exporting seating allocations CSV');
  };

  const handleDownloadSample = () => {
    const sampleUrl = `${api.defaults.baseURL}/school/exam-room-allocations/sample`;
    window.open(sampleUrl, '_blank');
    toast.success('Downloading import sample template');
  };

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

        const res = await api.post('/school/exam-room-allocations/bulk-import', { data: parsed });
        if (res.data.success) {
          toast.success(res.data.message || 'Bulk import complete');
          fetchAllocations();
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

  const handlePrint = () => {
    window.print();
  };

  /* ── Dropdown Select Options ── */
  const examSelectOptions = useMemo(() => examinations.map(e => ({ value: String(e.id), label: `${e.class_name} - ${e.name}` })), [examinations]);

  /* ════════════════ RENDER JSX ════════════════ */
  return (
    <div className="p-4 space-y-3 text-xs">
      
      {/* ── Hidden file input for Excel import ── */}
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
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {isRoomAllocation ? 'Exam Room Allocation' : 'Seating Arrangement Manager'}
            </h1>
            <p className="text-[10px] text-gray-500">
              {isRoomAllocation 
                ? 'Assign classrooms and exam halls to classes, check maximum desk limits and configure seating layouts.'
                : 'Inspect desk layout grids, search roll number coordinates, and print room seating matrix sheets.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { fetchAllocations(); fetchStats(); }}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">Refresh</span>
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <StatCard
          label="Total Allocations"
          value={stats.total}
          icon={<ClipboardList className="w-3.5 h-3.5 text-white" />}
          color="bg-indigo-500"
          bg="bg-indigo-50 border-indigo-100"
        />
        <StatCard
          label="Unique Rooms Mapped"
          value={stats.rooms}
          icon={<MapPin className="w-3.5 h-3.5 text-white" />}
          color="bg-green-500"
          bg="bg-green-50 border-green-100"
        />
        <StatCard
          label="Active Allocations"
          value={stats.active}
          icon={<Activity className="w-3.5 h-3.5 text-white" />}
          color="bg-blue-500"
          bg="bg-blue-50 border-blue-100"
        />
        <StatCard
          label="Mapped Students"
          value={stats.mappedStudentsCount}
          icon={<Users className="w-3.5 h-3.5 text-white" />}
          color="bg-purple-500"
          bg="bg-purple-50 border-purple-100"
        />
        <StatCard
          label="Trashed Allocations"
          value={stats.trashed}
          icon={<Archive className="w-3.5 h-3.5 text-white" />}
          color="bg-red-500"
          bg="bg-red-50 border-red-100"
        />
      </div>

      {/* ── Primary Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search allocations..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-6 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white h-7 w-44"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Items per page select */}
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

          {/* Select All Checkbox */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-2.5 py-0.5 h-7">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[10px] text-gray-500 font-semibold select-none">Select All</span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-7 text-[11px] font-semibold text-gray-750">
            <span className="text-[10px] text-gray-400">Sort:</span>
            <select
              value={sortField}
              onChange={e => handleSort(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-[10px] font-semibold text-gray-650"
            >
              <option value="id">Created Date</option>
              <option value="room_name">Room Name</option>
              <option value="examination_name">Examination</option>
              <option value="capacity">Capacity</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="text-gray-400 hover:text-indigo-650 font-bold ml-0.5"
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
            title="Download CSV Import Template"
          >
            <Download className="w-3.5 h-3.5" />
            Sample
          </button>
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
            title="Import Seating Allocations CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition text-[11px] font-semibold h-7"
            title="Export Room Allocations to CSV"
          >
            <Download className="w-3.5 h-3.5 text-green-600" />
            Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-[11px] font-semibold h-7 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            {isRoomAllocation ? 'Allocate Room' : 'Add Seating Plan'}
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
        <SSelect options={examSelectOptions} value={filterExam} onChange={v => { setFilterExam(v); setCurrentPage(1); }} placeholder="Examination" className="w-48" />
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
          {filtered.length} allocation{filtered.length !== 1 ? 's' : ''} found
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

      {/* ── Seating grid allocations cards layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-12 gap-2 text-gray-500 bg-white border border-gray-200 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading room allocations...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 bg-white border border-gray-200 rounded-lg py-16 text-center text-gray-500 shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8 text-gray-300" />
              <p className="font-semibold text-gray-600">No room allocations found</p>
              <p className="text-[10px] text-gray-400">Map rooms and grids to examinations to populate list.</p>
            </div>
          </div>
        ) : (
          paginated.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3.5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleSelectRow(item.id)}
                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold uppercase">
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      <span>{item.room_name}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm truncate">{item.examination_name}</h3>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200">
                    {item.class_name}
                  </span>
                  <span className="text-[8px] text-gray-400 font-mono">Academic Year: {item.academic_year_name}</span>
                  {!item.deleted_at ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <ToggleSwitch
                        checked={item.is_active}
                        onChange={() => handleToggleStatus(item.id)}
                      />
                      <span className={`text-[9px] font-semibold ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-650 rounded text-[8px] font-bold">Trashed</span>
                  )}
                </div>
              </div>

              {/* Specs parameters */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded border border-gray-100 text-[10px] font-semibold text-gray-600">
                <div>
                  <span className="text-gray-400 block text-[8px] uppercase">Total Capacity</span>
                  <span className="text-gray-900 font-bold text-xs">{item.capacity} Seats</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[8px] uppercase">Allocated Students</span>
                  <span className="text-indigo-600 font-bold text-xs">{(item.allocated_student_ids || []).length} Students</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[8px] uppercase">Grid Layout</span>
                  <span className="text-gray-900 font-bold text-xs">{item.seat_rows} × {item.seat_cols}</span>
                </div>
              </div>

              {/* Actions footer */}
              <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                <button
                  onClick={() => openLayout(item)}
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold text-xs transition"
                >
                  <Grid className="w-4 h-4" />
                  <span>View Seating Arrangement Grid Map</span>
                </button>

                <div className="flex items-center gap-1">
                  {!item.deleted_at ? (
                    <>
                      <button onClick={() => openEdit(item)} className="p-1 text-gray-400 hover:text-indigo-600 rounded transition" title="Edit layout">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.room_name)} className="p-1 text-gray-400 hover:text-rose-600 rounded transition" title="Move to Trash">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleRestore(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded transition" title="Restore">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleForceDelete(item.id, item.room_name)} className="p-1 text-red-600 hover:bg-red-50 rounded transition" title="Delete Permanently">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] mt-2">
          <p className="text-gray-500">
            Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span>–
            <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-2.5 py-0.5 font-semibold ${currentPage === page ? 'z-10 bg-indigo-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
              >
                {page}
              </button>
            ))}
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
          ADD / EDIT MODAL (NON-SCROLLABLE)
      ════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {editingItem ? 'Edit Room Allocation' : 'Allocate Room & Seating Layout'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
              
              {/* Examination Select */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Examination Name <span className="text-red-500">*</span>
                </label>
                <SSelect
                  options={examSelectOptions}
                  value={formData.examination_id}
                  onChange={v => setFormData(p => ({ ...p, examination_id: v }))}
                  placeholder="Select Examination"
                  isClearable={false}
                  className="w-full text-xs"
                />
              </div>

              {/* Class & Room inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Class/Grade <span className="text-red-500">*</span>
                  </label>
                  <SSelect
                    options={classes}
                    value={formData.class_id}
                    onChange={v => setFormData(p => ({ ...p, class_id: v }))}
                    placeholder="Class"
                    isClearable={false}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.room_name}
                    onChange={e => setFormData(p => ({ ...p, room_name: e.target.value }))}
                    placeholder="e.g. Main Exam Hall A"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Seat Rows, Seat Columns, Capacity */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Seat Rows <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.seat_rows}
                    onChange={e => setFormData(p => ({ ...p, seat_rows: e.target.value }))}
                    placeholder="5"
                    min={1}
                    max={30}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Seat Columns <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.seat_cols}
                    onChange={e => setFormData(p => ({ ...p, seat_cols: e.target.value }))}
                    placeholder="8"
                    min={1}
                    max={30}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Room Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData(p => ({ ...p, capacity: e.target.value }))}
                    placeholder="40"
                    min={1}
                    max={500}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Total Seats Calculation Alert */}
              {formData.seat_rows && formData.seat_cols && (
                <div className={`p-2 rounded border text-[10px] font-semibold flex items-center gap-1.5 ${(Number(formData.seat_rows) * Number(formData.seat_cols)) > (Number(formData.capacity) || 0) ? 'bg-red-50 border-red-200 text-red-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    Seating grid structure total: <strong>{Number(formData.seat_rows) * Number(formData.seat_cols)} desks</strong> (Capacity: {formData.capacity} seats).
                  </span>
                </div>
              )}

              {/* Status Switch */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 h-[36px]">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Active Status</span>
                <ToggleSwitch
                  checked={formData.is_active}
                  onChange={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                />
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
                    <>{editingItem ? 'Update Allocation' : 'Generate Seating Plan'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          GRID SEATING LAYOUT PREVIEW MODAL
      ════════════════════════════════════════ */}
      {isLayoutOpen && activeItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 rounded-t-xl flex-shrink-0 text-white">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold">Seating Arrangement Desk Map</h3>
                  <p className="text-[10px] text-indigo-100 font-semibold">{activeItem.room_name} ➔ {activeItem.class_name} ({activeItem.examination_name})</p>
                </div>
                <button onClick={() => setIsLayoutOpen(false)} className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* Invigilator Board Indicator */}
              <div className="w-full border border-dashed border-gray-300 p-2 rounded text-center text-[10px] font-bold text-gray-400 bg-gray-50 uppercase tracking-widest flex-shrink-0">
                🗣️ Invigilator Desk / Front Board Direction
              </div>

              {/* Desk search filter */}
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Highlight roll number or student name..."
                  value={searchDeskQuery}
                  onChange={e => setSearchDeskQuery(e.target.value)}
                  className="pl-7 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white h-7 w-full"
                />
              </div>

              {/* Grid representation */}
              <div 
                className="grid gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 overflow-auto justify-center"
                style={{
                  gridTemplateColumns: `repeat(${activeItem.seat_cols}, minmax(80px, 1fr))`
                }}
              >
                {Array.from({ length: activeItem.seat_rows }).map((_, rIdx) => 
                  Array.from({ length: activeItem.seat_cols }).map((_, cIdx) => {
                    const studentIdx = rIdx * activeItem.seat_cols + cIdx;
                    const student = activeItem.allocated_students[studentIdx];
                    
                    const isMatched = student && searchDeskQuery && (
                      student.roll_number.toLowerCase().includes(searchDeskQuery.toLowerCase()) ||
                      student.full_name.toLowerCase().includes(searchDeskQuery.toLowerCase())
                    );

                    return (
                      <div 
                        key={`${rIdx}-${cIdx}`}
                        className={`p-2 rounded border text-center transition shadow-sm ${
                          student 
                            ? isMatched 
                              ? 'bg-amber-100 text-amber-900 border-amber-400 scale-105 font-bold font-mono'
                              : 'bg-white text-gray-900 border-gray-200 hover:border-indigo-400 hover:scale-[1.03]' 
                            : 'bg-gray-100 text-gray-300 border-gray-200 border-dashed'
                        }`}
                      >
                        <div className="text-[7px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 font-mono">
                          R{rIdx + 1}-C{cIdx + 1}
                        </div>
                        <div className="font-bold font-mono text-[10px] truncate">
                          {student ? student.roll_number : 'VACANT'}
                        </div>
                        {student && (
                          <div className="text-[8px] text-gray-500 truncate leading-tight font-medium" title={student.full_name}>
                            {student.first_name}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-3 flex justify-between items-center bg-gray-50 rounded-b-xl flex-shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Grid layout capacity: {activeItem.seat_rows * activeItem.seat_cols} desks
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsLayoutOpen(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-100 transition"
                >
                  Close Map
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 shadow shadow-indigo-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print List
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* ── Bulk Import Report Details Dialog ── */}
      {importReport?.open && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[100000] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-150">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex-shrink-0 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold">Roster Bulk Import Execution Report</h3>
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
