import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Trash2, Edit3,
  CheckCircle2, XCircle, RefreshCw, ChevronRight, ChevronLeft,
  Download, FileUp, Eye, Info, AlertTriangle, ToggleLeft,
  ToggleRight, GraduationCap
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Interfaces ────────────────────────────────────────────────────────────
interface Student {
  id: number;
  student_id: string;
  admission_number: string;
  roll_number: string;
  admission_date: string;
  section: string;
  full_name: string;
  class_name: string;
  gender: string;
  father_name: string;
  father_mobile: string;
  father_occupation: string;
  mother_name: string;
  mother_mobile: string;
  mother_occupation: string;
  alternate_mobile: string;
  blood_group?: string | number | null;
  aadhaar_number?: string | null;
  parent_email: string;
  parent_phone: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  previous_school: string;
  previous_class: string;
  previous_board?: string | null;
  previous_passing_year?: string | null;
  previous_grade?: string | null;
  previous_tc_number?: string | null;
  previous_tc_date?: string | null;
  nationality?: string | null;
  mother_tongue?: string | null;
  religion?: string | null;
  category?: string | null;
  status?: string | null;
  student_status_label?: string | null;
  academic_year?: string | null;
  admission_type?: string | null;
  admission_type_label?: string | null;
  admission_category?: string | null;
  admission_category_label?: string | null;
  pen_number?: string | null;
  apaar_id?: string | null;
  previous_school_address?: string | null;
  previous_school_city?: string | null;
  previous_school_state?: string | null;
  previous_udise_code?: string | null;
  previous_reason_leaving?: string | null;
  previous_reason_leaving_label?: string | null;
  previous_reason_leaving_custom?: string | null;
  previous_admission_number?: string | null;
  permanent_address_line1?: string | null;
  permanent_city?: string | null;
  permanent_state?: string | null;
  permanent_pincode?: string | null;
  same_as_temporary?: boolean | null;
  medium: string;
  medical_conditions: string;
  allergies: string;
  doctor_name: string;
  doctor_contact: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_mobile: string;
  transport_required: boolean;
  transport_route: string;
  pickup_point: string;
  hostel_required: boolean;
  room_number: string;
  user?: {
    email: string;
    mobile: string;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    is_active: boolean;
  };
}

interface MasterOption { value: number; label: string; }
interface Stats { total: number; active: number; inactive: number; trashed: number; }
interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => void;
}




const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#ffffff',
    borderColorHover: state.isFocused ? '#3b82f6' : '#d1d5db',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '11px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#111827',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '26px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '11px',
    padding: '6px 8px',
    cursor: 'pointer',
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '2px',
    zIndex: 9999,
  }),
};


