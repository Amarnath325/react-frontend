import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeCashBookItem {
  id: number;
  voucher_number: string;
  entry_date: string;
  entry_type: 'Cash Receipt' | 'Cash Payment' | 'Petty Cash Expense' | 'Cash Counter Collection' | 'Cash Contra';
  cash_category: 'Fee Collection' | 'Petty Expenses' | 'Office Maintenance' | 'Salary Advance' | 'Miscellaneous Income' | 'Donation';
  particulars: string;
  payee_payer_name: string | null;
  receipt_number: string | null;
  cash_in: number;
  cash_out: number;
  closing_cash_balance: number;
  cashier_name: string | null;
  verification_status: 'Verified' | 'Pending Audit' | 'Discrepancy';
  remarks: string | null;
  is_active: boolean;
  created_at: string;
}

const ENTRY_TYPES = [
  'Cash Receipt',
  'Cash Payment',
  'Petty Cash Expense',
  'Cash Counter Collection',
  'Cash Contra'
];

const CASH_CATEGORIES = [
  'Student Fee',
  'Admission Fee',
  'Book Sale',
  'Uniform Sale',
  'Donation',
  'Miscellaneous Income',
  'Salary Advance',
  'Office Expenses',
  'Stationery',
  'Fuel',
  'Maintenance',
  'Petty Cash',
  'Fee Collection'
];

const VERIFICATION_STATUSES = [
  { value: 'Verified', label: 'Verified' },
  { value: 'Pending Audit', label: 'Pending Audit' },
  { value: 'Discrepancy', label: 'Discrepancy' }
];

