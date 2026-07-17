import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  ClipboardList, Plus, Search, Edit3, Trash2, RotateCcw,
  Upload, Download, FileSpreadsheet, Loader2, AlertCircle,
  CheckSquare, X, ChevronUp, ChevronDown
} from 'lucide-react';
import Select from 'react-select';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface ExamType {
  id: number;
  school_id: number;
  name: string;
  code: string | null;
  description: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  deleted_at?: string | null;
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
    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1
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
    borderColor: s.isFocused ? '#9333ea' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(147,51,234,0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#fff',
    '&:hover': { borderColor: s.isFocused ? '#9333ea' : '#d1d5db' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '28px', display: 'flex', alignItems: 'center' }),
  input: (b: any) => ({ ...b, margin: '0', padding: '0', fontSize: '11px' }),
  placeholder: (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '26px' }),
  option: (b: any, s: any) => ({
    ...b,
    backgroundColor: s.isSelected ? '#9333ea' : s.isFocused ? '#f3f4f6' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
    fontSize: '11px',
    padding: '6px 8px',
    cursor: 'pointer',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 9999 }),
};

/* ─────────────────────────────────────────────────────────────
   EMPTY FORM
───────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  duration_minutes: '' as string | number,
  is_active: true,
  display_order: 0,
};

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function ExamTypeManager() {
  /* ── data ── */
  const [items, setItems] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── filters ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ── sorting ── */
  const [sortField, setSortField] = useState('display_order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* ── selection ── */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  /* ── modal ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamType | null>(null);
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });
  const [formSaving, setFormSaving] = useState(false);

  /* ── import modal ── */
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  /* ════════════════ FETCH ════════════════ */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/exam-types', {
        params: { trashed: showTrashed ? '1' : '0' },
      });
      if (res.data.success) setItems(res.data.data || []);
    } catch {
      toast.error('Failed to load exam types');
    }
    setLoading(false);
  }, [showTrashed]);

  useEffect(() => { fetchData(); setSelectedIds([]); }, [fetchData]);

  /* ════════════════ FILTER & SORT ════════════════ */
  const filtered = useMemo(() => {
    let arr = [...items];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.code || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== '') {
      arr = arr.filter(i => i.is_active === (filterStatus === '1'));
    }
    arr.sort((a: any, b: any) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [items, searchTerm, filterStatus, sortField, sortDir]);

  const totalPages = useMemo(() => itemsPerPage === -1 ? 1 : Math.ceil(filtered.length / itemsPerPage), [filtered, itemsPerPage]);
  const paginated = useMemo(() => {
    if (itemsPerPage === -1) return filtered;
    const s = (currentPage - 1) * itemsPerPage;
    return filtered.slice(s, s + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  /* ════════════════ SORT HANDLER ════════════════ */
  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-0.5">↕</span>;
    return sortDir === 'asc'
      ? <ChevronUp className="inline w-3 h-3 ml-0.5 text-purple-600" />
      : <ChevronDown className="inline w-3 h-3 ml-0.5 text-purple-600" />;
  };

  /* ════════════════ SELECTION ════════════════ */
  const isAllSelected = paginated.length > 0 && paginated.every(r => selectedIds.includes(r.id));
  const handleSelectAll = () => isAllSelected ? setSelectedIds([]) : setSelectedIds(paginated.map(r => r.id));
  const handleSelectRow = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /* ════════════════ STATS ════════════════ */
  const activeCount = useMemo(() => items.filter(i => i.is_active).length, [items]);
  const inactiveCount = useMemo(() => items.filter(i => !i.is_active).length, [items]);

  /* ════════════════ CRUD ════════════════ */
  const openAdd = () => { setEditingItem(null); setFormData({ ...EMPTY_FORM }); setIsModalOpen(true); };
  const openEdit = (item: ExamType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code || '',
      description: item.description || '',
      duration_minutes: item.duration_minutes ?? '',
      is_active: item.is_active,
      display_order: item.display_order,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    setFormSaving(true);
    try {
      const payload = {
        ...formData,
        duration_minutes: formData.duration_minutes !== '' ? Number(formData.duration_minutes) : null,
        display_order: Number(formData.display_order) || 0,
      };
      if (editingItem) {
        await api.put(`/school/exam-types/${editingItem.id}`, payload);
        toast.success('Exam type updated');
      } else {
        await api.post('/school/exam-types', payload);
        toast.success('Exam type created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    }
    setFormSaving(false);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/school/exam-types/${id}/toggle-status`);
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i));
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Move this exam type to trash?')) return;
    try {
      await api.delete(`/school/exam-types/${id}`);
      toast.success('Moved to trash');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/exam-types/${id}/restore`);
      toast.success('Restored');
      fetchData();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this exam type? This cannot be undone.')) return;
    try {
      await api.delete(`/school/exam-types/${id}/force`);
      toast.success('Permanently deleted');
      fetchData();
    } catch { toast.error('Force delete failed'); }
  };

  /* ════════════════ BULK ACTIONS ════════════════ */
  const handleBulkStatus = async (status: boolean) => {
    if (!selectedIds.length) { toast.error('No records selected'); return; }
    try {
      await api.post('/school/exam-types/bulk-status', { ids: selectedIds, is_active: status });
      toast.success(`${selectedIds.length} record(s) ${status ? 'activated' : 'deactivated'}`);
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk status failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) { toast.error('No records selected'); return; }
    if (!window.confirm(`Move ${selectedIds.length} record(s) to trash?`)) return;
    try {
      await api.post('/school/exam-types/bulk-delete', { ids: selectedIds });
      toast.success('Moved to trash');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) { toast.error('No records selected'); return; }
    try {
      await api.post('/school/exam-types/bulk-restore', { ids: selectedIds });
      toast.success('Restored');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk restore failed'); }
  };

  const handleBulkForceDelete = async () => {
    if (!selectedIds.length) { toast.error('No records selected'); return; }
    if (!window.confirm(`Permanently delete ${selectedIds.length} record(s)? This cannot be undone.`)) return;
    try {
      await api.post('/school/exam-types/bulk-delete', { ids: selectedIds, force: true });
      toast.success('Permanently deleted');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk force delete failed'); }
  };

  /* ════════════════ EXPORT ════════════════ */
  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Exam Types');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 6 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Code', key: 'code', width: 14 },
      { header: 'Duration (Min)', key: 'duration_minutes', width: 16 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Display Order', key: 'display_order', width: 14 },
      { header: 'Status', key: 'status', width: 12 },
    ];
    // Header style
    const headerRow = sheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 22;

    filtered.forEach(row => {
      sheet.addRow({
        id: row.id,
        name: row.name,
        code: row.code || '',
        duration_minutes: row.duration_minutes ?? '',
        description: row.description || '',
        display_order: row.display_order,
        status: row.is_active ? 'Active' : 'Inactive',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'exam_types_export.xlsx');
    toast.success('Exported successfully');
  };

  /* ════════════════ SAMPLE TEMPLATE ════════════════ */
  const handleSampleDownload = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Exam Types Import');
    sheet.columns = [
      { header: 'name *', key: 'name', width: 28 },
      { header: 'code', key: 'code', width: 14 },
      { header: 'duration_minutes', key: 'duration_minutes', width: 18 },
      { header: 'description', key: 'description', width: 40 },
      { header: 'display_order', key: 'display_order', width: 14 },
      { header: 'status (active/inactive)', key: 'status', width: 24 },
    ];
    const headerRow = sheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 22;

    // Sample rows
    [
      ['Quarterly Exam', 'QTR', 180, 'Quarterly assessment for all classes', 1, 'active'],
      ['Half Yearly', 'HLF', 180, 'Mid-year examination', 2, 'active'],
      ['Annual Exam', 'ANN', 240, 'End of year final exam', 3, 'active'],
      ['Pre Board', 'PRE', 180, 'Preparatory exam before board exams', 4, 'active'],
      ['Unit Test', 'UNT', 60, 'Short unit-level test', 5, 'active'],
    ].forEach(row => sheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'exam_types_import_template.xlsx');
    toast.success('Sample template downloaded');
  };

  /* ════════════════ IMPORT ════════════════ */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
      setImportRows(rows);
      setIsImportOpen(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleImportSubmit = async () => {
    if (!importRows.length) { toast.error('No rows to import'); return; }
    setImporting(true);
    try {
      const rows = importRows.map(r => ({
        name: String(r['name *'] || r['name'] || '').trim(),
        code: String(r['code'] || '').trim(),
        duration_minutes: r['duration_minutes'] || null,
        description: String(r['description'] || '').trim(),
        display_order: r['display_order'] || 0,
        status: String(r['status (active/inactive)'] || r['status'] || 'active').trim(),
      }));
      const res = await api.post('/school/exam-types/bulk-import', { rows });
      if (res.data.success) {
        toast.success(res.data.message);
        if (res.data.errors?.length) {
          res.data.errors.forEach((err: string) => toast.error(err, { duration: 4000 }));
        }
        setIsImportOpen(false);
        setImportRows([]);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    }
    setImporting(false);
  };

  /* ════════════════ PAGINATION HELPERS ════════════════ */
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="space-y-3 text-xs text-gray-700">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800">Exam Type Management</h3>
            <p className="text-[12px] text-gray-500">Define and manage examination types used across your school assessments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{items.length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Active</span>
            <span className="text-xs font-bold text-emerald-700">{activeCount}</span>
          </div>
          <div className="bg-red-50/60 border border-red-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-red-400">Inactive</span>
            <span className="text-xs font-bold text-red-600">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search by name, code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white font-medium text-gray-800"
            />
          </div>

          {/* Status filter */}
          <div className="w-36">
            <Select
              options={[
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' },
              ]}
              value={filterStatus !== '' ? { value: filterStatus, label: filterStatus === '1' ? 'Active' : 'Inactive' } : null}
              onChange={s => setFilterStatus(s ? s.value : '')}
              placeholder="All Status"
              isClearable
              styles={selectStyles}
            />
          </div>

          {/* Per page */}
          <select
            value={itemsPerPage}
            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded py-1 px-1.5 text-xs bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none h-7"
          >
            {[10, 25, 50, 100, -1].map(n => <option key={n} value={n}>{n === -1 ? 'All' : n}</option>)}
          </select>

          {/* Trashed */}
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={showTrashed}
              onChange={e => { setShowTrashed(e.target.checked); setCurrentPage(1); }}
              className="accent-purple-600 w-3 h-3"
            />
            <span className="text-gray-600 font-medium">Show Trashed</span>
          </label>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleSampleDownload}
            className="flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition text-[11px] font-medium h-7"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Sample
          </button>
          <label className="flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition text-[11px] font-medium h-7 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Import
            <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition text-[11px] font-medium h-7"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1 px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 transition text-[11px] font-semibold h-7 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>
      </div>

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 text-xs">
          <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
          <span className="font-semibold text-purple-700">{selectedIds.length} selected</span>
          <div className="flex gap-1.5 ml-2 flex-wrap">
            {!showTrashed ? (
              <>
                <button onClick={() => handleBulkStatus(true)} className="px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-[10px] font-medium">Activate</button>
                <button onClick={() => handleBulkStatus(false)} className="px-2 py-0.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-[10px] font-medium">Deactivate</button>
                <button onClick={handleBulkDelete} className="px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition text-[10px] font-medium">Move to Trash</button>
              </>
            ) : (
              <>
                <button onClick={handleBulkRestore} className="px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-[10px] font-medium">Restore</button>
                <button onClick={handleBulkForceDelete} className="px-2 py-0.5 bg-red-700 text-white rounded hover:bg-red-800 transition text-[10px] font-medium">Delete Permanently</button>
              </>
            )}
          </div>
          <button onClick={() => setSelectedIds([])} className="ml-auto text-purple-400 hover:text-purple-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── TABLE ── */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading exam types...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertCircle className="w-8 h-8 mb-2 text-purple-200" />
            <span className="font-medium text-gray-500">No exam types found</span>
            {!showTrashed && <button onClick={openAdd} className="mt-3 text-purple-600 hover:underline text-xs font-medium">+ Create your first exam type</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 w-8">
                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="accent-purple-600 w-3 h-3" />
                  </th>
                  <th className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider text-[10px] w-10">#</th>
                  <th
                    className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider text-[10px] cursor-pointer hover:text-purple-600 select-none"
                    onClick={() => handleSort('name')}
                  >
                    Name <SortIcon field="name" />
                  </th>
                  <th className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Code</th>
                  <th
                    className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider text-[10px] cursor-pointer hover:text-purple-600 select-none"
                    onClick={() => handleSort('duration_minutes')}
                  >
                    Duration <SortIcon field="duration_minutes" />
                  </th>
                  <th className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Description</th>
                  <th
                    className="px-3 py-2 text-center text-gray-500 font-semibold uppercase tracking-wider text-[10px] cursor-pointer hover:text-purple-600 select-none"
                    onClick={() => handleSort('display_order')}
                  >
                    Order <SortIcon field="display_order" />
                  </th>
                  <th className="px-3 py-2 text-center text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Active</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-purple-50/30 transition-colors ${selectedIds.includes(item.id) ? 'bg-purple-50/50' : ''} ${item.deleted_at ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectRow(item.id)} className="accent-purple-600 w-3 h-3" />
                    </td>
                    <td className="px-3 py-2 text-gray-400 font-medium">
                      {itemsPerPage === -1 ? idx + 1 : (currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-gray-800">{item.name}</span>
                    </td>
                    <td className="px-3 py-2">
                      {item.code
                        ? <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono text-[10px] font-bold">{item.code}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {item.duration_minutes ? (
                        <span>{item.duration_minutes} min</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-500 max-w-[220px]">
                      <span className="line-clamp-2 leading-relaxed">{item.description || <span className="text-gray-300">—</span>}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px]">
                        {item.display_order}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {!item.deleted_at && (
                        <ToggleSwitch checked={item.is_active} onChange={() => handleToggleStatus(item.id)} />
                      )}
                      {item.deleted_at && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-semibold">Trashed</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!item.deleted_at ? (
                          <>
                            <button
                              onClick={() => openEdit(item)}
                              title="Edit"
                              className="p-1 rounded hover:bg-purple-100 text-purple-500 hover:text-purple-700 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Move to Trash"
                              className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              title="Restore"
                              className="p-1 rounded hover:bg-green-100 text-green-500 hover:text-green-700 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleForceDelete(item.id)}
                              title="Delete Permanently"
                              className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-800 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      </div>

      {/* ── PAGINATION ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-[11px]">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >«</button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >‹</button>
            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span key={i} className="px-2 text-gray-400 text-[11px]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`px-2 py-1 rounded border text-[11px] transition ${currentPage === p ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >›</button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >»</button>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-white/80" />
                <h2 className="text-sm font-bold text-white">
                  {editingItem ? 'Edit Exam Type' : 'Create Exam Type'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData((f: any) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Quarterly Exam, Half Yearly..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  required
                />
              </div>

              {/* Code & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData((f: any) => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. QTR, HLF, ANN"
                    maxLength={30}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={e => setFormData((f: any) => ({ ...f, duration_minutes: e.target.value }))}
                    placeholder="e.g. 180"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData((f: any) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description of this exam type..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                />
              </div>

              {/* Display Order & Active */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={e => setFormData((f: any) => ({ ...f, display_order: e.target.value }))}
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <ToggleSwitch
                      checked={formData.is_active}
                      onChange={() => setFormData((f: any) => ({ ...f, is_active: !f.is_active }))}
                    />
                    <span className={`text-xs font-semibold ${formData.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-60 transition flex items-center gap-1.5"
                >
                  {formSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Create Exam Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── IMPORT MODAL ── */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-white/80" />
                <h2 className="text-sm font-bold text-white">Import Exam Types</h2>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{importRows.length} rows</span>
              </div>
              <button onClick={() => { setIsImportOpen(false); setImportRows([]); }} className="text-white/70 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-purple-50 border-b border-purple-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold text-[10px] uppercase">#</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold text-[10px] uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold text-[10px] uppercase">Code</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold text-[10px] uppercase">Duration</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold text-[10px] uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold text-[10px] uppercase">Order</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold text-[10px] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-1.5 font-semibold text-gray-800">{row['name *'] || row['name'] || <span className="text-red-400">Missing</span>}</td>
                      <td className="px-3 py-1.5 text-gray-600">{row['code'] || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-600">{row['duration_minutes'] ? `${row['duration_minutes']} min` : '—'}</td>
                      <td className="px-3 py-1.5 text-gray-500 max-w-[200px] truncate">{row['description'] || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-600">{row['display_order'] ?? 0}</td>
                      <td className="px-3 py-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          String(row['status (active/inactive)'] || row['status'] || 'active').toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {String(row['status (active/inactive)'] || row['status'] || 'active').toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => { setIsImportOpen(false); setImportRows([]); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={importing}
                className="px-5 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-60 transition flex items-center gap-1.5"
              >
                {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Import {importRows.length} Row{importRows.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
