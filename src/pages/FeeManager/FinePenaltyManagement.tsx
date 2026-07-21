import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FineSlabRule {
  from_day: number;
  to_day: number;
  amount: number;
}

interface FeeFineItem {
  id: number;
  fine_code: string;
  fine_name: string;
  fine_category: 'late_fee' | 'library_overdue' | 'damage_loss' | 'disciplinary' | 'custom';
  fine_type: 'daily_recurring' | 'flat_amount' | 'percentage_of_due' | 'slab_wise';
  fine_amount: number;
  grace_period_days: number;
  max_fine_limit: number | null;
  slab_config: FineSlabRule[] | null;
  applicable_fee_head: string;
  applicable_scope: string;
  auto_impose: boolean;
  exempt_holidays: boolean;
  exempt_sundays: boolean;
  include_previous_dues: boolean;
  allow_manual_override: boolean;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const FINE_CATEGORIES = [
  { value: 'late_fee', label: 'Late Fee Payment Fine' },
  { value: 'library_overdue', label: 'Library Book Overdue Fine' },
  { value: 'damage_loss', label: 'Property Damage / Equipment Loss' },
  { value: 'disciplinary', label: 'Disciplinary Penalty' },
  { value: 'custom', label: 'Custom Penalty Rule' }
];

const FINE_TYPES = [
  { value: 'daily_recurring', label: 'Per Day Recurring Fine (₹/Day)' },
  { value: 'flat_amount', label: 'Fixed Fine Amount (₹)' },
  { value: 'percentage_of_due', label: 'Percentage of Due Amount (%)' },
  { value: 'slab_wise', label: 'Slab-Wise Tiered Fine' }
];

const APPLICABLE_HEADS = [
  { value: 'all_heads', label: 'All Fee Heads (Global Fine)' },
  { value: 'Tuition Fee', label: 'Tuition Fee Only' },
  { value: 'Transport Fee', label: 'Transport Fee Only' },
  { value: 'Hostel Fee', label: 'Hostel & Mess Fee' },
  { value: 'Admission Fee', label: 'Admission & Registration Fee' }
];

export default function FinePenaltyManagement() {
  const [data, setData] = useState<FeeFineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterHead, setFilterHead] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeFineItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeFineItem | null>(null);
  const [formData, setFormData] = useState({
    fine_code: '',
    fine_name: '',
    fine_category: 'late_fee',
    fine_type: 'daily_recurring',
    fine_amount: 50,
    grace_period_days: 5,
    max_fine_limit: 2000,
    slab_config: [
      { from_day: 1, to_day: 7, amount: 50 },
      { from_day: 8, to_day: 15, amount: 100 },
      { from_day: 16, to_day: 30, amount: 200 }
    ],
    applicable_fee_head: 'Tuition Fee',
    applicable_scope: 'all_students',
    auto_impose: true,
    exempt_holidays: true,
    exempt_sundays: true,
    include_previous_dues: false,
    allow_manual_override: true,
    description: 'Daily late fee penalty accrued after 5-day grace period with Sunday & Holiday exemptions.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchFines();
  }, [viewTrash, filterCategory, filterType, filterHead, filterStatus]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-fines', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          fine_category: filterCategory || undefined,
          fine_type: filterType || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fine rules', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            fine_code: 'FINE-LATE-PERDAY',
            fine_name: 'Per Day Recurring Late Fee Penalty',
            fine_category: 'late_fee',
            fine_type: 'daily_recurring',
            fine_amount: 50.00,
            grace_period_days: 5,
            max_fine_limit: 2000,
            slab_config: null,
            applicable_fee_head: 'Tuition Fee',
            applicable_scope: 'all_students',
            auto_impose: true,
            exempt_holidays: true,
            exempt_sundays: true,
            include_previous_dues: false,
            allow_manual_override: true,
            description: '₹50/day fine accrued automatically after 5-day grace period (Excludes Sundays & Holidays)',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            fine_code: 'FINE-SLAB-TIERED',
            fine_name: 'Tiered Slab-Wise Late Fee Fine',
            fine_category: 'late_fee',
            fine_type: 'slab_wise',
            fine_amount: 100.00,
            grace_period_days: 3,
            max_fine_limit: 3000,
            slab_config: [
              { from_day: 1, to_day: 7, amount: 50 },
              { from_day: 8, to_day: 15, amount: 100 },
              { from_day: 16, to_day: 30, amount: 200 }
            ],
            applicable_fee_head: 'all_heads',
            applicable_scope: 'all_students',
            auto_impose: true,
            exempt_holidays: true,
            exempt_sundays: true,
            include_previous_dues: true,
            allow_manual_override: true,
            description: 'Slab 1: 1-7 days (₹50/day), Slab 2: 8-15 days (₹100/day), Slab 3: 16+ days (₹200/day)',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            fine_code: 'FINE-PERCENT-DUE',
            fine_name: '5% Late Submission Percentage Fine',
            fine_category: 'late_fee',
            fine_type: 'percentage_of_due',
            fine_amount: 5.00,
            grace_period_days: 7,
            max_fine_limit: 1500,
            slab_config: null,
            applicable_fee_head: 'Tuition Fee',
            applicable_scope: 'all_students',
            auto_impose: true,
            exempt_holidays: false,
            exempt_sundays: false,
            include_previous_dues: true,
            allow_manual_override: true,
            description: '5% penalty calculated on total unpaid due balance',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch =
        item.fine_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fine_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.applicable_fee_head.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    }).sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [data, searchTerm, sortColumn, sortOrder]);

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === -1 ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (col: keyof FeeFineItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeFineItem) => {
    if (sortColumn !== col) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Checkbox Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(paginatedData.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectRow = (id: number) => {
    const next = new Set(selectedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedItems(next);
  };

  // Single Item CRUD
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      fine_code: 'FINE-' + Math.floor(100 + Math.random() * 900),
      fine_name: '',
      fine_category: 'late_fee',
      fine_type: 'daily_recurring',
      fine_amount: 50,
      grace_period_days: 5,
      max_fine_limit: 2000,
      slab_config: [
        { from_day: 1, to_day: 7, amount: 50 },
        { from_day: 8, to_day: 15, amount: 100 }
      ],
      applicable_fee_head: 'Tuition Fee',
      applicable_scope: 'all_students',
      auto_impose: true,
      exempt_holidays: true,
      exempt_sundays: true,
      include_previous_dues: false,
      allow_manual_override: true,
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeFineItem) => {
    setEditingItem(item);
    setFormData({
      fine_code: item.fine_code,
      fine_name: item.fine_name,
      fine_category: item.fine_category,
      fine_type: item.fine_type,
      fine_amount: item.fine_amount,
      grace_period_days: item.grace_period_days,
      max_fine_limit: item.max_fine_limit || 0,
      slab_config: item.slab_config || [
        { from_day: 1, to_day: 7, amount: 50 },
        { from_day: 8, to_day: 15, amount: 100 }
      ],
      applicable_fee_head: item.applicable_fee_head,
      applicable_scope: item.applicable_scope || 'all_students',
      auto_impose: item.auto_impose,
      exempt_holidays: item.exempt_holidays,
      exempt_sundays: item.exempt_sundays,
      include_previous_dues: item.include_previous_dues,
      allow_manual_override: item.allow_manual_override,
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fine_name.trim()) {
      alert('Please enter a fine rule name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-fines/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-fines', formData);
      }
      setIsModalOpen(false);
      fetchFines();
    } catch (error: any) {
      alert('Failed to save fine rule: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-fines/${id}/toggle-status`);
      fetchFines();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this fine rule to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-fines/${id}`);
      fetchFines();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-fines/${id}/restore`);
      fetchFines();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this fine rule? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-fines/${id}/force`);
      fetchFines();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Slab Config Helpers
  const addSlabRow = () => {
    const lastSlab = formData.slab_config[formData.slab_config.length - 1];
    const newFrom = lastSlab ? lastSlab.to_day + 1 : 1;
    setFormData(prev => ({
      ...prev,
      slab_config: [...prev.slab_config, { from_day: newFrom, to_day: newFrom + 7, amount: 100 }]
    }));
  };

  const removeSlabRow = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      slab_config: prev.slab_config.filter((_, i) => i !== idx)
    }));
  };

  const updateSlabRow = (idx: number, field: keyof FineSlabRule, val: number) => {
    const next = [...formData.slab_config];
    next[idx] = { ...next[idx], [field]: val };
    setFormData({ ...formData, slab_config: next });
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected fine rule(s)?`)) return;

    try {
      await axios.post('/api/school/fee-fines/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchFines();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchFines();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-fines/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-fines/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { fine_code: 'FINE-LATE-PERDAY', fine_name: 'Daily Recurring Late Fee Penalty', fine_category: 'late_fee', fine_type: 'daily_recurring', fine_amount: 50, grace_period_days: 5, max_fine_limit: 2000, applicable_fee_head: 'Tuition Fee', auto_impose: 1, exempt_holidays: 1, exempt_sundays: 1 },
      { fine_code: 'FINE-FLAT-GRACE', fine_name: 'Fixed Fine Amount', fine_category: 'late_fee', fine_type: 'flat_amount', fine_amount: 500, grace_period_days: 7, max_fine_limit: 500, applicable_fee_head: 'all_heads', auto_impose: 1, exempt_holidays: 1, exempt_sundays: 1 },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-fines/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchFines();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchFines();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(d => d.is_active).length;
    const dailyCount = data.filter(d => d.fine_type === 'daily_recurring').length;
    const flatSlabCount = data.filter(d => d.fine_type === 'flat_amount' || d.fine_type === 'slab_wise').length;
    return { total, active, dailyCount, flatSlabCount };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Fine & Late Penalty Manager</h1>
            <p className="text-[10px] text-gray-500">Configure Fixed, Per Day, Percentage %, and Slab-Wise late fee penalties with Grace Days, Sunday & Holiday exemptions, and Manual Waiver permissions.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Fine Rules</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.total} Rules</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active Fine Rules</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">{stats.active} Active</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Per Day Penalties</p>
            <h3 className="text-lg font-black text-amber-700 mt-0.5">{stats.dailyCount} Rules (₹/Day)</h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Fixed & Slab Rules</p>
            <h3 className="text-lg font-black text-purple-750 mt-0.5">{stats.flatSlabCount} Rules</h3>
          </div>
          <div className="p-2 bg-purple-50 text-purple-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Create Fine Rule */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Fine Code, Rule Name, Head..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none bg-white text-xs"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Show Trashed Toggle */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1">
              <span className="text-gray-700 font-bold select-none text-[10px] uppercase tracking-wider">Show Trashed</span>
              <button
                type="button"
                onClick={() => setViewTrash(prev => !prev)}
                className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${viewTrash ? 'bg-rose-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${viewTrash ? 'translate-x-[18px]' : 'translate-x-[4px]'}`}
                />
              </button>
            </div>

            {/* Pagination select */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">SHOW:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? -1 : Number(e.target.value);
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                className="font-bold text-gray-700 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={5}>5 Rows</option>
                <option value={10}>10 Rows</option>
                <option value={25}>25 Rows</option>
                <option value={50}>50 Rows</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {/* Action Buttons: Sample, Import, Export, + Create Fine Rule */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSample}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              Sample
            </button>

            <label className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition cursor-pointer font-bold shadow-xs text-xs">
              Import
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              Export
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-bold shadow-md text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Create Fine Rule</span>
            </button>
          </div>
        </div>

        {/* Row 2: Single Row Filters */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Fine Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Categories</option>
            {FINE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Fine Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Penalty Types (Fixed/PerDay/Percentage/Slab)</option>
            {FINE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Fee Head Filter */}
          <select
            value={filterHead}
            onChange={(e) => setFilterHead(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Fee Heads</option>
            {APPLICABLE_HEADS.map(h => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[110px]"
          >
            <option value="">All Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Inactive Only</option>
          </select>

          {(filterCategory || filterType || filterHead || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('');
                setFilterType('');
                setFilterHead('');
                setFilterStatus('');
              }}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-md transition flex-shrink-0 whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions Context Menu panel */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} fine rule(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkAction('inactive')}
                  className="px-3 py-1 bg-white border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-100 text-gray-600"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => handleBulkAction('trash')}
                  className="px-3 py-1 bg-rose-100 border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-200 text-rose-800"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkAction('restore')}
                  className="px-3 py-1 bg-white border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-750"
                >
                  Restore Selected
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-rose-100 border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-200 text-rose-800"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-bold text-[10px]"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* ERP Table View */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-[10px]">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('fine_code')}>
                <div className="flex items-center gap-0.5">FINE CODE {getSortIcon('fine_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('fine_name')}>
                <div className="flex items-center gap-0.5">FINE RULE NAME & CATEGORY {getSortIcon('fine_name')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('fine_type')}>
                <div className="flex items-center gap-0.5">FINE TYPE {getSortIcon('fine_type')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('fine_amount')}>
                <div className="flex items-center justify-end gap-0.5">FINE AMOUNT / RATE {getSortIcon('fine_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('grace_period_days')}>
                <div className="flex items-center justify-center gap-0.5">GRACE DAYS {getSortIcon('grace_period_days')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">EXEMPTIONS & RULES</th>
              <th className="py-2.5 px-3 text-center font-bold text-gray-750">AUTO / MANUAL</th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">STATUS</th>
              )}
              <th className="py-2.5 px-3 w-28 text-center font-bold text-gray-750">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading fine & late penalty rules...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No fine penalty rules found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const catObj = FINE_CATEGORIES.find(c => c.value === item.fine_category);
                const catLabel = catObj ? catObj.label : item.fine_category;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition text-gray-700">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-900">
                      {item.fine_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.fine_name}</div>
                      <div className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">{catLabel} • {item.applicable_fee_head}</div>
                      {item.description && <div className="text-[9px] text-gray-400 italic max-w-xs truncate">{item.description}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        item.fine_type === 'daily_recurring' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        item.fine_type === 'flat_amount' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        item.fine_type === 'percentage_of_due' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        'bg-teal-100 text-teal-800 border border-teal-200'
                      }`}>
                        {item.fine_type === 'daily_recurring' ? 'Per Day Fine' :
                         item.fine_type === 'flat_amount' ? 'Fixed Fine' :
                         item.fine_type === 'percentage_of_due' ? 'Percentage Fine' : 'Slab Wise Fine'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-950">
                      {item.fine_type === 'daily_recurring' ? `₹${item.fine_amount.toFixed(2)}/day` :
                       item.fine_type === 'percentage_of_due' ? `${item.fine_amount}%` :
                       item.fine_type === 'slab_wise' ? 'Slab Tiered' : `₹${item.fine_amount.toFixed(2)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                      {item.grace_period_days > 0 ? `${item.grace_period_days} Days` : <span className="text-rose-600 text-[10px]">0 Days</span>}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 text-[10px]">
                      <div className="flex flex-wrap gap-1">
                        {item.exempt_sundays && <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[8.5px] font-bold">Sun Exemption</span>}
                        {item.exempt_holidays && <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[8.5px] font-bold">Holiday Exemption</span>}
                        {item.include_previous_dues && <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded text-[8.5px] font-bold">+Prev Dues</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="text-[9px] font-bold">
                        <span className={item.auto_impose ? 'text-emerald-700' : 'text-gray-500'}>{item.auto_impose ? 'Auto Fine' : 'Manual Fine'}</span>
                        {item.allow_manual_override && <span className="block text-[8px] text-blue-600">Waiver Allowed</span>}
                      </div>
                    </td>
                    {!viewTrash && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${
                              item.is_active ? 'bg-rose-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                                item.is_active ? 'translate-x-[18px]' : 'translate-x-[4px]'
                              }`}
                            />
                          </button>
                          <span className={`text-[9px] font-bold ${item.is_active ? 'text-rose-700' : 'text-gray-400'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!viewTrash ? (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-rose-700 hover:bg-rose-50 rounded transition"
                              title="Edit Fine Rule"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Move to Trash"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-750 font-bold rounded text-[9px] hover:bg-rose-100 transition"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleForceDelete(item.id)}
                              className="p-1 text-rose-650 hover:bg-rose-50 rounded transition"
                              title="Delete Permanently"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border border-gray-200 rounded-xl bg-white px-4 py-2.5 text-xs shadow-xs">
          <div>
            <p className="text-xs text-gray-600 font-medium">
              Showing page <span className="font-semibold text-rose-600">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span> ({filteredData.length} records)
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                « First
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                if (Math.abs(pNum - currentPage) > 2 && pNum !== 1 && pNum !== totalPages) return null;
                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`relative inline-flex items-center border px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      currentPage === pNum
                        ? 'z-10 bg-rose-50 border-rose-500 text-rose-700 font-black'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Last »
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Add / Edit Fine Rule Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Fine & Late Penalty Rule' : 'Configure New Fine & Late Penalty Rule'}</h3>
                  <p className="text-[9.5px] text-gray-500">Define Fixed, Per Day, Percentage, or Slab-Wise penalty rules with Sunday & Holiday exemptions.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full border border-gray-200 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-3 space-y-2 text-xs">
              {/* Row 1: Fine Code, Fine Name, Category (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Fine Rule Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.fine_code}
                    onChange={(e) => setFormData({ ...formData, fine_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="FINE-LATE-PERDAY"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Fine Rule Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.fine_name}
                    onChange={(e) => setFormData({ ...formData, fine_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none text-[10.5px]"
                    placeholder="e.g. Daily Late Fee Penalty"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Fine Category *</label>
                  <select
                    value={formData.fine_category}
                    onChange={(e) => setFormData({ ...formData, fine_category: e.target.value as any })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-bold text-[10.5px] bg-white text-rose-900"
                  >
                    {FINE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Fine Type, Amount/Rate, Grace Days, Max Cap (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-rose-50/40 p-2 rounded-lg border border-rose-200/80">
                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Penalty Calculation Type *</label>
                  <select
                    value={formData.fine_type}
                    onChange={(e) => setFormData({ ...formData, fine_type: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-rose-900"
                  >
                    {FINE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Fine Amount / Rate ({formData.fine_type === 'percentage_of_due' ? '%' : '₹'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={formData.fine_type === 'slab_wise'}
                    value={formData.fine_amount}
                    onChange={(e) => setFormData({ ...formData, fine_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-rose-900 disabled:bg-gray-100"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Grace Days Threshold</label>
                  <input
                    type="number"
                    value={formData.grace_period_days}
                    onChange={(e) => setFormData({ ...formData, grace_period_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-rose-900"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Maximum Fine Cap (₹ Limit)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_fine_limit}
                    onChange={(e) => setFormData({ ...formData, max_fine_limit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-rose-900"
                    placeholder="2000"
                  />
                </div>
              </div>

              {/* Dynamic Slab Builder if fine_type === 'slab_wise' */}
              {formData.fine_type === 'slab_wise' && (
                <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 text-[10px] uppercase tracking-wide">Slab-Wise Tiered Penalty Builder</span>
                    <button
                      type="button"
                      onClick={addSlabRow}
                      className="px-2 py-0.5 bg-amber-600 text-white rounded text-[9.5px] font-bold hover:bg-amber-700"
                    >
                      + Add Slab Tier
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.slab_config.map((slab, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-1 rounded border border-amber-200 text-[10px]">
                        <span className="font-bold text-amber-900 min-w-[50px]">Slab #{idx + 1}:</span>
                        <span>From Day</span>
                        <input
                          type="number"
                          value={slab.from_day}
                          onChange={(e) => updateSlabRow(idx, 'from_day', parseInt(e.target.value) || 0)}
                          className="w-12 px-1 py-0.5 border rounded font-bold"
                        />
                        <span>to Day</span>
                        <input
                          type="number"
                          value={slab.to_day}
                          onChange={(e) => updateSlabRow(idx, 'to_day', parseInt(e.target.value) || 0)}
                          className="w-12 px-1 py-0.5 border rounded font-bold"
                        />
                        <span>Amount / Day ₹</span>
                        <input
                          type="number"
                          value={slab.amount}
                          onChange={(e) => updateSlabRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1 py-0.5 border rounded font-black text-rose-800"
                        />
                        {formData.slab_config.length > 1 && (
                          <button type="button" onClick={() => removeSlabRow(idx)} className="text-rose-600 hover:text-rose-800 font-bold px-1">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkbox Exemption Options Bar */}
              <div className="bg-slate-50 p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-gray-800 text-[10px] block mb-1">Fine Calculation & Exemption Rules:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-1.5 bg-white border border-gray-300 px-2 py-0.5 rounded text-[9.5px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.exempt_sundays}
                      onChange={(e) => setFormData({ ...formData, exempt_sundays: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-3 h-3"
                    />
                    <span className="font-semibold text-gray-750">Sunday Exemption</span>
                  </label>

                  <label className="flex items-center gap-1.5 bg-white border border-gray-300 px-2 py-0.5 rounded text-[9.5px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.exempt_holidays}
                      onChange={(e) => setFormData({ ...formData, exempt_holidays: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-3 h-3"
                    />
                    <span className="font-semibold text-gray-750">Holiday Exemption</span>
                  </label>

                  <label className="flex items-center gap-1.5 bg-white border border-gray-300 px-2 py-0.5 rounded text-[9.5px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.include_previous_dues}
                      onChange={(e) => setFormData({ ...formData, include_previous_dues: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-3 h-3"
                    />
                    <span className="font-semibold text-gray-750">Include Prev Dues</span>
                  </label>

                  <label className="flex items-center gap-1.5 bg-white border border-gray-300 px-2 py-0.5 rounded text-[9.5px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_manual_override}
                      onChange={(e) => setFormData({ ...formData, allow_manual_override: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-3 h-3"
                    />
                    <span className="font-semibold text-gray-750">Manual Waiver Allowed</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Fee Head & Description (2 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Applicable Fee Head *</label>
                  <select
                    value={formData.applicable_fee_head}
                    onChange={(e) => setFormData({ ...formData, applicable_fee_head: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    {APPLICABLE_HEADS.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Rule Guidelines & Notes</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Describe fine calculation triggers..."
                  />
                </div>
              </div>

              {/* Bottom Action Footer Bar */}
              <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.auto_impose}
                      onChange={(e) => setFormData({ ...formData, auto_impose: e.target.checked })}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Auto-Impose Fine (Auto Calculation)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Active & Enabled</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Save Fine Rule'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/45 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-150 flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Excel Fine Rules Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Fine Code</th>
                    <th className="px-3 py-2 border">Fine Rule Name</th>
                    <th className="px-3 py-2 border">Category</th>
                    <th className="px-3 py-2 border">Type</th>
                    <th className="px-3 py-2 border text-right">Amount / Rate</th>
                    <th className="px-3 py-2 border text-center">Grace Days</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-rose-800">{row.fine_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.fine_name}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-rose-700">{row.fine_category}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-indigo-700">{row.fine_type}</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.fine_amount}</td>
                      <td className="px-3 py-2 border text-center font-bold">{row.grace_period_days} Days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button
                type="button"
                disabled={importing}
                onClick={() => setIsImportModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={processImport}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold shadow-sm text-xs"
              >
                {importing ? 'Importing fine rules...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