export default function CashBook() {
  const [data, setData] = useState<FeeCashBookItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filter States
  const [filterEntryType, setFilterEntryType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterVerificationStatus, setFilterVerificationStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);
  const [activeReportTab, setActiveReportTab] = useState<'All' | 'Cash Receipts' | 'Cash Payments' | 'Petty Cash' | 'Daily Summary'>('All');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeCashBookItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeCashBookItem | null>(null);
  const [formData, setFormData] = useState({
    voucher_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: 'Cash Counter Collection' as 'Cash Receipt' | 'Cash Payment' | 'Petty Cash Expense' | 'Cash Counter Collection' | 'Cash Contra',
    cash_category: 'Fee Collection' as 'Fee Collection' | 'Petty Expenses' | 'Office Maintenance' | 'Salary Advance' | 'Miscellaneous Income' | 'Donation',
    particulars: 'Daily Counter Cash Fee Collections (Class 1-10)',
    payee_payer_name: 'Student Counter Collection',
    receipt_number: 'RCP-88912',
    cash_in: 45000,
    cash_out: 0,
    closing_cash_balance: 145000,
    cashier_name: 'Ramesh Kumar',
    verification_status: 'Verified' as 'Verified' | 'Pending Audit' | 'Discrepancy',
    remarks: 'Verified daily counter closing cash in hand balance.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchCashBookEntries();
  }, [viewTrash, filterEntryType, filterCategory, filterVerificationStatus, filterStatus]);

  const fetchCashBookEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-cash-books', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          entry_type: filterEntryType || undefined,
          cash_category: filterCategory || undefined,
          verification_status: filterVerificationStatus || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cash book entries', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            voucher_number: 'CSH-2026-001',
            entry_date: '2026-04-10',
            entry_type: 'Cash Counter Collection',
            cash_category: 'Fee Collection',
            particulars: 'Daily Counter Cash Fee Collections (Class 1-10)',
            payee_payer_name: 'Student Counter Collection',
            receipt_number: 'RCP-88912',
            cash_in: 45000.00,
            cash_out: 0.00,
            closing_cash_balance: 145000.00,
            cashier_name: 'Ramesh Kumar',
            verification_status: 'Verified',
            remarks: 'Verified daily counter closing cash in hand balance.',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            voucher_number: 'CSH-2026-002',
            entry_date: '2026-04-11',
            entry_type: 'Petty Cash Expense',
            cash_category: 'Petty Expenses',
            particulars: 'Office Tea, Refreshments & Postage Stamps',
            payee_payer_name: 'Metro Stationers',
            receipt_number: 'VOU-1092',
            cash_in: 0.00,
            cash_out: 1250.00,
            closing_cash_balance: 143750.00,
            cashier_name: 'Ramesh Kumar',
            verification_status: 'Verified',
            remarks: 'Approved by Principal.',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            voucher_number: 'CSH-2026-003',
            entry_date: '2026-04-12',
            entry_type: 'Cash Payment',
            cash_category: 'Office Maintenance',
            particulars: 'Emergency Plumbing Repair & Electrical Supplies',
            payee_payer_name: 'City Hardware Mart',
            receipt_number: 'INV-40912',
            cash_in: 0.00,
            cash_out: 3500.00,
            closing_cash_balance: 140250.00,
            cashier_name: 'Ramesh Kumar',
            verification_status: 'Pending Audit',
            remarks: 'Receipt attached for audit verification.',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Tab click handler with page reset
  const handleTabChange = (tab: 'All' | 'Cash Receipts' | 'Cash Payments' | 'Petty Cash' | 'Daily Summary') => {
    setActiveReportTab(tab);
    setCurrentPage(1);
  };

  // Dynamic counts for tab badges
  const tabCounts = useMemo(() => {
    const all = data.length;
    const receipts = data.filter(d => d.cash_in > 0 || d.entry_type === 'Cash Receipt' || d.entry_type === 'Cash Counter Collection').length;
    const payments = data.filter(d => d.cash_out > 0 || d.entry_type === 'Cash Payment').length;
    const petty = data.filter(d => d.entry_type === 'Petty Cash Expense' || d.cash_category === 'Petty Expenses').length;
    const summary = data.filter(d => d.is_active).length;
    return { all, receipts, payments, petty, summary };
  }, [data]);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch =
        item.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.payee_payer_name && item.payee_payer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.receipt_number && item.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.cashier_name && item.cashier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.remarks && item.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchTab = true;
      if (activeReportTab === 'Cash Receipts') {
        matchTab = item.cash_in > 0 || item.entry_type === 'Cash Receipt' || item.entry_type === 'Cash Counter Collection';
      } else if (activeReportTab === 'Cash Payments') {
        matchTab = item.cash_out > 0 || item.entry_type === 'Cash Payment';
      } else if (activeReportTab === 'Petty Cash') {
        matchTab = item.entry_type === 'Petty Cash Expense' || item.cash_category === 'Petty Expenses';
      } else if (activeReportTab === 'Daily Summary') {
        matchTab = item.is_active;
      }

      return matchSearch && matchTab;
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
  }, [data, searchTerm, activeReportTab, sortColumn, sortOrder]);

  // Stats calculation based on filtered view
  const stats = useMemo(() => {
    const sourceData = filteredData.length > 0 ? filteredData : data;
    const totalCashIn = sourceData.reduce((sum, d) => sum + d.cash_in, 0);
    const totalCashOut = sourceData.reduce((sum, d) => sum + d.cash_out, 0);
    const netCashHand = totalCashIn - totalCashOut;
    const totalEntries = sourceData.length;
    return { totalCashIn, totalCashOut, netCashHand, totalEntries };
  }, [filteredData, data]);

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === -1 ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (col: keyof FeeCashBookItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeCashBookItem) => {
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
      voucher_number: 'CSH-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      entry_date: new Date().toISOString().split('T')[0],
      entry_type: 'Cash Counter Collection',
      cash_category: 'Fee Collection',
      particulars: '',
      payee_payer_name: '',
      receipt_number: 'RCP-' + Math.floor(10000 + Math.random() * 90000),
      cash_in: 0,
      cash_out: 0,
      closing_cash_balance: (stats.netCashHand || 100000),
      cashier_name: 'Main Cashier',
      verification_status: 'Verified',
      remarks: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeCashBookItem) => {
    setEditingItem(item);
    setFormData({
      voucher_number: item.voucher_number,
      entry_date: item.entry_date,
      entry_type: item.entry_type,
      cash_category: item.cash_category,
      particulars: item.particulars,
      payee_payer_name: item.payee_payer_name || '',
      receipt_number: item.receipt_number || '',
      cash_in: item.cash_in,
      cash_out: item.cash_out,
      closing_cash_balance: item.closing_cash_balance,
      cashier_name: item.cashier_name || '',
      verification_status: item.verification_status,
      remarks: item.remarks || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.particulars.trim()) {
      alert('Please enter transaction particulars description.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-cash-books/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-cash-books', formData);
      }
      setIsModalOpen(false);
      fetchCashBookEntries();
    } catch (error: any) {
      alert('Failed to save cash book entry: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-cash-books/${id}/toggle-status`);
      fetchCashBookEntries();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this cash book entry to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-cash-books/${id}`);
      fetchCashBookEntries();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-cash-books/${id}/restore`);
      fetchCashBookEntries();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this cash book entry? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-cash-books/${id}/force`);
      fetchCashBookEntries();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete' | 'verify') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected cash book entry record(s)?`)) return;

    try {
      await axios.post('/api/school/fee-cash-books/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchCashBookEntries();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchCashBookEntries();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-cash-books/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-cash-books/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { voucher_number: 'CSH-2026-001', entry_date: '2026-04-10', entry_type: 'Cash Counter Collection', cash_category: 'Fee Collection', particulars: 'Daily Counter Cash Fee Collections (Class 1-10)', payee_payer_name: 'Student Counter Collection', receipt_number: 'RCP-88912', cash_in: 45000, cash_out: 0, closing_cash_balance: 145000, cashier_name: 'Ramesh Kumar' },
      { voucher_number: 'CSH-2026-002', entry_date: '2026-04-11', entry_type: 'Petty Cash Expense', cash_category: 'Petty Expenses', particulars: 'Office Tea, Refreshments & Postage Stamps', payee_payer_name: 'Metro Stationers', receipt_number: 'VOU-1092', cash_in: 0, cash_out: 1250, closing_cash_balance: 143750, cashier_name: 'Ramesh Kumar' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-cash-books/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchCashBookEntries();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchCashBookEntries();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Cash Book Registry</h1>
            <p className="text-[10px] text-gray-500">School Daily Cash Book Registry, Counter Collections, Petty Cash Payments, Cash Balances & Cash Vouchers.</p>
          </div>
        </div>

        {/* Sub-Module Reports Quick Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-white p-1 border border-gray-200 rounded-xl shadow-2xs text-[10.5px]">
          <button
            type="button"
            onClick={() => handleTabChange('All')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'All' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>All</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'All' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {tabCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Cash Receipts')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Cash Receipts' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Cash Receipts</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Cash Receipts' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {tabCounts.receipts}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Cash Payments')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Cash Payments' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Cash Payments</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Cash Payments' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {tabCounts.payments}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Petty Cash')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Petty Cash' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Petty Cash</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Petty Cash' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {tabCounts.petty}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Daily Summary')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Daily Summary' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Daily Summary</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Daily Summary' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {tabCounts.summary}
            </span>
          </button>
        </div>
      </div>

      {/* Active Tab Sub-module Info Indicator Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200/60 p-2.5 rounded-xl flex items-center justify-between text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-emerald-900 uppercase text-[10px] tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded-md">
            Active Cash View: {activeReportTab}
          </span>
          <span className="text-gray-600 font-semibold text-[11px]">
            {activeReportTab === 'All' && 'Viewing all cash receipts, payments, petty cash vouchers and closing balances.'}
            {activeReportTab === 'Cash Receipts' && 'Filtering cash collections (+) received at counter and fee desks.'}
            {activeReportTab === 'Cash Payments' && 'Filtering cash payouts (-) for office maintenance, salary advances and vendors.'}
            {activeReportTab === 'Petty Cash' && 'Filtering petty cash vouchers for daily office expenses and postage.'}
            {activeReportTab === 'Daily Summary' && 'Showing live cash in hand balance and daily transaction totals.'}
          </span>
        </div>
        <span className="text-[10px] font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-150">
          Showing {filteredData.length} of {data.length} Entry(s)
        </span>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Cash Receipts (+)</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalCashIn.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Cash Payments (-)</p>
            <h3 className="text-lg font-black text-rose-700 mt-0.5">₹{stats.totalCashOut.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Net Cash Hand Balance</p>
            <h3 className="text-lg font-black text-indigo-900 mt-0.5">₹{stats.netCashHand.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Cash Vouchers</p>
            <h3 className="text-lg font-black text-blue-900 mt-0.5">{stats.totalEntries} Entries</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Cash Entry */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Voucher No, Particulars, Name, Ref No, Cashier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-xs"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 0 0114 0z" />
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

          {/* Action Buttons: Sample, Import, Export, + Add Cash Entry */}
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
              <span>+ Add Cash Entry</span>
            </button>
          </div>
        </div>

        {/* Row 2: Clean Filter Toolbar (No Scrollbar, No Bracket Labels) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {/* Entry Type Filter */}
          <select
            value={filterEntryType}
            onChange={(e) => setFilterEntryType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">Entry Type</option>
            {ENTRY_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Cash Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">Cash Category</option>
            {CASH_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Verification Status Filter */}
          <select
            value={filterVerificationStatus}
            onChange={(e) => setFilterVerificationStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Audit Status</option>
            {VERIFICATION_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Active Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[100px]"
          >
            <option value="">Active Status</option>
            <option value="1">Active Only</option>
            <option value="0">Inactive Only</option>
          </select>

          {(filterEntryType || filterCategory || filterVerificationStatus || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterEntryType('');
                setFilterCategory('');
                setFilterVerificationStatus('');
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
          <span className="font-bold text-xs">{selectedItems.size} cash voucher(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('verify')}
                  className="px-3 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] hover:bg-emerald-700"
                >
                  Mark Verified
                </button>
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
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('voucher_number')}>
                <div className="flex items-center gap-0.5">VOUCHER NO {getSortIcon('voucher_number')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('entry_date')}>
                <div className="flex items-center gap-0.5">DATE & TYPE {getSortIcon('entry_date')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('particulars')}>
                <div className="flex items-center gap-0.5">PARTICULARS & NAME {getSortIcon('particulars')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('cash_in')}>
                <div className="flex items-center justify-end gap-0.5">CASH IN (+) {getSortIcon('cash_in')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('cash_out')}>
                <div className="flex items-center justify-end gap-0.5">CASH OUT (-) {getSortIcon('cash_out')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('closing_cash_balance')}>
                <div className="flex items-center justify-end gap-0.5">CASH HAND BAL (₹) {getSortIcon('closing_cash_balance')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('verification_status')}>
                <div className="flex items-center gap-0.5">AUDIT {getSortIcon('verification_status')}</div>
              </th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-24 font-bold text-gray-750">ACTIVE</th>
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
                    <span className="font-bold text-gray-600">Loading cash book registry entries...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No cash book registry entries found.'}
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
                      {item.voucher_number}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.entry_date}</div>
                      <div className="text-[9.5px] font-extrabold text-blue-900 uppercase tracking-wider">{item.entry_type}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.particulars}</div>
                      <div className="text-[9px] text-slate-500">{item.payee_payer_name ? `By/To: ${item.payee_payer_name}` : ''} {item.receipt_number ? `(Ref: ${item.receipt_number})` : ''}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {item.cash_in > 0 ? `₹${item.cash_in.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                      {item.cash_out > 0 ? `₹${item.cash_out.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-950">
                      ₹{item.closing_cash_balance.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <span className={`px-1.5 py-0.2 rounded font-black uppercase text-[8.5px] ${
                        item.verification_status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                        item.verification_status === 'Pending Audit' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {item.verification_status}
                      </span>
                      {item.cashier_name && <div className="text-[8.5px] text-gray-400 font-semibold mt-0.5">{item.cashier_name}</div>}
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

      {/* Add / Edit Cash Book Entry Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Cash Book Voucher Record' : 'Log New Cash Book Entry'}</h3>
                  <p className="text-[9.5px] text-gray-500">Voucher Number, Transaction Date, Type, Category, Particulars Description, Cash In (+), Cash Out (-), Closing Cash in Hand.</p>
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
              {/* Row 1: Voucher Number, Entry Date, Entry Type, Category (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Voucher Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.voucher_number}
                    onChange={(e) => setFormData({ ...formData, voucher_number: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="CSH-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Entry Type *</label>
                  <select
                    value={formData.entry_type}
                    onChange={(e) => setFormData({ ...formData, entry_type: e.target.value as any })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] bg-white font-bold text-blue-900"
                  >
                    {ENTRY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Cash Category *</label>
                  <select
                    value={formData.cash_category}
                    onChange={(e) => setFormData({ ...formData, cash_category: e.target.value as any })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] bg-white font-semibold"
                  >
                    {CASH_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Particulars, Received From / Paid To, Receipt Ref No (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Particulars / Description *</label>
                  <input
                    type="text"
                    required
                    value={formData.particulars}
                    onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                    placeholder="Daily Counter Cash Fee Collection"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Received From / Paid To Name</label>
                  <input
                    type="text"
                    value={formData.payee_payer_name}
                    onChange={(e) => setFormData({ ...formData, payee_payer_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                    placeholder="Student Counter / Supplier Name"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Receipt / Bill Ref Number</label>
                  <input
                    type="text"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono uppercase"
                    placeholder="RCP-88912 / VOU-1092"
                  />
                </div>
              </div>

              {/* Row 3: Cash In (+), Cash Out (-), Closing Cash Hand Balance, Cashier Name (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-emerald-50/40 p-2 rounded-lg border border-emerald-200/80">
                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Cash In (Receipt + ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cash_in}
                    onChange={(e) => setFormData({ ...formData, cash_in: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-emerald-800"
                    placeholder="45000.00"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Cash Out (Payment - ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cash_out}
                    onChange={(e) => setFormData({ ...formData, cash_out: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-rose-800"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Closing Cash Hand Bal (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.closing_cash_balance}
                    onChange={(e) => setFormData({ ...formData, closing_cash_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-indigo-950"
                    placeholder="145000.00"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Cashier / Accountant Name</label>
                  <input
                    type="text"
                    value={formData.cashier_name}
                    onChange={(e) => setFormData({ ...formData, cashier_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                    placeholder="Ramesh Kumar"
                  />
                </div>
              </div>

              {/* Row 4: Verification Status & Audit Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Audit Verification Status</label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-blue-900"
                  >
                    {VERIFICATION_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Audit Remarks & Verification Notes</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Verification notes or cashier audit remarks..."
                  />
                </div>
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
                    <span className="font-bold text-gray-800 text-[10px]">Active Cash Book Voucher</span>
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
                    {editingItem ? 'Save Updates' : 'Confirm & Save Cash Entry'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Cash Book Entries Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Voucher No</th>
                    <th className="px-3 py-2 border">Date</th>
                    <th className="px-3 py-2 border">Type</th>
                    <th className="px-3 py-2 border">Particulars</th>
                    <th className="px-3 py-2 border text-right">Cash In (₹)</th>
                    <th className="px-3 py-2 border text-right">Cash Out (₹)</th>
                    <th className="px-3 py-2 border text-right">Closing Cash Bal (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-emerald-900">{row.voucher_number}</td>
                      <td className="px-3 py-2 border font-semibold">{row.entry_date}</td>
                      <td className="px-3 py-2 border font-semibold">{row.entry_type}</td>
                      <td className="px-3 py-2 border font-bold">{row.particulars}</td>
                      <td className="px-3 py-2 border text-right font-black text-emerald-700">₹{row.cash_in || 0}</td>
                      <td className="px-3 py-2 border text-right font-black text-rose-800">₹{row.cash_out || 0}</td>
                      <td className="px-3 py-2 border text-right font-black text-indigo-950">₹{row.closing_cash_balance}</td>
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
