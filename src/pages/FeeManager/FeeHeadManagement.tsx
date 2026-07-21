import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, RefreshCw, X, Layers, FileText, CheckCircle, HelpCircle,
  Inbox, ChevronLeft, ChevronRight, Download, Upload
} from 'lucide-react';
import api from '../../services/api';

interface FeeHead {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  is_active: boolean;
  deleted_at?: string;
}

interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export default function FeeHeadManagement() {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewTrash, setViewTrash] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected row checkboxes
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeItem, setActiveItem] = useState<FeeHead | null>(null);

  // CSV Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Academic',
    description: '',
    is_active: true
  });

  // KPI count states (calculated locally from API or summary fetch, here we can fetch them)
  const [stats, setStats] = useState({
    total: 0,
    academic: 0,
    admission: 0,
    misc: 0
  });

  useEffect(() => {
    fetchFeeHeads();
  }, [pagination.current_page, pagination.per_page, sortBy, sortOrder, selectedCategory, selectedStatus, viewTrash]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPagination(prev => ({ ...prev, current_page: 1 }));
      fetchFeeHeads();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchFeeHeads = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: searchTerm,
        only_trashed: viewTrash ? 1 : 0
      };

      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.is_active = selectedStatus === 'active' ? 1 : 0;

      const res = await api.get('/school/fee-heads', { params });
      if (res.data?.success) {
        setFeeHeads(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }

      // Load count summaries if viewing active list to keep stats accurate
      if (!viewTrash) {
        const statsRes = await api.get('/school/fee-heads', { params: { per_page: 1000 } });
        if (statsRes.data?.success) {
          const list: FeeHead[] = statsRes.data.data || [];
          setStats({
            total: list.length,
            academic: list.filter(h => h.category === 'Academic').length,
            admission: list.filter(h => h.category === 'Admission' || h.category === 'Administrative').length,
            misc: list.filter(h => !['Academic', 'Admission', 'Administrative'].includes(h.category)).length
          });
        }
      }
    } catch (err) {
      toast.error('Failed to load fee heads configuration');
    } finally {
      setLoading(false);
      setSelectedIds([]); // Clear selection on reload
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setActiveItem(null);
    setFormData({
      code: '',
      name: '',
      category: 'Academic',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FeeHead) => {
    setIsEditMode(true);
    setActiveItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category || 'Academic',
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required fields');
      return;
    }

    try {
      if (isEditMode && activeItem) {
        const res = await api.put(`/school/fee-heads/${activeItem.id}`, formData);
        if (res.data?.success) {
          toast.success(res.data.message || 'Fee head updated successfully');
          setIsModalOpen(false);
          fetchFeeHeads();
        }
      } else {
        const res = await api.post('/school/fee-heads', formData);
        if (res.data?.success) {
          toast.success(res.data.message || 'Fee head created successfully');
          setIsModalOpen(false);
          fetchFeeHeads();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save fee head configuration');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Soft delete this fee head configuration?')) {
      try {
        const res = await api.delete(`/school/fee-heads/${id}`);
        if (res.data?.success) {
          toast.success(res.data.message || 'Fee head trashed');
          fetchFeeHeads();
        }
      } catch (err) {
        toast.error('Failed to trash fee head');
      }
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await api.post(`/school/fee-heads/${id}/restore`);
      if (res.data?.success) {
        toast.success('Fee head restored successfully!');
        fetchFeeHeads();
      }
    } catch (err) {
      toast.error('Failed to restore fee head');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (window.confirm('PERMANENTLY delete this fee head? This action CANNOT be undone.')) {
      try {
        const res = await api.delete(`/school/fee-heads/${id}/force`);
        if (res.data?.success) {
          toast.success('Fee head deleted permanently');
          fetchFeeHeads();
        }
      } catch (err) {
        toast.error('Failed to permanently delete fee head');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await api.patch(`/school/fee-heads/${id}/toggle-status`);
      if (res.data?.success) {
        toast.success('Status updated');
        fetchFeeHeads();
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  // Checkbox Multiselect Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(feeHeads.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkStatus = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/school/fee-heads/bulk-status', {
        ids: selectedIds,
        is_active: active ? 1 : 0
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Status updated successfully');
        fetchFeeHeads();
      }
    } catch (err) {
      toast.error('Bulk status change failed');
    }
  };

  const handleBulkTrash = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Trash the ${selectedIds.length} selected fee heads?`)) {
      try {
        const res = await api.post('/school/fee-heads/bulk-trash', { ids: selectedIds });
        if (res.data?.success) {
          toast.success(res.data.message || 'Selection moved to trash bin');
          fetchFeeHeads();
        }
      } catch (err) {
        toast.error('Bulk trash failed');
      }
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/school/fee-heads/bulk-restore', { ids: selectedIds });
      if (res.data?.success) {
        toast.success(res.data.message || 'Restored selection successfully');
        fetchFeeHeads();
      }
    } catch (err) {
      toast.error('Bulk restore failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`PERMANENTLY delete the ${selectedIds.length} selected items? This CANNOT be undone.`)) {
      try {
        const res = await api.post('/school/fee-heads/bulk-delete', { ids: selectedIds });
        if (res.data?.success) {
          toast.success(res.data.message || 'Selection permanently deleted');
          fetchFeeHeads();
        }
      } catch (err) {
        toast.error('Bulk permanent deletion failed');
      }
    }
  };

  // CSV Operations
  const handleExport = () => {
    window.open(`${api.defaults.baseURL}/school/fee-heads/export`, '_blank');
    toast.success('Initiating export download');
  };

  const handleDownloadSample = () => {
    window.open(`${api.defaults.baseURL}/school/fee-heads/sample`, '_blank');
    toast.success('Initiating sample template download');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please choose a valid CSV file');
      return;
    }

    setImporting(true);
    setImportErrors([]);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/school/fee-heads/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Import completed successfully!');
        if (res.data.errors && res.data.errors.length > 0) {
          setImportErrors(res.data.errors);
          toast('Some rows had errors during parsing', { icon: '⚠️' });
        } else {
          setIsImportModalOpen(false);
          setImportFile(null);
        }
        fetchFeeHeads();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'CSV Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Render sort icon helper
  const getSortIcon = (column: string) => {
    const isActive = sortBy === column;
    return (
      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded text-[8px] font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-3 text-xs bg-slate-50/50 min-h-screen">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Fee Head Management</h1>
            <p className="text-[10px] text-gray-500">Configure school-wise ledger accounts, categories, and codes with full CRUD operations, trash bin recovery, and CSV integration.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFeeHeads}
            className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-blue-50 border-blue-100 min-w-0">
          <div className="p-1.5 rounded-md bg-blue-500 text-white flex-shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Total Categories</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-100 min-w-0">
          <div className="p-1.5 rounded-md bg-green-500 text-white flex-shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Academic Heads</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{stats.academic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-amber-50 border-amber-100 min-w-0">
          <div className="p-1.5 rounded-md bg-amber-500 text-white flex-shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Admission/Admin</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{stats.admission}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-purple-50 border-purple-100 min-w-0">
          <div className="p-1.5 rounded-md bg-purple-500 text-white flex-shrink-0">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Miscellaneous</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{stats.misc}</p>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Filters (Double-Row Layout matching reference image) ── */}
      <div className="space-y-2">
        {/* Row 1: Actions, Search and Show per page */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-250 text-xs shadow-sm">
          {/* Left: Search and Show */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search fee heads..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none w-44 h-7 bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Show pagination limit */}
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 h-7">
              <span className="text-[10px] text-gray-500 font-bold uppercase">SHOW:</span>
              <select
                value={pagination.per_page}
                onChange={e => setPagination(prev => ({ ...prev, per_page: Number(e.target.value), current_page: 1 }))}
                className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Show Trashed Switch Toggle */}
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2.5 py-0.5 h-7">
              <span className="text-xs text-gray-700 font-medium select-none">Show Trashed</span>
              <button
                type="button"
                onClick={() => setViewTrash(prev => !prev)}
                className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${
                  viewTrash ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                    viewTrash ? 'translate-x-[18px]' : 'translate-x-[4px]'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadSample}
              type="button"
              className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-semibold h-7 shadow-sm"
              title="Download Template Sample"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span>Sample</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              type="button"
              className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-semibold h-7 shadow-sm"
              title="Import CSV Data"
            >
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              <span>Import</span>
            </button>

            <button
              onClick={handleExport}
              type="button"
              className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-semibold h-7 shadow-sm"
              title="Export CSV Data"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export</span>
            </button>

            {!viewTrash && (
              <button
                onClick={handleOpenAdd}
                type="button"
                className="flex items-center gap-1 px-3.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-bold h-7 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Categories select */}
          <div className="flex items-center gap-1 bg-white border border-gray-250 rounded px-2.5 py-1 h-8 w-44">
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }}
              className="text-xs font-semibold text-gray-500 bg-transparent w-full focus:outline-none cursor-pointer"
            >
              <option value="">Categories</option>
              <option value="Academic">Academic Fees</option>
              <option value="Admission">Admission Fees</option>
              <option value="Infrastructure">Infrastructure Fees</option>
              <option value="Co-Curricular">Co-Curricular Fees</option>
              <option value="Transport">Transport Fees</option>
              <option value="Hostel">Hostel Fees</option>
              <option value="Miscellaneous">Miscellaneous Fees</option>
            </select>
          </div>

          {/* Status select */}
          {!viewTrash && (
            <div className="flex items-center gap-1 bg-white border border-gray-250 rounded px-2.5 py-1 h-8 w-44">
              <select
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }}
                className="text-xs font-semibold text-gray-500 bg-transparent w-full focus:outline-none cursor-pointer"
              >
                <option value="">Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          )}

          {(selectedCategory || selectedStatus || searchTerm) && (
            <button
              onClick={() => { setSelectedCategory(''); setSelectedStatus(''); setSearchTerm(''); }}
              className="text-[10px] font-bold text-rose-600 hover:underline bg-rose-50 px-2 py-1 rounded"
              type="button"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk Actions Panel (Contextual) ── */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-150 p-2 rounded-lg flex items-center justify-between animate-fadeIn text-[11px] font-bold text-indigo-700 shadow-sm">
          <span>{selectedIds.length} items selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkStatus(true)}
                  className="bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px]"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatus(false)}
                  className="bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px]"
                >
                  Deactivate
                </button>
                <button
                  onClick={handleBulkTrash}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-250 px-2 py-0.5 rounded text-[10px]"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px]"
                >
                  Restore Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-250 px-2 py-0.5 rounded text-[10px]"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="text-gray-400 hover:text-gray-600 font-normal px-1 text-[10px]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Table Grid ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                <th className="py-2 px-3 text-center w-8">
                  <input
                    type="checkbox"
                    checked={feeHeads.length > 0 && selectedIds.length === feeHeads.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-3 cursor-pointer select-none text-[10px] font-bold text-gray-700" onClick={() => handleSort('code')}>
                  <div className="flex items-center gap-1">
                    <span>UNIQUE CODE</span>
                    {getSortIcon('code')}
                  </div>
                </th>
                <th className="py-2 px-3 cursor-pointer select-none text-[10px] font-bold text-gray-700" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>HEAD NAME</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th className="py-2 px-3 cursor-pointer select-none text-[10px] font-bold text-gray-700" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    <span>CATEGORY</span>
                    {getSortIcon('category')}
                  </div>
                </th>
                <th className="py-2 px-3 text-[10px] font-bold text-gray-700">DESCRIPTION</th>
                {!viewTrash && (
                  <th className="py-2 px-3 cursor-pointer select-none text-center w-20 text-[10px] font-bold text-gray-700" onClick={() => handleSort('is_active')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>STATUS</span>
                      {getSortIcon('is_active')}
                    </div>
                  </th>
                )}
                <th className="py-2 px-3 text-center w-28 text-[10px] font-bold text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={viewTrash ? 6 : 7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading Categories...
                  </td>
                </tr>
              ) : feeHeads.length === 0 ? (
                <tr>
                  <td colSpan={viewTrash ? 6 : 7} className="py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-400">
                      <div className="p-2.5 bg-slate-100 rounded-full mb-3 text-slate-400">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        {viewTrash ? 'Trash bin is empty' : 'No fee heads configured'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                        {viewTrash
                          ? 'All deleted configurations are cleared.'
                          : 'Define custom school billing heads to link with classes.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                feeHeads.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{item.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-700">{item.name}</td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-650">{item.category}</td>
                    <td className="py-2.5 px-3 text-gray-400 font-medium max-w-[200px] truncate">{item.description || '—'}</td>
                    {!viewTrash && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors cursor-pointer ${item.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        {!viewTrash ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="px-1.5 py-0.5 bg-gray-150 hover:bg-gray-200 text-gray-700 font-medium rounded text-[10px] transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-0.5 text-gray-400 hover:text-rose-600 rounded transition"
                              title="Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-750 font-bold rounded text-[10px] transition hover:bg-indigo-100"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleForceDelete(item.id)}
                              className="p-0.5 text-gray-400 hover:text-rose-600 rounded transition"
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
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.last_page > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between font-bold text-gray-500">
            <span className="text-[10px]">
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} records total)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                disabled={pagination.current_page === 1}
                className="p-1 hover:bg-gray-250 hover:text-gray-700 rounded transition disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))}
                disabled={pagination.current_page === pagination.last_page}
                className="p-1 hover:bg-gray-250 hover:text-gray-700 rounded transition disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Setup Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 flex items-center justify-between text-white font-bold text-sm">
              <h3>{isEditMode ? 'Edit Fee Head Details' : 'Configure New Fee Head'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Unique Head Code</label>
                <input
                  type="text"
                  placeholder="e.g. TUIT_FEE"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full h-7 px-2 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-indigo-500 uppercase"
                  required
                  disabled={isEditMode}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Fee Head Label / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tuition Fee"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-7 px-2 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Classification Type</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-7 px-2 py-1 text-[11px] rounded border border-gray-300 bg-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="Academic">Academic Fees</option>
                  <option value="Admission">Admission Fees</option>
                  <option value="Infrastructure">Infrastructure Fees</option>
                  <option value="Co-Curricular">Co-Curricular Fees</option>
                  <option value="Transport">Transport Fees</option>
                  <option value="Hostel">Hostel Fees</option>
                  <option value="Miscellaneous">Miscellaneous Fees</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Description / Remarks</label>
                <textarea
                  placeholder="Memo details about this head..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-indigo-500 h-16 resize-none"
                />
              </div>

              {/* Status Toggle Switch */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100 mt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Status (Active / Inactive)</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-5' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-7 px-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition text-[11px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-7 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm text-[11px] font-semibold transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CSV Import Modal ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 flex items-center justify-between text-white font-bold text-sm">
              <h3>Import Fee Heads from CSV</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center py-5 space-y-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setImportFile(e.target.files ? e.target.files[0] : null)}
                  className="text-[11px] font-bold text-gray-600 cursor-pointer"
                  required
                />
                <p className="text-[10px] text-gray-400 font-medium">Supported extension: .csv (Max size 2MB)</p>
              </div>

              <div className="flex items-center justify-between bg-indigo-50 p-2.5 rounded text-indigo-750 font-bold border border-indigo-150">
                <span>Need a template?</span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1 text-[10px] hover:underline"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {importErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-150 p-2.5 rounded text-rose-700 space-y-1 max-h-36 overflow-y-auto">
                  <p className="font-extrabold text-[10px] uppercase">Parsing Warning Log:</p>
                  <ul className="list-disc list-inside font-semibold text-[9px] space-y-0.5">
                    {importErrors.map((err, idx) => (
                      <li key={idx} className="truncate">{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="h-7 px-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition text-[11px] font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="h-7 px-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded shadow-sm text-[11px] font-semibold flex items-center gap-1"
                >
                  {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{importing ? 'Importing...' : 'Upload File'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
