import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  GraduationCap,
  Search,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Archive,
  BookOpen,
  Award,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

/* ═══════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════ */
interface Qualification {
  id: number;
  school_id: number;
  name: string;
  code: string | null;
  degree_type: string;
  level: string;
  field_of_study: string | null;
  university_board: string | null;
  duration_years: number | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  deleted_at?: string | null;
}

const DEGREE_TYPES = [
  { value: 'degree', label: 'Degree' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

const LEVELS = [
  { value: 'secondary', label: 'Secondary (10th)' },
  { value: 'senior_secondary', label: 'Senior Secondary (12th)' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'professional', label: 'Professional' },
];

const LEVEL_COLORS: Record<string, string> = {
  secondary: 'bg-slate-100 text-slate-700',
  senior_secondary: 'bg-blue-50 text-blue-700 border-blue-100',
  graduate: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  postgraduate: 'bg-violet-50 text-violet-700 border-violet-100',
  doctorate: 'bg-amber-50 text-amber-700 border-amber-100',
  professional: 'bg-rose-50 text-rose-700 border-rose-100',
};

const DEGREE_TYPE_COLORS: Record<string, string> = {
  degree: 'bg-sky-50 text-sky-700 border-sky-100',
  diploma: 'bg-orange-50 text-orange-700 border-orange-100',
  certificate: 'bg-teal-50 text-teal-700 border-teal-100',
  doctorate: 'bg-purple-50 text-purple-700 border-purple-100',
  other: 'bg-slate-100 text-slate-600',
};

const PAGE_SIZE = 10;

export default function QualificationManagement() {
  const [items, setItems]           = useState<Qualification[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [alert, setAlert]           = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [search, setSearch]         = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]             = useState(1);

  // View mode
  const [showTrashed, setShowTrashed] = useState(false);

  // Selection for bulk ops
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Qualification | null>(null);
  const [deleteItem, setDeleteItem] = useState<Qualification | null>(null);
  const [deleting, setDeleting]     = useState(false);

  // Form
  const [form, setForm] = useState({
    name: '', code: '', degree_type: 'degree', level: 'graduate',
    field_of_study: '', university_board: '', duration_years: '',
    description: '', is_active: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlertMsg = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (showTrashed) params.only_trashed = true;
      const res = await api.get('/school/qualifications', { params });
      if (res.data.success) setItems(res.data.data || []);
    } catch {
      showAlertMsg('err', 'Failed to load qualifications');
    } finally {
      setLoading(false);
    }
  }, [showAlertMsg, showTrashed]);

  useEffect(() => { fetchItems(); setSelectedIds(new Set()); setPage(1); }, [fetchItems]);

  /* ════════ FORM HELPERS ════════ */
  const resetForm = () => setForm({
    name: '', code: '', degree_type: 'degree', level: 'graduate',
    field_of_study: '', university_board: '', duration_years: '',
    description: '', is_active: true,
  });

  const openAdd = () => { setEditingItem(null); resetForm(); setShowModal(true); };

  const openEdit = (q: Qualification) => {
    setEditingItem(q);
    setForm({
      name: q.name, code: q.code || '', degree_type: q.degree_type, level: q.level,
      field_of_study: q.field_of_study || '', university_board: q.university_board || '',
      duration_years: q.duration_years?.toString() || '', description: q.description || '',
      is_active: q.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { showAlertMsg('err', 'Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code || null,
        degree_type: form.degree_type,
        level: form.level,
        field_of_study: form.field_of_study || null,
        university_board: form.university_board || null,
        duration_years: form.duration_years ? parseInt(form.duration_years) : null,
        description: form.description || null,
        is_active: form.is_active,
      };
      if (editingItem) {
        const res = await api.put(`/school/qualifications/${editingItem.id}`, payload);
        if (res.data.success) showAlertMsg('ok', 'Qualification updated');
      } else {
        const res = await api.post('/school/qualifications', payload);
        if (res.data.success) showAlertMsg('ok', 'Qualification created');
      }
      setShowModal(false);
      fetchItems();
    } catch (err: any) {
      showAlertMsg('err', err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (q: Qualification) => {
    try {
      const res = await api.patch(`/school/qualifications/${q.id}/toggle-status`);
      if (res.data.success) { showAlertMsg('ok', 'Status updated'); fetchItems(); }
    } catch { showAlertMsg('err', 'Failed to toggle status'); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/school/qualifications/${deleteItem.id}`);
      if (res.data.success) { showAlertMsg('ok', 'Qualification deleted'); setShowDeleteModal(false); fetchItems(); }
    } catch { showAlertMsg('err', 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await api.post(`/school/qualifications/${id}/restore`);
      if (res.data.success) { showAlertMsg('ok', 'Restored'); fetchItems(); }
    } catch { showAlertMsg('err', 'Restore failed'); }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this qualification? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/school/qualifications/${id}/force`);
      if (res.data.success) { showAlertMsg('ok', 'Permanently deleted'); fetchItems(); }
    } catch { showAlertMsg('err', 'Failed to permanently delete'); }
  };

  /* ════════ BULK OPS ════════ */
  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(i => i.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const bulkStatusUpdate = async (status: 'active' | 'inactive') => {
    if (selectedIds.size === 0) return;
    try {
      const res = await api.post('/school/qualifications/bulk-status', { status, ids: Array.from(selectedIds) });
      if (res.data.success) { showAlertMsg('ok', res.data.message); setSelectedIds(new Set()); fetchItems(); }
    } catch { showAlertMsg('err', 'Bulk status update failed'); }
  };

  const bulkDelete = async (force = false) => {
    if (selectedIds.size === 0) return;
    const msg = force ? 'Permanently delete selected?' : 'Delete selected qualifications?';
    if (!confirm(msg)) return;
    try {
      const res = await api.post('/school/qualifications/bulk-delete', { ids: Array.from(selectedIds), force });
      if (res.data.success) { showAlertMsg('ok', res.data.message); setSelectedIds(new Set()); fetchItems(); }
    } catch { showAlertMsg('err', 'Bulk delete failed'); }
  };

  const bulkRestore = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await api.post('/school/qualifications/bulk-restore', { ids: Array.from(selectedIds) });
      if (res.data.success) { showAlertMsg('ok', res.data.message); setSelectedIds(new Set()); fetchItems(); }
    } catch { showAlertMsg('err', 'Bulk restore failed'); }
  };

  /* ════════ EXCEL ════════ */
  const exportExcel = () => {
    const data = items.map(q => ({
      'Name': q.name, 'Code': q.code || '', 'Degree Type': q.degree_type,
      'Level': q.level, 'Field of Study': q.field_of_study || '',
      'University/Board': q.university_board || '', 'Duration (Years)': q.duration_years ?? '',
      'Description': q.description || '', 'Status': q.is_active ? 'Active' : 'Inactive',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Qualifications');
    XLSX.writeFile(wb, 'qualifications_export.xlsx');
    showAlertMsg('ok', 'Exported successfully');
  };

  const downloadTemplate = () => {
    const template = [
      { Name: 'B.Ed', Code: 'BED', 'Degree Type': 'degree', Level: 'graduate', 'Field of Study': 'Education', 'University/Board': 'Delhi University', 'Duration (Years)': 2, Description: 'Bachelor of Education' },
      { Name: 'M.Sc Mathematics', Code: 'MSC-MATH', 'Degree Type': 'degree', Level: 'postgraduate', 'Field of Study': 'Mathematics', 'University/Board': 'JNU', 'Duration (Years)': 2, Description: '' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'qualifications_template.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (rows.length === 0) { showAlertMsg('err', 'No data found in file'); return; }

        const degreeTypeMap: Record<string, string> = { degree: 'degree', diploma: 'diploma', certificate: 'certificate', doctorate: 'doctorate', other: 'other' };
        const levelMap: Record<string, string> = { secondary: 'secondary', senior_secondary: 'senior_secondary', graduate: 'graduate', postgraduate: 'postgraduate', doctorate: 'doctorate', professional: 'professional' };

        const qualifications = rows.map(r => ({
          name: r['Name'] || r['name'] || '',
          code: r['Code'] || r['code'] || null,
          degree_type: degreeTypeMap[(r['Degree Type'] || r['degree_type'] || 'degree').toLowerCase()] || 'degree',
          level: levelMap[(r['Level'] || r['level'] || 'graduate').toLowerCase()] || 'graduate',
          field_of_study: r['Field of Study'] || r['field_of_study'] || null,
          university_board: r['University/Board'] || r['university_board'] || null,
          duration_years: parseInt(r['Duration (Years)'] || r['duration_years']) || null,
          description: r['Description'] || r['description'] || null,
        })).filter(q => q.name);

        const res = await api.post('/school/qualifications/bulk-import', { qualifications });
        if (res.data.success) { showAlertMsg('ok', res.data.message); fetchItems(); }
      } catch (err: any) {
        showAlertMsg('err', err.response?.data?.message || 'Import failed');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ════════ FILTER + PAGINATE ════════ */
  const filtered = items.filter(q => {
    const matchesSearch = !search ||
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      (q.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.field_of_study || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.university_board || '').toLowerCase().includes(search.toLowerCase());
    const matchesLevel = !filterLevel || q.level === filterLevel;
    const matchesType = !filterType || q.degree_type === filterType;
    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = q.is_active;
    else if (filterStatus === 'inactive') matchesStatus = !q.is_active;
    return matchesSearch && matchesLevel && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const levelLabel = (val: string) => LEVELS.find(l => l.value === val)?.label || val;
  const degreeLabel = (val: string) => DEGREE_TYPES.find(d => d.value === val)?.label || val;

  return (
    <div className="space-y-6">
      {alert && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${alert.type === 'err' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          <span className="text-sm">{alert.type === 'err' ? '⚠️' : '✅'}</span><span>{alert.msg}</span>
        </div>
      )}

      {/* ════════════ HEADER ════════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-violet-50 text-violet-600 rounded-lg"><GraduationCap className="w-5 h-5" /></span>
            <span>Qualifications & Degrees</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Manage qualification master records — degrees, diplomas, certificates, and professional courses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setShowTrashed(!showTrashed); }} className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition border ${showTrashed ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Archive className="w-3.5 h-3.5" /><span>{showTrashed ? 'Show Active' : 'Trashed'}</span>
          </button>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <FileSpreadsheet className="w-3.5 h-3.5" /><span>Template</span>
          </button>
          <label className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" /><span>Import</span>
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
          </label>
          <button onClick={exportExcel} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <Download className="w-3.5 h-3.5" /><span>Export</span>
          </button>
          <button onClick={fetchItems} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {!showTrashed && (
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /><span>Add Qualification</span>
            </button>
          )}
        </div>
      </div>

      {/* ════════════ METRIC CARDS ════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: GraduationCap, label: 'Total', value: items.length, bg: 'bg-violet-50', text: 'text-violet-600' },
          { icon: Check, label: 'Active', value: items.filter(i => i.is_active).length, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { icon: X, label: 'Inactive', value: items.filter(i => !i.is_active).length, bg: 'bg-rose-50', text: 'text-rose-600' },
          { icon: BookOpen, label: 'Degrees', value: items.filter(i => i.degree_type === 'degree').length, bg: 'bg-sky-50', text: 'text-sky-600' },
          { icon: Award, label: 'Diplomas', value: items.filter(i => i.degree_type === 'diploma').length, bg: 'bg-orange-50', text: 'text-orange-600' },
          { icon: GraduationCap, label: 'Doctorate', value: items.filter(i => i.degree_type === 'doctorate').length, bg: 'bg-amber-50', text: 'text-amber-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-3 rounded-xl border border-slate-200/85 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{s.label}</span>
                <span className="text-lg font-bold text-slate-800 mt-0.5 block">{s.value}</span>
              </div>
              <div className={`p-2 rounded-lg ${s.bg} ${s.text}`}><Icon className="w-3.5 h-3.5" /></div>
            </div>
          );
        })}
      </div>

      {/* ════════════ CONTROLS ════════════ */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 shadow-sm"
            placeholder="Search by name, code, field of study, university..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="w-full sm:w-36 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-500 shadow-sm cursor-pointer"
            value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(1); }}>
            <option value="">All Levels</option>
            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select className="w-full sm:w-32 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-500 shadow-sm cursor-pointer"
            value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {DEGREE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          {!showTrashed && (
            <select className="w-full sm:w-28 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-violet-500 shadow-sm cursor-pointer"
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
        </div>
      </div>

      {/* ════════════ BULK ACTIONS BAR ════════════ */}
      {selectedIds.size > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-violet-700">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-violet-200" />
          {showTrashed ? (
            <>
              <button onClick={bulkRestore} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Restore</button>
              <button onClick={() => bulkDelete(true)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Permanent Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => bulkStatusUpdate('active')} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"><ToggleRight className="w-3 h-3" /> Activate</button>
              <button onClick={() => bulkStatusUpdate('inactive')} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition flex items-center gap-1"><ToggleLeft className="w-3 h-3" /> Deactivate</button>
              <button onClick={() => bulkDelete(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
            </>
          )}
          <button onClick={() => setSelectedIds(new Set())} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-white transition"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ════════════ TABLE ════════════ */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin" /></div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3"><GraduationCap className="w-6 h-6" /></div>
          <h3 className="text-sm font-bold text-slate-800">{items.length === 0 ? (showTrashed ? 'No trashed qualifications' : 'No qualifications added yet') : 'No matching qualifications found'}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{items.length === 0 && !showTrashed ? 'Click "Add Qualification" to create the first record' : 'Try adjusting your search or filters'}</p>
          {items.length === 0 && !showTrashed && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /><span>Add First Qualification</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-3 w-10">
                    <input type="checkbox" className="rounded border-slate-300" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} />
                  </th>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Qualification</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Degree Type</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Field of Study</th>
                  <th className="py-3 px-4">University / Board</th>
                  <th className="py-3 px-4">Duration</th>
                  {!showTrashed && <th className="py-3 px-4 text-center">Status</th>}
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {paginated.map((q, idx) => (
                  <tr key={q.id} className={`hover:bg-slate-50/30 transition-colors ${selectedIds.has(q.id) ? 'bg-violet-50/40' : ''}`}>
                    <td className="py-3 px-3">
                      <input type="checkbox" className="rounded border-slate-300" checked={selectedIds.has(q.id)} onChange={() => toggleSelect(q.id)} />
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-semibold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{q.name}</span>
                      {q.description && <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[180px]">{q.description}</span>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{q.code || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${DEGREE_TYPE_COLORS[q.degree_type] || DEGREE_TYPE_COLORS.other}`}>
                        {degreeLabel(q.degree_type)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${LEVEL_COLORS[q.level] || LEVEL_COLORS.secondary}`}>
                        {levelLabel(q.level)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{q.field_of_study || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{q.university_board || '—'}</td>
                    <td className="py-3 px-4 text-violet-600 font-bold">{q.duration_years ? `${q.duration_years} Yr${q.duration_years > 1 ? 's' : ''}` : '—'}</td>
                    {!showTrashed && (
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${q.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          {q.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {showTrashed ? (
                          <>
                            <button onClick={() => handleRestore(q.id)} className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleForceDelete(q.id)} className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition" title="Permanently Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEdit(q)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600 transition" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleToggleStatus(q)} className={`p-1 hover:bg-slate-100 rounded transition ${q.is_active ? 'text-slate-400 hover:text-rose-600' : 'text-slate-400 hover:text-emerald-600'}`} title={q.is_active ? 'Deactivate' : 'Activate'}>
                              {q.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => { setDeleteItem(q); setShowDeleteModal(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} qualifications
            </span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1).map((pg, idx, arr) => {
                const prev = arr[idx - 1]; const showEllipsis = prev && pg - prev > 1;
                return (<React.Fragment key={pg}>{showEllipsis && <span className="text-slate-400 px-1 text-xs">...</span>}<button className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${pg === page ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={() => setPage(pg)}>{pg}</button></React.Fragment>);
              })}
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ ADD/EDIT MODAL ════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-violet-600" />
                {editingItem ? 'Edit Qualification' : 'Add Qualification'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qualification Name <span className="text-rose-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="e.g. Bachelor of Education (B.Ed)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Code</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="e.g. BED" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Degree Type <span className="text-rose-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-500 cursor-pointer"
                    value={form.degree_type} onChange={e => setForm(p => ({ ...p, degree_type: e.target.value }))} required>
                    {DEGREE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Level <span className="text-rose-500">*</span></label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-500 cursor-pointer"
                    value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} required>
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Field of Study</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="e.g. Education, Mathematics, Computer Science" value={form.field_of_study} onChange={e => setForm(p => ({ ...p, field_of_study: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">University / Board</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="e.g. Delhi University, CBSE" value={form.university_board} onChange={e => setForm(p => ({ ...p, university_board: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration (Years)</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    min="0" max="10" placeholder="e.g. 2" value={form.duration_years} onChange={e => setForm(p => ({ ...p, duration_years: e.target.value }))} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                    <span className="text-xs font-semibold text-slate-700">Active</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    rows={2} placeholder="Brief description of this qualification..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shadow-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editingItem ? 'Update' : 'Add Qualification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ DELETE MODAL ════════════ */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-sm font-bold text-slate-800">Delete Qualification</h3>
              <p className="text-xs text-slate-500 mt-2">Are you sure you want to delete <strong className="text-slate-700">{deleteItem.name}</strong>?</p>
              <p className="text-[10px] text-slate-400 mt-1">It will be moved to trash and can be restored later.</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-150 rounded-lg transition" disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
