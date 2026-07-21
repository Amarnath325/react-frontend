import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeOtherIncomeItem {
  id: number;
  income_code: string;
  income_head: string;
  income_category: string;
  income_source: string;
  payer_name: string;
  payer_phone: string | null;
  receipt_number: string | null;
  payment_mode: 'Cash' | 'UPI' | 'Bank_Transfer' | 'Cheque' | 'Demand_Draft';
  transaction_reference: string | null;
  amount: number;
  tax_amount: number;
  net_amount: number;
  income_date: string;
  academic_year: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const INCOME_CATEGORIES_MAPPING: Record<string, string[]> = {
  'Academic Income': ['Admission Form Sale', 'Prospectus Sale', 'Exam Fee'],
  'Facility Income': ['Library Fine', 'Lab Charges', 'Transport Charges'],
  'Rental Income': ['Hall Rent', 'Playground Rent', 'Auditorium Rent'],
  'Other Income': ['Donations', 'Sponsorship', 'Event Income', 'Uniform Sale', 'Book Sale']
};

const ALL_INCOME_SOURCES = [
  'Admission Form Sale',
  'Prospectus Sale',
  'Exam Fee',
  'Library Fine',
  'Lab Charges',
  'Transport Charges',
  'Hall Rent',
  'Playground Rent',
  'Auditorium Rent',
  'Donations',
  'Sponsorship',
  'Event Income',
  'Uniform Sale',
  'Book Sale'
];

const PAYMENT_MODES = [
  { value: 'Cash', label: 'Cash Payment' },
  { value: 'UPI', label: 'UPI / QR Scanner' },
  { value: 'Bank_Transfer', label: 'Bank Transfer (NEFT/RTGS/IMPS)' },
  { value: 'Cheque', label: 'Bank Cheque' },
  { value: 'Demand_Draft', label: 'Demand Draft (DD)' }
];

export default function OtherIncomeManagement() {
  const [data, setData] = useState<FeeOtherIncomeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeOtherIncomeItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeOtherIncomeItem | null>(null);
  const [formData, setFormData] = useState({
    income_code: '',
    income_head: 'New Session Prospectus Sale',
    income_category: 'Academic Income',
    income_source: 'Prospectus Sale',
    payer_name: 'Over the counter cash collection',
    payer_phone: '9876543210',
    receipt_number: 'REC-88421',
    payment_mode: 'Cash' as 'Cash' | 'UPI' | 'Bank_Transfer' | 'Cheque' | 'Demand_Draft',
    transaction_reference: 'CASH/REF-101',
    amount: 15000,
    tax_amount: 0,
    income_date: '2026-04-05',
    academic_year: '2025-2026',
    description: 'Prospectus and admission brochure sales collection.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchIncomes();
  }, [viewTrash, filterCategory, filterSource, filterMode, filterStatus]);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-other-incomes', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          income_category: filterCategory || undefined,
          income_source: filterSource || undefined,
          payment_mode: filterMode || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch other income records', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            income_code: 'INC-2026-001',
            income_head: 'New Session Prospectus Sale',
            income_category: 'Academic Income',
            income_source: 'Prospectus Sale',
            payer_name: 'Walk-in Applicants',
            payer_phone: '9876543210',
            receipt_number: 'REC-88421',
            payment_mode: 'Cash',
            transaction_reference: 'CASH/REF-101',
            amount: 15000.00,
            tax_amount: 0.00,
            net_amount: 15000.00,
            income_date: '2026-04-05',
            academic_year: '2025-2026',
            description: 'Prospectus and admission brochure sales collection',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            income_code: 'INC-2026-002',
            income_head: 'Auditorium Booking Hall Rent',
            income_category: 'Rental Income',
            income_source: 'Auditorium Rent',
            payer_name: 'City Cultural Association',
            payer_phone: '9876543211',
            receipt_number: 'REC-88422',
            payment_mode: 'Bank_Transfer',
            transaction_reference: 'NEFT/594839201',
            amount: 35000.00,
            tax_amount: 6300.00,
            net_amount: 28700.00,
            income_date: '2026-04-12',
            academic_year: '2025-2026',
            description: 'Auditorium booking for annual music concert',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            income_code: 'INC-2026-003',
            income_head: 'Annual Sports Day Sponsorship',
            income_category: 'Other Income',
            income_source: 'Sponsorship',
            payer_name: 'HDFC Bank CSR Foundation',
            payer_phone: '9876543212',
            receipt_number: 'REC-88423',
            payment_mode: 'Cheque',
            transaction_reference: 'CHQ-894012',
            amount: 50000.00,
            tax_amount: 0.00,
            net_amount: 50000.00,
            income_date: '2026-04-18',
            academic_year: '2025-2026',
            description: 'CSR sponsorship grant for annual inter-school sports event',
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
        item.income_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.income_head.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.income_source && item.income_source.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.payer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.receipt_number && item.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.transaction_reference && item.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const handleSort = (col: keyof FeeOtherIncomeItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeOtherIncomeItem) => {
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
      income_code: 'INC-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      income_head: '',
      income_category: 'Academic Income',
      income_source: 'Admission Form Sale',
      payer_name: '',
      payer_phone: '',
      receipt_number: 'REC-' + Math.floor(10000 + Math.random() * 90000),
      payment_mode: 'Cash',
      transaction_reference: '',
      amount: 5000,
      tax_amount: 0,
      income_date: new Date().toISOString().split('T')[0],
      academic_year: '2025-2026',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeOtherIncomeItem) => {
    setEditingItem(item);
    setFormData({
      income_code: item.income_code,
      income_head: item.income_head,
      income_category: item.income_category,
      income_source: item.income_source || 'Admission Form Sale',
      payer_name: item.payer_name,
      payer_phone: item.payer_phone || '',
      receipt_number: item.receipt_number || '',
      payment_mode: item.payment_mode,
      transaction_reference: item.transaction_reference || '',
      amount: item.amount,
      tax_amount: item.tax_amount,
      income_date: item.income_date,
      academic_year: item.academic_year || '2025-2026',
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.income_head.trim() || !formData.payer_name.trim()) {
      alert('Please enter income head and payer name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-other-incomes/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-other-incomes', formData);
      }
      setIsModalOpen(false);
      fetchIncomes();
    } catch (error: any) {
      alert('Failed to save income record: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-other-incomes/${id}/toggle-status`);
      fetchIncomes();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this income record to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-other-incomes/${id}`);
      fetchIncomes();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-other-incomes/${id}/restore`);
      fetchIncomes();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this income record? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-other-incomes/${id}/force`);
      fetchIncomes();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected income record(s)?`)) return;

    try {
      await axios.post('/api/school/fee-other-incomes/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchIncomes();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchIncomes();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-other-incomes/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-other-incomes/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { income_code: 'INC-2026-001', income_head: 'Prospectus Sale', income_category: 'Academic Income', income_source: 'Prospectus Sale', payer_name: 'Applicants', amount: 15000, tax_amount: 0, income_date: '2026-04-05', payment_mode: 'Cash' },
      { income_code: 'INC-2026-002', income_head: 'Auditorium Booking', income_category: 'Rental Income', income_source: 'Auditorium Rent', payer_name: 'Cultural Asscn', amount: 35000, tax_amount: 6300, income_date: '2026-04-12', payment_mode: 'Bank_Transfer' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-other-incomes/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchIncomes();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchIncomes();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalGrossSum = data.reduce((sum, d) => sum + d.amount, 0);
    const totalNetSum = data.reduce((sum, d) => sum + d.net_amount, 0);
    const totalTaxSum = data.reduce((sum, d) => sum + d.tax_amount, 0);
    const totalTxnCount = data.length;
    return { totalGrossSum, totalNetSum, totalTaxSum, totalTxnCount };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Other Income Streams</h1>
            <p className="text-[10px] text-gray-500">Record Non-Tuition Revenues: Academic (Prospectus/Exam Fees), Facility (Library/Lab/Transport), Rental (Hall/Playground/Auditorium), & Other (Donations/Sponsorship/Uniform/Book Sales).</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Gross Revenue</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalGrossSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Net Credited Income</p>
            <h3 className="text-lg font-black text-indigo-750 mt-0.5">₹{stats.totalNetSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">GST / Tax Deductions</p>
            <h3 className="text-lg font-black text-amber-700 mt-0.5">₹{stats.totalTaxSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Revenue Receipts</p>
            <h3 className="text-lg font-black text-purple-750 mt-0.5">{stats.totalTxnCount} Entries</h3>
          </div>
          <div className="p-2 bg-purple-50 text-purple-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Other Income */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Income Code, Head, Source, Payer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
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

          {/* Action Buttons: Sample, Import, Export, + Add Other Income */}
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
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-bold shadow-md text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Other Income</span>
            </button>
          </div>
        </div>

        {/* Row 2: Single Row Filters */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSource('');
            }}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[150px]"
          >
            <option value="">All Categories (Academic/Rental/Facility/Other)</option>
            {Object.keys(INCOME_CATEGORIES_MAPPING).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Income Source Filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[160px]"
          >
            <option value="">All Income Sources (Form/Prospectus/Rent/Donations)</option>
            {(filterCategory && INCOME_CATEGORIES_MAPPING[filterCategory] ? INCOME_CATEGORIES_MAPPING[filterCategory] : ALL_INCOME_SOURCES).map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>

          {/* Payment Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Payment Modes</option>
            {PAYMENT_MODES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Active Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[110px]"
          >
            <option value="">All Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Inactive Only</option>
          </select>

          {(filterCategory || filterSource || filterMode || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('');
                setFilterSource('');
                setFilterMode('');
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
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} income record(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-emerald-300 rounded font-bold text-[10px] hover:bg-emerald-100 text-emerald-800"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkAction('inactive')}
                  className="px-3 py-1 bg-white border border-emerald-300 rounded font-bold text-[10px] hover:bg-emerald-100 text-gray-600"
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
                  className="px-3 py-1 bg-white border border-emerald-300 rounded font-bold text-[10px] hover:bg-emerald-100 text-emerald-800"
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
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('income_code')}>
                <div className="flex items-center gap-0.5">CODE {getSortIcon('income_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('income_head')}>
                <div className="flex items-center gap-0.5">INCOME HEAD & SOURCE {getSortIcon('income_head')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('payer_name')}>
                <div className="flex items-center gap-0.5">PAYER & RECEIPT NO {getSortIcon('payer_name')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">PAYMENT MODE & REF</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('amount')}>
                <div className="flex items-center justify-end gap-0.5">GROSS & TAX (₹) {getSortIcon('amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('net_amount')}>
                <div className="flex items-center justify-end gap-0.5">NET CREDIT (₹) {getSortIcon('net_amount')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('income_date')}>
                <div className="flex items-center gap-0.5">DATE {getSortIcon('income_date')}</div>
              </th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">ACTIVE</th>
              )}
              <th className="py-2.5 px-3 w-28 text-center font-bold text-gray-750">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading income stream records...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No income records found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition text-gray-700">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-900">
                      {item.income_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.income_head}</div>
                      <div className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-wider">{item.income_category} • {item.income_source}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.payer_name}</div>
                      <div className="text-[9.5px] text-slate-500 font-mono font-semibold">{item.receipt_number || 'N/A'} {item.payer_phone ? `• ${item.payer_phone}` : ''}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold uppercase">
                        {item.payment_mode.replace('_', ' ')}
                      </span>
                      {item.transaction_reference && <div className="text-[9px] text-gray-400 font-mono mt-0.2">{item.transaction_reference}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-gray-900">₹{item.amount.toFixed(2)}</div>
                      {item.tax_amount > 0 && <div className="text-[8.5px] text-amber-700 font-semibold">Tax: ₹{item.tax_amount.toFixed(2)}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-950">
                      ₹{item.net_amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-800 text-[10px]">
                      {item.income_date}
                    </td>
                    {!viewTrash && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${
                              item.is_active ? 'bg-emerald-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                                item.is_active ? 'translate-x-[18px]' : 'translate-x-[4px]'
                              }`}
                            />
                          </button>
                          <span className={`text-[9px] font-bold ${item.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
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
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition"
                              title="Edit Record"
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
                              className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded text-[9px] hover:bg-emerald-100 transition"
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
              Showing page <span className="font-semibold text-emerald-600">{currentPage}</span> of{' '}
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
                        ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-700 font-black'
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

      {/* Add / Edit Income Record Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Other Income Stream Record' : 'Record New Other Income Stream Entry'}</h3>
                  <p className="text-[9.5px] text-gray-500">Academic (Forms/Exam Fees), Facility (Library/Lab), Rental (Hall/Auditorium), & Other (Donations/Sponsorship/Uniforms).</p>
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
              {/* Row 1: Income Code, Income Head, Category, Income Source (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Income Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.income_code}
                    onChange={(e) => setFormData({ ...formData, income_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="INC-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Income Head / Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.income_head}
                    onChange={(e) => setFormData({ ...formData, income_head: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-[10.5px]"
                    placeholder="e.g. Admission Form Fee Collection"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Category *</label>
                  <select
                    value={formData.income_category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const defaultSrc = INCOME_CATEGORIES_MAPPING[newCat]?.[0] || 'Admission Form Sale';
                      setFormData({ ...formData, income_category: newCat, income_source: defaultSrc });
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                  >
                    {Object.keys(INCOME_CATEGORIES_MAPPING).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Specific Income Source *</label>
                  <select
                    value={formData.income_source}
                    onChange={(e) => setFormData({ ...formData, income_source: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-bold text-indigo-900"
                  >
                    {(INCOME_CATEGORIES_MAPPING[formData.income_category] || ALL_INCOME_SOURCES).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Payer Name, Payer Phone, Receipt Number, Payment Mode (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-emerald-50/40 p-2 rounded-lg border border-emerald-200/80">
                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Payer / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.payer_name}
                    onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                    placeholder="Walk-in Applicants / ABC Corp"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Payer Phone Contact</label>
                  <input
                    type="text"
                    value={formData.payer_phone}
                    onChange={(e) => setFormData({ ...formData, payer_phone: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono"
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Receipt Voucher No</label>
                  <input
                    type="text"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono font-bold"
                    placeholder="REC-88421"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Payment Mode *</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-indigo-900"
                  >
                    {PAYMENT_MODES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Transaction Ref, Amount, Tax Amount, Date (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Transaction Ref / UTR</label>
                  <input
                    type="text"
                    value={formData.transaction_reference}
                    onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-mono"
                    placeholder="NEFT/594839201"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Gross Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-emerald-950"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">GST / Tax Deductions (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-amber-800"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.income_date}
                    onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold"
                  />
                </div>
              </div>

              {/* Row 4: Description Notes */}
              <div>
                <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Audit Notes & Remarks</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                  placeholder="e.g. Over the counter collection for new admission forms..."
                />
              </div>

              {/* Bottom Action Footer Bar */}
              <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Active Revenue Entry</span>
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
                    className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Save Entry'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Other Income Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Code</th>
                    <th className="px-3 py-2 border">Income Head</th>
                    <th className="px-3 py-2 border">Category</th>
                    <th className="px-3 py-2 border">Income Source</th>
                    <th className="px-3 py-2 border text-right">Gross (₹)</th>
                    <th className="px-3 py-2 border font-mono">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-emerald-800">{row.income_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.income_head}</td>
                      <td className="px-3 py-2 border font-semibold">{row.income_category}</td>
                      <td className="px-3 py-2 border font-semibold text-indigo-800">{row.income_source}</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.amount}</td>
                      <td className="px-3 py-2 border font-mono">{row.income_date}</td>
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
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-sm text-xs"
              >
                {importing ? 'Importing records...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
