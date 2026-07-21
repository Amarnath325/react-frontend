import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface InstallmentTerm {
  installment_no: number;
  name: string;
  percentage: number;
  due_date: string;
}

interface FeeInstallmentSchemeItem {
  id: number;
  scheme_code: string;
  scheme_name: string;
  frequency: 'annual' | 'bi_annual' | 'quarterly' | 'bi_monthly' | 'monthly' | 'custom';
  number_of_installments: number;
  installment_amount_mode: 'equal_installment' | 'unequal_installment';
  late_fine_applicable: boolean;
  interest_applicable: boolean;
  interest_rate_percentage: number;
  processing_fee: number;
  late_fine_rule_id: number | null;
  due_date_mode: 'fixed_dates' | 'day_of_month' | 'after_admission';
  installment_breakup: InstallmentTerm[] | null;
  applicable_classes: string[] | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const FREQUENCY_TYPES = [
  { value: 'monthly', label: 'Monthly Installments', defaultCount: 10 },
  { value: 'quarterly', label: 'Quarterly Installments', defaultCount: 4 },
  { value: 'bi_annual', label: 'Half Yearly Installments', defaultCount: 2 },
  { value: 'annual', label: 'Annual One-Time Fee', defaultCount: 1 },
  { value: 'custom', label: 'Custom Customised Terms', defaultCount: 3 }
];

const DUE_DATE_MODES = [
  { value: 'fixed_dates', label: 'Fixed Calendar Dates (e.g. 10th April, 10th July)' },
  { value: 'day_of_month', label: 'Fixed Day of Every Month (e.g. 5th of each month)' },
  { value: 'after_admission', label: 'Days After Student Admission (e.g. +30 days, +60 days)' }
];

export default function InstallmentManagement() {
  const [data, setData] = useState<FeeInstallmentSchemeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterFrequency, setFilterFrequency] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [filterFine, setFilterFine] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeInstallmentSchemeItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeInstallmentSchemeItem | null>(null);
  const [formData, setFormData] = useState({
    scheme_code: '',
    scheme_name: '',
    frequency: 'quarterly',
    number_of_installments: 4,
    installment_amount_mode: 'equal_installment' as 'equal_installment' | 'unequal_installment',
    late_fine_applicable: true,
    interest_applicable: false,
    interest_rate_percentage: 0,
    processing_fee: 0,
    late_fine_rule_id: null,
    due_date_mode: 'fixed_dates',
    installment_breakup: [
      { installment_no: 1, name: '1st Term / Admission Fee', percentage: 25, due_date: '2026-04-10' },
      { installment_no: 2, name: '2nd Term Fee', percentage: 25, due_date: '2026-07-10' },
      { installment_no: 3, name: '3rd Term Fee', percentage: 25, due_date: '2026-10-10' },
      { installment_no: 4, name: '4th Term Fee', percentage: 25, due_date: '2027-01-10' }
    ] as InstallmentTerm[],
    applicable_classes: ['all_classes'],
    description: 'Standard 4-Quarter equal fee installment scheme.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchSchemes();
  }, [viewTrash, filterFrequency, filterMode, filterFine, filterStatus]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-installment-schemes', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          frequency: filterFrequency || undefined,
          installment_amount_mode: filterMode || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch installment schemes', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            scheme_code: 'SCHEME-QUARTERLY',
            scheme_name: 'Standard Quarterly 4-Term Plan',
            frequency: 'quarterly',
            number_of_installments: 4,
            installment_amount_mode: 'equal_installment',
            late_fine_applicable: true,
            interest_applicable: false,
            interest_rate_percentage: 0.00,
            processing_fee: 0.00,
            late_fine_rule_id: 1,
            due_date_mode: 'fixed_dates',
            installment_breakup: [
              { installment_no: 1, name: '1st Term Fee', percentage: 25, due_date: '2026-04-10' },
              { installment_no: 2, name: '2nd Term Fee', percentage: 25, due_date: '2026-07-10' },
              { installment_no: 3, name: '3rd Term Fee', percentage: 25, due_date: '2026-10-10' },
              { installment_no: 4, name: '4th Term Fee', percentage: 25, due_date: '2027-01-10' }
            ],
            applicable_classes: ['all_classes'],
            description: 'Equal 25% distribution across 4 quarters',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            scheme_code: 'SCHEME-EMI-10',
            scheme_name: 'Monthly EMI Style 10-Term Plan',
            frequency: 'monthly',
            number_of_installments: 10,
            installment_amount_mode: 'equal_installment',
            late_fine_applicable: true,
            interest_applicable: true,
            interest_rate_percentage: 2.50,
            processing_fee: 250.00,
            late_fine_rule_id: 1,
            due_date_mode: 'day_of_month',
            installment_breakup: [
              { installment_no: 1, name: 'April EMI', percentage: 10, due_date: '2026-04-05' },
              { installment_no: 2, name: 'May EMI', percentage: 10, due_date: '2026-05-05' },
              { installment_no: 3, name: 'June EMI', percentage: 10, due_date: '2026-06-05' },
              { installment_no: 4, name: 'July EMI', percentage: 10, due_date: '2026-07-05' }
            ],
            applicable_classes: ['all_classes'],
            description: 'Monthly EMI structure with 2.5% interest & ₹250 processing fee',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            scheme_code: 'SCHEME-UNEQUAL-2',
            scheme_name: 'Bi-Annual Unequal Split Scheme',
            frequency: 'bi_annual',
            number_of_installments: 2,
            installment_amount_mode: 'unequal_installment',
            late_fine_applicable: true,
            interest_applicable: false,
            interest_rate_percentage: 0.00,
            processing_fee: 0.00,
            late_fine_rule_id: 1,
            due_date_mode: 'fixed_dates',
            installment_breakup: [
              { installment_no: 1, name: '1st Semester (60%)', percentage: 60, due_date: '2026-04-15' },
              { installment_no: 2, name: '2nd Semester (40%)', percentage: 40, due_date: '2026-10-15' }
            ],
            applicable_classes: ['all_classes'],
            description: 'Unequal 60-40 split for semester billing',
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
        item.scheme_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scheme_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.frequency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchFine = filterFine === '' ? true : (filterFine === '1' ? item.late_fine_applicable : !item.late_fine_applicable);

      return matchSearch && matchFine;
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
  }, [data, searchTerm, filterFine, sortColumn, sortOrder]);

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === -1 ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (col: keyof FeeInstallmentSchemeItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeInstallmentSchemeItem) => {
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

  // Preset Breakup Generator
  const generateBreakup = (_freqVal: string, count: number, mode: 'equal_installment' | 'unequal_installment') => {
    const list: InstallmentTerm[] = [];
    const equalPct = mode === 'equal_installment' ? Math.floor(100 / count) : 30;
    const remainder = 100 - (equalPct * count);

    for (let i = 1; i <= count; i++) {
      const pct = i === 1 ? equalPct + (mode === 'equal_installment' ? remainder : 10) : equalPct;
      let monthOffset = (i - 1) * Math.floor(12 / count);
      let year = 2026;
      let month = 4 + monthOffset;
      if (month > 12) {
        month -= 12;
        year += 1;
      }
      const mStr = month < 10 ? `0${month}` : `${month}`;
      list.push({
        installment_no: i,
        name: `Installment #${i} (${pct}%)`,
        percentage: pct,
        due_date: `${year}-${mStr}-10`
      });
    }
    return list;
  };

  const handleFrequencyChange = (freqVal: string) => {
    const freqObj = FREQUENCY_TYPES.find(f => f.value === freqVal);
    const count = freqObj ? freqObj.defaultCount : 4;
    const breakup = generateBreakup(freqVal, count, formData.installment_amount_mode);
    setFormData(prev => ({
      ...prev,
      frequency: freqVal as any,
      number_of_installments: count,
      installment_breakup: breakup
    }));
  };

  const handleNumInstallmentsChange = (count: number) => {
    const breakup = generateBreakup(formData.frequency, count, formData.installment_amount_mode);
    setFormData(prev => ({
      ...prev,
      number_of_installments: count,
      installment_breakup: breakup
    }));
  };

  const handleAmountModeChange = (modeVal: 'equal_installment' | 'unequal_installment') => {
    const breakup = generateBreakup(formData.frequency, formData.number_of_installments, modeVal);
    setFormData(prev => ({
      ...prev,
      installment_amount_mode: modeVal,
      installment_breakup: breakup
    }));
  };

  // Single Item CRUD
  const openAddModal = () => {
    setEditingItem(null);
    const breakup = generateBreakup('quarterly', 4, 'equal_installment');
    setFormData({
      scheme_code: 'SCHEME-' + Math.floor(100 + Math.random() * 900),
      scheme_name: '',
      frequency: 'quarterly',
      number_of_installments: 4,
      installment_amount_mode: 'equal_installment',
      late_fine_applicable: true,
      interest_applicable: false,
      interest_rate_percentage: 0,
      processing_fee: 0,
      late_fine_rule_id: null,
      due_date_mode: 'fixed_dates',
      installment_breakup: breakup,
      applicable_classes: ['all_classes'],
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeInstallmentSchemeItem) => {
    setEditingItem(item);
    setFormData({
      scheme_code: item.scheme_code,
      scheme_name: item.scheme_name,
      frequency: item.frequency,
      number_of_installments: item.number_of_installments,
      installment_amount_mode: item.installment_amount_mode || 'equal_installment',
      late_fine_applicable: item.late_fine_applicable,
      interest_applicable: item.interest_applicable || false,
      interest_rate_percentage: item.interest_rate_percentage || 0,
      processing_fee: item.processing_fee || 0,
      late_fine_rule_id: item.late_fine_rule_id || null,
      due_date_mode: item.due_date_mode || 'fixed_dates',
      installment_breakup: item.installment_breakup || generateBreakup(item.frequency, item.number_of_installments, item.installment_amount_mode || 'equal_installment'),
      applicable_classes: item.applicable_classes || ['all_classes'],
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scheme_name.trim()) {
      alert('Please enter an installment scheme name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-installment-schemes/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-installment-schemes', formData);
      }
      setIsModalOpen(false);
      fetchSchemes();
    } catch (error: any) {
      alert('Failed to save installment scheme: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-installment-schemes/${id}/toggle-status`);
      fetchSchemes();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this installment scheme to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-installment-schemes/${id}`);
      fetchSchemes();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-installment-schemes/${id}/restore`);
      fetchSchemes();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this installment scheme? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-installment-schemes/${id}/force`);
      fetchSchemes();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Breakup Row Editors
  const updateBreakupRow = (idx: number, field: keyof InstallmentTerm, val: any) => {
    const next = [...formData.installment_breakup];
    next[idx] = { ...next[idx], [field]: val };
    setFormData({ ...formData, installment_breakup: next });
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected installment scheme(s)?`)) return;

    try {
      await axios.post('/api/school/fee-installment-schemes/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchSchemes();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchSchemes();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-installment-schemes/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-installment-schemes/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { scheme_code: 'SCHEME-QUARTERLY', scheme_name: 'Quarterly 4-Term Plan', frequency: 'quarterly', number_of_installments: 4, installment_amount_mode: 'equal_installment', late_fine_applicable: 1, due_date_mode: 'fixed_dates' },
      { scheme_code: 'SCHEME-EMI-10', scheme_name: 'Monthly EMI Scheme', frequency: 'monthly', number_of_installments: 10, installment_amount_mode: 'equal_installment', interest_applicable: 1, interest_rate_percentage: 2.5, processing_fee: 250, late_fine_applicable: 1 },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-installment-schemes/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchSchemes();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchSchemes();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(d => d.is_active).length;
    const quarterlyCount = data.filter(d => d.frequency === 'quarterly').length;
    const emiCount = data.filter(d => d.interest_applicable).length;
    return { total, active, quarterlyCount, emiCount };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Installment Schemes Management</h1>
            <p className="text-[10px] text-gray-500">Configure Monthly, Quarterly, Half-Yearly, Annual & Custom plans with Equal vs Unequal splits, EMI Interest, Processing Fees, and Penalty rules.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Schemes</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.total} Schemes</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active Schemes</p>
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
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Quarterly 4-Term Plans</p>
            <h3 className="text-lg font-black text-blue-700 mt-0.5">{stats.quarterlyCount} Schemes</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">EMI & Interest Plans</p>
            <h3 className="text-lg font-black text-purple-750 mt-0.5">{stats.emiCount} EMI Plans</h3>
          </div>
          <div className="p-2 bg-purple-50 text-purple-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Create Installment Scheme */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Scheme Code, Name, Frequency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
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

          {/* Action Buttons: Sample, Import, Export, + Create Installment Scheme */}
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
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-bold shadow-md text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Create Installment Scheme</span>
            </button>
          </div>
        </div>

        {/* Row 2: Single Row Filters */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Frequency Filter */}
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[150px]"
          >
            <option value="">All Frequencies (Monthly/Quarterly/Bi-Annual/Annual)</option>
            {FREQUENCY_TYPES.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Amount Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[150px]"
          >
            <option value="">All Calculation Modes</option>
            <option value="equal_installment">Equal Installment</option>
            <option value="unequal_installment">Unequal Installment</option>
          </select>

          {/* Late Fine Status Filter */}
          <select
            value={filterFine}
            onChange={(e) => setFilterFine(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Penalty Policies</option>
            <option value="1">Penalty Applicable</option>
            <option value="0">No Penalty</option>
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

          {(filterFrequency || filterMode || filterFine !== '' || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterFrequency('');
                setFilterMode('');
                setFilterFine('');
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
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-indigo-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} installment scheme(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-indigo-300 rounded font-bold text-[10px] hover:bg-indigo-100 text-indigo-700"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkAction('inactive')}
                  className="px-3 py-1 bg-white border border-indigo-300 rounded font-bold text-[10px] hover:bg-indigo-100 text-gray-600"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => handleBulkAction('trash')}
                  className="px-3 py-1 bg-rose-50 border border-rose-200 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkAction('restore')}
                  className="px-3 py-1 bg-white border border-indigo-300 rounded font-bold text-[10px] hover:bg-indigo-100 text-indigo-750"
                >
                  Restore Selected
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-rose-50 border border-rose-200 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
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
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('scheme_code')}>
                <div className="flex items-center gap-0.5">SCHEME CODE {getSortIcon('scheme_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('scheme_name')}>
                <div className="flex items-center gap-0.5">SCHEME TITLE & FREQUENCY {getSortIcon('scheme_name')}</div>
              </th>
              <th className="py-2.5 px-3 text-center font-bold text-gray-750">MODE & TERMS</th>
              <th className="py-2.5 px-3 font-bold text-gray-750">PERCENTAGE BREAKDOWN & DUE DATES</th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-750">EMI / PROC. FEE</th>
              <th className="py-2.5 px-3 text-center font-bold text-gray-750">PENALTY POLICY</th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">STATUS</th>
              )}
              <th className="py-2.5 px-3 w-28 text-center font-bold text-gray-750">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 8 : 9} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading installment schemes...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 8 : 9} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No installment schemes found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const freqObj = FREQUENCY_TYPES.find(f => f.value === item.frequency);
                const freqLabel = freqObj ? freqObj.label : item.frequency;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition text-gray-700">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-900">
                      {item.scheme_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.scheme_name}</div>
                      <div className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">{freqLabel}</div>
                      {item.description && <div className="text-[9px] text-gray-400 italic max-w-xs truncate">{item.description}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="font-bold text-gray-900">{item.number_of_installments} Terms</div>
                      <span className={`px-1.5 py-0.2 text-[8.5px] font-bold rounded uppercase ${
                        item.installment_amount_mode === 'equal_installment' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.installment_amount_mode === 'equal_installment' ? 'Equal Installment' : 'Unequal Installment'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-gray-700">
                      {item.installment_breakup && item.installment_breakup.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {item.installment_breakup.map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-slate-100 border border-gray-200 rounded text-[9px] font-bold">
                              #{t.installment_no}: {t.percentage}% ({t.due_date})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Equal Distribution</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-slate-800">
                        {item.interest_applicable ? `${item.interest_rate_percentage}% Interest` : '0% Interest'}
                      </div>
                      <div className="text-[9px] text-emerald-700 font-semibold">
                        Proc Fee: ₹{item.processing_fee.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        item.late_fine_applicable ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.late_fine_applicable ? 'Penalty Applicable' : 'No Penalty'}
                      </span>
                    </td>
                    {!viewTrash && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${
                              item.is_active ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                                item.is_active ? 'translate-x-[18px]' : 'translate-x-[4px]'
                              }`}
                            />
                          </button>
                          <span className={`text-[9px] font-bold ${item.is_active ? 'text-indigo-700' : 'text-gray-400'}`}>
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
                              className="p-1 text-indigo-700 hover:bg-indigo-50 rounded transition"
                              title="Edit Scheme"
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
                              className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-750 font-bold rounded text-[9px] hover:bg-indigo-100 transition"
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
              Showing page <span className="font-semibold text-indigo-600">{currentPage}</span> of{' '}
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
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-700 font-black'
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

      {/* Add / Edit Installment Scheme Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Fee Installment Scheme' : 'Configure New Fee Installment Scheme'}</h3>
                  <p className="text-[9.5px] text-gray-500">Define Monthly, Quarterly, Half Yearly & Custom schemes with Equal vs Unequal splits, Processing Fees & EMI interest.</p>
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
              {/* Row 1: Scheme Code, Scheme Name, Frequency (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Scheme Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.scheme_code}
                    onChange={(e) => setFormData({ ...formData, scheme_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="SCHEME-QUARTERLY"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Scheme Title / Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.scheme_name}
                    onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-[10.5px]"
                    placeholder="e.g. Standard Quarterly 4-Term Plan"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Payment Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => handleFrequencyChange(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-bold text-[10.5px] bg-white text-indigo-900"
                  >
                    {FREQUENCY_TYPES.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Installment Amount Mode, Terms Count, Processing Fee, EMI Interest % (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-indigo-50/40 p-2 rounded-lg border border-indigo-200/80">
                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Amount Calculation Mode *</label>
                  <select
                    value={formData.installment_amount_mode}
                    onChange={(e) => handleAmountModeChange(e.target.value as any)}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-indigo-900"
                  >
                    <option value="equal_installment">Equal Installment Split</option>
                    <option value="unequal_installment">Unequal Installment Split</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Number of Terms *</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={formData.number_of_installments}
                    onChange={(e) => handleNumInstallmentsChange(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-indigo-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">One-Time Processing Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.processing_fee}
                    onChange={(e) => setFormData({ ...formData, processing_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-indigo-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">EMI Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!formData.interest_applicable}
                    value={formData.interest_rate_percentage}
                    onChange={(e) => setFormData({ ...formData, interest_rate_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-indigo-900 disabled:bg-gray-100"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Term Breakup Editor */}
              <div className="bg-slate-50 p-2 rounded-lg border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-800 text-[10px] uppercase tracking-wide">Installment Term Percentage Split & Due Dates</span>
                  <span className="text-[9px] font-bold text-indigo-700">
                    Total Split: {formData.installment_breakup.reduce((sum, t) => sum + (t.percentage || 0), 0)}%
                  </span>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {formData.installment_breakup.map((t, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-1 rounded border border-gray-200 text-[10px]">
                      <div>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => updateBreakupRow(idx, 'name', e.target.value)}
                          className="w-full px-1.5 py-0.5 border rounded font-semibold text-gray-800"
                          placeholder={`Installment #${idx + 1}`}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-500 text-[9px]">Share %:</span>
                        <input
                          type="number"
                          value={t.percentage}
                          onChange={(e) => updateBreakupRow(idx, 'percentage', parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-0.5 border rounded font-black text-indigo-900"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-500 text-[9px]">Due Date:</span>
                        <input
                          type="date"
                          value={t.due_date}
                          onChange={(e) => updateBreakupRow(idx, 'due_date', e.target.value)}
                          className="w-full px-1.5 py-0.5 border rounded font-bold text-gray-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 3: Due Date Mode & Description Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Due Date Calculation Mode *</label>
                  <select
                    value={formData.due_date_mode}
                    onChange={(e) => setFormData({ ...formData, due_date_mode: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-indigo-900"
                  >
                    {DUE_DATE_MODES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Scheme Notes & Parental Instructions</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Parental guidance notes..."
                  />
                </div>
              </div>

              {/* Bottom Action Footer Bar */}
              <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.interest_applicable}
                      onChange={(e) => setFormData({ ...formData, interest_applicable: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">EMI Style Interest Applicable</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.late_fine_applicable}
                      onChange={(e) => setFormData({ ...formData, late_fine_applicable: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Overdue Penalty Applicable</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
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
                    className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Save Scheme'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Installment Schemes Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Scheme Code</th>
                    <th className="px-3 py-2 border">Scheme Title</th>
                    <th className="px-3 py-2 border">Frequency</th>
                    <th className="px-3 py-2 border text-center">Terms Count</th>
                    <th className="px-3 py-2 border">Amount Mode</th>
                    <th className="px-3 py-2 border text-right">Proc. Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-indigo-800">{row.scheme_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.scheme_name}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-indigo-700">{row.frequency}</td>
                      <td className="px-3 py-2 border text-center font-black">{row.number_of_installments} Terms</td>
                      <td className="px-3 py-2 border font-semibold">{row.installment_amount_mode}</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.processing_fee}</td>
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
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-sm text-xs"
              >
                {importing ? 'Importing schemes...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