// ─── Confirm Dialog ────────────────────────────────────────────────────────
function ConfirmDialog({ cfg, onClose }: { cfg: ConfirmConfig; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center border border-gray-150 transform transition-all duration-300">
        <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500">
          {cfg.danger
            ? <AlertTriangle size={24} />
            : <Info size={24} className="text-blue-500" />}
        </div>
        <h3 className="text-sm font-bold text-gray-800 mb-2">{cfg.title}</h3>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">{cfg.message}</p>
        <div className="flex gap-2.5 justify-center">
          <button className="px-3.5 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition" onClick={onClose}>Cancel</button>
          <button
            className={`px-3.5 py-1.5 text-white text-xs font-semibold rounded-lg transition ${cfg.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={() => { cfg.onConfirm(); onClose(); }}
          >{cfg.confirmText ?? 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function StudentAdmission() {
  const navigate = useNavigate();

  // Trashed Toggle State
  const [showTrashed, setShowTrashed] = useState<boolean>(false);

  // Master options
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [genders, setGenders] = useState<{ value: string; label: string }[]>([]);

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Selection
  const [selected, setSelected] = useState<number[]>([]);

  // Modals
  const [viewOpen, setViewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [current, setCurrent] = useState<Student | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);
  const [importWarns, setImportWarns] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Fetchers ──────────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    try {
      const r = await api.get('/master/classes');
      if (r.data?.success && r.data.data) {
        const mapped = Object.entries(r.data.data).map(([id, name]) => ({
          value: Number(id),
          label: name as string
        }));
        setClasses(mapped);
      }
    } catch { }
  }, []);

  const loadGenders = useCallback(async () => {
    try {
      const r = await api.get('/master/genders');
      if (r.data?.success && r.data.data) {
        const mapped = Object.entries(r.data.data).map(([, name]) => ({
          value: name as string,
          label: name as string
        }));
        setGenders(mapped);
      }
    } catch { }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const r = await api.get('/students/stats');
      if (r.data.success) setStats(r.data.data);
    } catch { }
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const ep = showTrashed ? '/students/trashed' : '/students';
      const r = await api.get(ep, {
        params: {
          page, per_page: perPage,
          search: search || undefined,
          class_id: filterClass || undefined,
          status: filterStatus || undefined,
          gender: filterGender || undefined,
          from_date: filterFrom || undefined,
          to_date: filterTo || undefined,
        },
      });
      if (r.data.success) {
        setStudents(r.data.data ?? []);
        setPage(r.data.current_page ?? 1);
        setLastPage(r.data.last_page ?? 1);
        setTotal(r.data.total ?? 0);
      } else {
        setStudents([]); setTotal(0);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to load students');
      setStudents([]);
    } finally { setLoading(false); }
  }, [showTrashed, page, perPage, search, filterClass, filterStatus, filterGender, filterFrom, filterTo]);

  useEffect(() => { loadClasses(); loadStats(); loadGenders(); }, [loadClasses, loadStats, loadGenders]);
  useEffect(() => { loadStudents(); setSelected([]); }, [loadStudents]);

  const refresh = () => { loadStudents(); loadStats(); };
  const resetFilters = () => {
    setSearch(''); setFilterClass(''); setFilterStatus('');
    setFilterGender(''); setFilterFrom(''); setFilterTo(''); setPage(1);
  };
  const hasFilters = !!(search || filterClass || filterStatus || filterGender || filterFrom || filterTo);

  // ─── Confirm Helper ────────────────────────────────────────────────────────
  const ask = (cfg: ConfirmConfig) => setConfirm(cfg);

  // ─── Bulk Actions ──────────────────────────────────────────────────────────
  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelected(e.target.checked ? students.map(s => s.id) : []);
  const toggleOne = (id: number) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const bulkStatus = (status: 'active' | 'inactive') => {
    if (!selected.length) return;
    ask({
      title: status === 'active' ? 'Mark Active' : 'Mark Inactive',
      message: `Update ${selected.length} student(s) to ${status}?`,
      confirmText: 'Yes, Update',
      onConfirm: async () => {
        try {
          const r = await api.post('/students/bulk-status', { ids: selected, status });
          if (r.data.success) { toast.success(r.data.message); setSelected([]); refresh(); }
        } catch (e: any) { toast.error(e.response?.data?.message ?? 'Failed'); }
      },
    });
  };

  const bulkTrash = () => {
    if (!selected.length) return;
    ask({
      title: 'Move to Trash', danger: true,
      message: `Move ${selected.length} student(s) to trash?`,
      confirmText: 'Move to Trash',
      onConfirm: async () => {
        try {
          const r = await api.post('/students/bulk-trash', { ids: selected });
          if (r.data.success) { toast.success(r.data.message); setSelected([]); refresh(); }
        } catch { toast.error('Failed to trash'); }
      },
    });
  };

  const bulkRestore = () => {
    if (!selected.length) return;
    ask({
      title: 'Restore Students',
      message: `Restore ${selected.length} student(s)?`,
      confirmText: 'Restore',
      onConfirm: async () => {
        try {
          const r = await api.post('/students/bulk-restore', { ids: selected });
          if (r.data.success) { toast.success(r.data.message); setSelected([]); refresh(); }
        } catch { toast.error('Failed to restore'); }
      },
    });
  };

  const bulkForceDelete = () => {
    if (!selected.length) return;
    ask({
      title: 'Permanently Delete', danger: true,
      message: `Permanently erase ${selected.length} student(s)? This cannot be undone!`,
      confirmText: 'Delete Forever',
      onConfirm: async () => {
        try {
          const r = await api.post('/students/bulk-force-delete', { ids: selected });
          if (r.data.success) { toast.success(r.data.message); setSelected([]); refresh(); }
        } catch { toast.error('Failed'); }
      },
    });
  };

  // ─── Single Actions ────────────────────────────────────────────────────────
  const trashOne = (id: number) => ask({
    title: 'Move to Trash', danger: true,
    message: 'Move this student to trash? Can be restored later.',
    confirmText: 'Trash',
    onConfirm: async () => {
      try {
        await api.delete(`/students/${id}`);
        toast.success('Moved to trash'); refresh();
      } catch { toast.error('Failed'); }
    },
  });

  const restoreOne = async (id: number) => {
    try {
      const r = await api.post(`/students/${id}/restore`);
      if (r.data.success) { toast.success(r.data.message); refresh(); }
    } catch { toast.error('Failed to restore'); }
  };

  const forceDeleteOne = (id: number) => ask({
    title: 'Delete Permanently', danger: true,
    message: 'Permanently erase this student record and login? Irreversible!',
    confirmText: 'Delete Forever',
    onConfirm: async () => {
      try {
        const r = await api.delete(`/students/${id}/force`);
        if (r.data.success) { toast.success(r.data.message); refresh(); }
      } catch { toast.error('Failed'); }
    },
  });

  const toggleStatus = async (st: Student) => {
    try {
      const r = await api.patch(`/students/${st.id}/toggle-status`);
      if (r.data.success) {
        toast.success(r.data.message);
        setStudents(p => p.map(s => s.id === st.id
          ? { ...s, user: s.user ? { ...s.user, is_active: r.data.is_active } : s.user }
          : s));
        loadStats();
      }
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Failed'); }
  };



  // ─── CSV Import/Export ───
  const doExport = async () => {
    try {
      toast.loading('Preparing CSV…');
      const r = await api.get('/students/export', {
        params: { class_id: filterClass || undefined },
        responseType: 'blob',
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      a.download = `students_export_${Date.now()}.csv`;
      a.click();
      toast.dismiss();
      toast.success('Exported successfully!');
    } catch {
      toast.dismiss();
      toast.error('Export failed');
    }
  };

  const downloadSample = async () => {
    try {
      const r = await api.get('/students/sample', { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      a.download = 'students_sample_template.csv';
      a.click();
      toast.success('Sample template downloaded!');
    } catch {
      toast.error('Download failed');
    }
  };

  const submitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Select a CSV file first');
      return;
    }
    setImporting(true);
    setImportResult(null);
    setImportWarns([]);
    const fd = new FormData();
    fd.append('file', importFile);
    try {
      const r = await api.post('/students/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (r.data.success) {
        toast.success('Import completed!');
        setImportResult({ created: r.data.details.created, skipped: r.data.details.skipped });
        if (r.data.details.warnings?.length) {
          setImportWarns(r.data.details.warnings);
        }
        refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // ─── Helpers ───
  const pageNums = () => {
    if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', lastPage];
    if (page >= lastPage - 3) return [1, '…', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    return [1, '…', page - 1, page, page + 1, '…', lastPage];
  };



  return (
    <div className="space-y-3 text-xs bg-slate-50 min-h-screen p-4 rounded-xl">
      {confirm && <ConfirmDialog cfg={confirm} onClose={() => setConfirm(null)} />}


          {/* Header */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800 flex items-center gap-1.5">
            <GraduationCap className="text-blue-500" size={19} />
            Student Admission
          </h3>
          <p className="text-[12px] text-gray-500">Manage student registrations, enrolments, parents details and profile lifecycle</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex items-center gap-2">
            <div className="bg-slate-50 border border-slate-100 rounded px-2.5 py-0.5 text-center min-w-[60px]">
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400 text-center">Total</span>
              <span className="text-xs font-bold text-slate-700 text-center">{stats.total}</span>
            </div>
            <div className="bg-emerald-55/60 border border-emerald-100/80 rounded px-2.5 py-0.5 text-center min-w-[60px]">
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500 text-center">Active</span>
              <span className="text-xs font-bold text-emerald-700 text-center">{stats.active}</span>
            </div>
            <div className="bg-orange-55/60 border border-orange-100/80 rounded px-2.5 py-0.5 text-center min-w-[60px]">
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-orange-500 text-center">Inactive</span>
              <span className="text-xs font-bold text-slate-700 text-center">{stats.inactive}</span>
            </div>
            <div className="bg-red-55/60 border border-red-100/80 rounded px-2.5 py-0.5 text-center min-w-[60px]">
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-red-500 text-center">Trashed</span>
              <span className="text-xs font-bold text-slate-700 text-center">{stats.trashed}</span>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-xs">
        {/* Left side: Search input & filters */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {/* search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-400">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search name, roll, adm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadStudents()}
              className="pl-7 pr-6 h-7 w-36 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            />
            {search && <button className="absolute right-1.5 top-1.5 text-gray-400 hover:text-red-500" onClick={() => setSearch('')}><XCircle size={12} /></button>}
          </div>

          {/* Class Filter */}
          <div className="w-24">
            <Select
              options={classes}
              value={classes.find(c => String(c.value) === filterClass) || null}
              onChange={val => { setFilterClass(val ? String(val.value) : ''); setPage(1); }}
              placeholder="Classes"
              isClearable
              styles={compactSelectStyles}
              components={{ IndicatorSeparator: () => null, DropdownIndicator: () => null }}
            />
          </div>

          {/* Gender Filter */}
          <div className="w-20">
            <Select
              options={genders}
              value={genders.find(g => g.value === filterGender) || null}
              onChange={val => { setFilterGender(val ? String(val.value) : ''); setPage(1); }}
              placeholder="Genders"
              isClearable
              styles={compactSelectStyles}
              components={{ IndicatorSeparator: () => null, DropdownIndicator: () => null }}
            />
          </div>

          {/* Status filter */}
          <div className="w-20">
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
              value={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ].find(s => s.value === filterStatus) || null}
              onChange={val => { setFilterStatus(val ? String(val.value) : ''); setPage(1); }}
              placeholder="Status"
              isClearable
              styles={compactSelectStyles}
              components={{ IndicatorSeparator: () => null, DropdownIndicator: () => null }}
            />
          </div>

          {/* Limit selector */}
          <select
            className="h-7 border border-gray-300 rounded px-2 text-[11px] bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer"
            value={perPage}
            onChange={e => { setPerPage(+e.target.value); setPage(1); }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          {/* Trashed Switch */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-7">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Trashed</span>
            <button
              type="button"
              onClick={() => { setShowTrashed(prev => !prev); setPage(1); }}
              className={`relative inline-flex h-3.5 w-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {hasFilters && (
            <button className="text-red-500 hover:text-red-700 font-bold px-1 transition text-[11px]" onClick={resetFilters}>
              Clear
            </button>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 justify-end">
          <button className="h-7 flex items-center gap-1 px-2.5 border border-gray-300 text-gray-700 rounded bg-white hover:bg-gray-50 transition text-[11px] font-semibold whitespace-nowrap" onClick={downloadSample} title="Download Excel template">
            <Download size={12} /> Sample
          </button>
          <button className="h-7 flex items-center gap-1 px-2.5 border border-gray-300 text-gray-700 rounded bg-white hover:bg-gray-50 transition text-[11px] font-semibold whitespace-nowrap" onClick={() => { setImportOpen(true); setImportResult(null); setImportWarns([]); setImportFile(null); }}>
            <FileUp size={12} /> Import
          </button>
          <button className="h-7 flex items-center gap-1 px-2.5 border border-gray-300 text-gray-700 rounded bg-white hover:bg-gray-50 transition text-[11px] font-semibold whitespace-nowrap" onClick={doExport}>
            <Download size={12} /> Export
          </button>
          {!showTrashed && (
            <button className="h-7 flex items-center gap-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition shadow-sm text-[11px] whitespace-nowrap" onClick={() => navigate('/students/admission/new')}>
              <Plus size={13} /> Add New
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between animate-fade">
          <span className="text-blue-800 font-bold flex items-center gap-1.5">
            <Info size={14} /> {selected.length} items selected
          </span>
          <div className="flex gap-2">
            {!showTrashed ? (
              <>
                <button className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium cursor-pointer" onClick={() => bulkStatus('active')}>Active</button>
                <button className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded font-medium cursor-pointer" onClick={() => bulkStatus('inactive')}>Inactive</button>
                <button className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-medium cursor-pointer" onClick={bulkTrash}>Delete</button>
              </>
            ) : (
              <>
                <button className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium cursor-pointer" onClick={bulkRestore}>Restore</button>
                <button className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium cursor-pointer" onClick={bulkForceDelete}>Delete Permanently</button>
              </>
            )}
            <button className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium cursor-pointer" onClick={() => setSelected([])}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
        {showTrashed && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>You are viewing deleted students. You can restore them or permanently delete them below.</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <RefreshCw size={22} className="animate-spin inline-block mr-2" />
            <span>Loading registry…</span>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-gray-500 space-y-4">
            <GraduationCap size={44} className="mx-auto text-gray-300" />
            <h3 className="font-bold text-gray-700 text-sm">No students found</h3>
            <p className="text-gray-400 text-xs">Get started by creating a student or importing from an Excel/CSV file.</p>
            {!showTrashed && (
              <button
                className="px-4 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold rounded transition text-xs"
                onClick={() => navigate('/students/admission/new')}
              >
                Add your first student
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-semibold uppercase text-[9px] whitespace-nowrap">
                  <th className="py-2 px-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={selected.length === students.length && students.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3 h-3"
                    />
                  </th>
                  <th className="py-2 px-2.5">Admission No.</th>
                  <th className="py-2 px-2.5">Student Name</th>
                  <th className="py-2 px-2.5">Class / Section</th>
                  <th className="py-2 px-2.5">Roll No.</th>
                  <th className="py-2 px-2.5">Parent Details</th>
                  <th className="py-2 px-2.5">Admission Date</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5 text-right" style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => (
                  <tr key={st.id} className="border-b border-gray-100 hover:bg-slate-50/50 transition">
                    <td className="py-2 px-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(st.id)}
                        onChange={() => toggleOne(st.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3 h-3"
                      />
                    </td>
                    <td className="py-2 px-2.5 font-semibold text-gray-850">{st.admission_number}</td>
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] flex-shrink-0 ${st.gender === 'Female' ? 'bg-gradient-to-tr from-pink-500 to-rose-450' : 'bg-gradient-to-tr from-blue-500 to-indigo-450'}`}>
                          {st.full_name?.[0] ?? 'S'}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-800">{st.full_name}</div>
                          <div className="text-[10px] text-gray-400">{st.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2.5">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded mr-1">{st.class_name || 'N/A'}</span>
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded">{st.section || 'A'}</span>
                    </td>
                    <td className="py-2 px-2.5 text-gray-500">{st.roll_number || '—'}</td>
                    <td className="py-2 px-2.5">
                      <div className="font-medium text-gray-700">{st.father_name || '—'}</div>
                      <div className="text-[10px] text-gray-400">{st.father_mobile}</div>
                    </td>
                    <td className="py-2 px-2.5 text-gray-500">{st.admission_date ? new Date(st.admission_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-2 px-2.5">
                      {!showTrashed ? (
                        <button
                          onClick={() => toggleStatus(st)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition cursor-pointer hover:scale-[1.02] ${st.user?.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
                        >
                          {st.user?.is_active ? <><ToggleRight size={13} /> Active</> : <><ToggleLeft size={13} /> Inactive</>}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 font-bold rounded-full"><Trash2 size={11} /> Trashed</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {!showTrashed ? (
                          <>
                            <button className="w-6.5 h-6.5 border border-gray-200 bg-white rounded flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-gray-50 transition" title="View details" onClick={() => { setCurrent(st); setViewOpen(true); }}><Eye size={12} /></button>
                            <button className="w-6.5 h-6.5 border border-gray-200 bg-white rounded flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-gray-50 transition" title="Edit student" onClick={() => navigate(`/students/admission/edit/${st.id}`)}><Edit3 size={12} /></button>
                            <button className="w-6.5 h-6.5 border border-gray-200 bg-white rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition" title="Move to trash" onClick={() => trashOne(st.id)}><Trash2 size={12} /></button>
                          </>
                        ) : (
                          <>
                            <button className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded font-bold transition text-[10px]" onClick={() => restoreOne(st.id)}>Restore</button>
                            <button className="w-6.5 h-6.5 border border-gray-200 bg-white rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition" title="Delete forever" onClick={() => forceDeleteOne(st.id)}><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-slate-50">
            <button className="flex items-center gap-1 px-3 py-1 border border-gray-200 bg-white rounded text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={13} /> Prev</button>
            <div className="flex gap-1">
              {pageNums().map((n, i) =>
                n === '…'
                  ? <span key={i} className="px-2 py-1 text-gray-400">…</span>
                  : <button key={i} className={`w-7 h-7 flex items-center justify-center border rounded font-semibold text-xs transition ${n === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`} onClick={() => setPage(n as number)}>{n}</button>
              )}
            </div>
            <button className="flex items-center gap-1 px-3 py-1 border border-gray-200 bg-white rounded text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={13} /></button>
          </div>
        )}
        {!loading && total > 0 && (
          <div className="text-center py-2 text-[10px] text-gray-400 font-medium bg-slate-50 border-t border-gray-100">
            Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total} student registrations
          </div>
        )}
      </div>


      {/* ─── DETAIL VIEW MODAL ─── */}
      {viewOpen && current && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade" style={{ zIndex: 1100 }}>
          <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-lg max-h-[85vh] overflow-hidden border border-gray-200 animate-up">

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-800 text-[13px]">Student Registration Details</h3>
              <button className="text-gray-400 hover:text-red-500" onClick={() => setViewOpen(false)}><XCircle size={18} /></button>
            </div>

            {/* Profile body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <span className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xl ${current.gender === 'Female' ? 'bg-gradient-to-tr from-pink-500 to-rose-400' : 'bg-gradient-to-tr from-blue-500 to-indigo-400'}`}>
                  {current.full_name?.[0] ?? 'S'}
                </span>
                <div>
                  <h4 className="font-extrabold text-base text-gray-800">{current.full_name}</h4>
                  <p className="text-xs text-gray-500">{current.user?.email}</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${current.user?.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {current.user?.is_active ? <><CheckCircle2 size={11} /> Active Enrolment</> : <><XCircle size={11} /> Inactive</>}
                  </span>
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {[
                  ['Student ID', current.student_id || '—'],
                  ['Admission Number', current.admission_number],
                  ['Class & Section', `${current.class_name || 'N/A'} - ${current.section || 'A'}`],
                  ['Roll Number', current.roll_number || 'Not assigned'],
                  ['Admission Date', current.admission_date ? new Date(current.admission_date).toLocaleDateString('en-IN') : '—'],
                  ['Academic Year', current.academic_year || '—'],
                  ['Admission Type', current.admission_type_label || '—'],
                  ['Admission Category', current.admission_category_label || '—'],
                  ['PEN Number', current.pen_number || '—'],
                  ['APAAR ID', current.apaar_id || '—'],
                  ['Nationality', current.nationality || 'Indian'],
                  ['Mother Tongue', current.mother_tongue || '—'],
                  ['Religion', current.religion || '—'],
                  ['Category', current.category || 'General'],
                  ['Student Status', current.student_status_label || 'Active'],
                  ['Mobile Number', current.user?.mobile || '—'],
                  ['Gender', current.gender || '—'],
                  ['Aadhaar Number', current.aadhaar_number ? (current.aadhaar_number.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') ?? current.aadhaar_number) : '—'],
                  ['Blood Group', current.blood_group || '—'],
                  ["Father's Name", current.father_name || '—'],
                  ["Father's Contact", current.father_mobile || '—'],
                  ["Mother's Name", current.mother_name || '—'],
                  ["Mother's Contact", current.mother_mobile || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="space-y-0.5">
                    <label className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
                    <div className="font-semibold text-gray-700 text-xs">{val}</div>
                  </div>
                ))}

                {/* Full address span */}
                <div className="col-span-2 space-y-2 border-t border-slate-50 pt-2">
                  <div>
                    <label className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide block">Temporary / Current Address</label>
                    <div className="font-semibold text-gray-700 text-xs">{current.user?.address ? `${current.user.address}, ${current.user.city || ''}, ${current.user.state || ''} - ${current.user.pincode || ''}` : '—'}</div>
                  </div>
                  <div className="pt-1.5 border-t border-dashed border-slate-100">
                    <label className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide block">Permanent Address</label>
                    <div className="font-semibold text-gray-700 text-xs">
                      {current.same_as_temporary 
                        ? <span className="text-[10px] text-gray-400 font-bold italic">Same as temporary address</span>
                        : current.permanent_address_line1 
                          ? `${current.permanent_address_line1}, ${current.permanent_city || ''}, ${current.permanent_state || ''} - ${current.permanent_pincode || ''}`
                          : '—'
                      }
                    </div>
                  </div>
                </div>

                {/* Previous school details */}
                {current.previous_school && (
                  <div className="col-span-2 space-y-2 border-t border-slate-50 pt-2">
                    <label className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide">Previous School History</label>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <div className="col-span-2">
                        <span className="text-[9px] text-gray-400 block font-bold">SCHOOL NAME</span>
                        <span className="font-semibold text-gray-700">{current.previous_school}</span>
                      </div>
                      {current.previous_school_address && (
                        <div className="col-span-2">
                          <span className="text-[9px] text-gray-400 block font-bold">SCHOOL ADDRESS</span>
                          <span className="font-semibold text-gray-700">{current.previous_school_address}</span>
                        </div>
                      )}
                      {(current.previous_school_city || current.previous_school_state) && (
                        <div>
                          <span className="text-[9px] text-gray-400 block font-bold">CITY / STATE</span>
                          <span className="font-semibold text-gray-700">{`${current.previous_school_city || ''}, ${current.previous_school_state || ''}`}</span>
                        </div>
                      )}
                      {current.previous_udise_code && (
                        <div>
                          <span className="text-[9px] text-gray-400 block font-bold">UDISE CODE</span>
                          <span className="font-semibold text-gray-700">{current.previous_udise_code}</span>
                        </div>
                      )}
                      {(current.previous_reason_leaving_label || current.previous_reason_leaving) && (
                        <div>
                          <span className="text-[9px] text-gray-400 block font-bold">REASON FOR LEAVING</span>
                          <span className="font-semibold text-gray-700">
                            {current.previous_reason_leaving_label === 'Other' && current.previous_reason_leaving_custom
                              ? `${current.previous_reason_leaving_label} (${current.previous_reason_leaving_custom})`
                              : (current.previous_reason_leaving_label || current.previous_reason_leaving)}
                          </span>
                        </div>
                      )}
                      {current.previous_admission_number && (
                        <div>
                          <span className="text-[9px] text-gray-400 block font-bold">PREVIOUS ADMISSION NO.</span>
                          <span className="font-semibold text-gray-700">{current.previous_admission_number}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] text-gray-400 block font-bold">CLASS STANDARD</span>
                        <span className="font-semibold text-gray-700">{current.previous_class || '—'}</span>
                      </div>
                      {current.previous_board && (
                        <div>
                          <span className="text-[9px] text-gray-400 block font-bold">BOARD / UNIVERSITY</span>
                          <span className="font-semibold text-gray-700">{current.previous_board}</span>
                        </div>
                      )}
                      {current.previous_passing_year && (
                        <div>
                          <span className="text-[9px] text-gray-400 block font-bold">PASSING YEAR</span>
                          <span className="font-semibold text-gray-700">{current.previous_passing_year}</span>
                        </div>
                      )}
                      {current.previous_grade && (
                        <div>
                          <span className="text-[9px] text-gray-400 block font-bold">MARKS / GRADE</span>
                          <span className="font-semibold text-gray-700">{current.previous_grade}</span>
                        </div>
                      )}
                      {current.previous_tc_number && (
                        <div>
                          <span className="text-[9px] text-gray-400 block font-bold">TC NUMBER</span>
                          <span className="font-semibold text-gray-700">{current.previous_tc_number}</span>
                        </div>
                      )}
                      {current.previous_tc_date && (
                        <div className="col-span-2">
                          <span className="text-[9px] text-gray-400 block font-bold">TC ISSUE DATE</span>
                          <span className="font-semibold text-gray-700">{new Date(current.previous_tc_date).toLocaleDateString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Facilities */}
                {(current.transport_required || current.hostel_required) && (
                  <div className="col-span-2 space-y-0.5 border-t border-slate-55 pt-2">
                    <label className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide">Enrolled Services</label>
                    <div className="flex gap-2 mt-1">
                      {current.transport_required && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded font-semibold text-[10px]">🚌 Bus Route: {current.transport_route || 'Default'}</span>}
                      {current.hostel_required && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded font-semibold text-[10px]">🏠 Hostel Room: {current.room_number || 'Default'}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-slate-50 flex justify-end gap-2">
              <button className="px-3.5 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition" onClick={() => setViewOpen(false)}>Close</button>
              <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition" onClick={() => { setViewOpen(false); navigate(`/students/admission/edit/${current.id}`); }}>Edit Profile</button>
            </div>

          </div>
        </div>
      )}

      {/* ─── BATCH IMPORT MODAL ─── */}
      {importOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade" style={{ zIndex: 1100 }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-up">
            <div className="px-5 py-3.5 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-800 text-[13px]">Batch Import Students</h3>
              <button className="text-gray-400 hover:text-red-500" onClick={() => setImportOpen(false)}><XCircle size={18} /></button>
            </div>
            <form onSubmit={submitImport} className="p-5 space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100/50 hover:border-blue-400 transition cursor-pointer relative" onClick={() => fileRef.current?.click()}>
                <FileUp size={34} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-bold text-gray-700">Drag and drop or select CSV file</p>
                <p className="text-[10px] text-gray-400 mt-1">Accepts CSV files conforming to standard template</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                {importFile && <div className="mt-3 font-semibold text-blue-600 text-xs">📄 {importFile.name}</div>}
              </div>

              <button type="button" className="w-full flex justify-center items-center gap-1.5 py-1.5 border border-gray-200 text-gray-700 rounded hover:bg-gray-50 text-xs font-medium" onClick={downloadSample}>
                <Download size={13} /> Download Sample CSV Template
              </button>

              {importResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-around text-xs font-bold text-emerald-800">
                  <span>✓ Created: {importResult.created}</span>
                  <span>⊘ Skipped: {importResult.skipped}</span>
                </div>
              )}

              {importWarns.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-lg max-h-32 overflow-y-auto text-xs text-red-700">
                  <p className="font-bold mb-1">⚠ Import Warnings:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importWarns.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                    {importWarns.length > 5 && <li>…and {importWarns.length - 5} more.</li>}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-3.5 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition" onClick={() => setImportOpen(false)}>Close</button>
                <button type="submit" disabled={importing || !importFile} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50">
                  {importing ? 'Processing…' : 'Process Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

