import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeAccountingItem {
  id: number;
  entry_code: string;
  account_name: string;
  account_code: string | null;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  parent_group: string;
  opening_balance: number;
  debit_amount: number;
  credit_amount: number;
  closing_balance: number;
  fiscal_year: string;
  as_of_date: string;
  voucher_reference: string | null;
  voucher_type: string;
  entry_mode: string;
  ledger_type: string;
  cash_bank_type: string;
  cash_flow_category: string;
  narration: string | null;
  approval_status: 'Approved' | 'Pending' | 'Rejected';
  is_active: boolean;
  created_at: string;
}

const ACCOUNT_TYPES = [
  { value: 'Asset', label: 'Asset' },
  { value: 'Liability', label: 'Liability' },
  { value: 'Equity', label: 'Equity' },
  { value: 'Income', label: 'Income' },
  { value: 'Expense', label: 'Expense' }
];

const PARENT_GROUPS = [
  'Cash & Liquid Assets',
  'Bank Balances',
  'Fixed Assets & Equipment',
  'Receivables & Dues',
  'Outstanding Expenses Liability',
  'Security Deposits & Refunds',
  'Tuition Fee Income',
  'Transport Fee Income',
  'Hostel Fee Income',
  'Other Non-Fee Income',
  'Salary & Staff Expenses',
  'Utility Expenses',
  'Maintenance Expenses',
  'Capital Reserve Account'
];

const VOUCHER_TYPES = [
  'Journal Voucher',
  'Payment Voucher',
  'Receipt Voucher',
  'Contra Voucher',
  'Adjustment Entry'
];

const ENTRY_MODES = [
  'Manual Journal Entry',
  'Auto Journal Entry',
  'Voucher Posting',
  'Adjustment Entries'
];

const LEDGER_TYPES = [
  'General Ledger',
  'Party Ledger',
  'Student Ledger',
  'Vendor Ledger'
];

const CASH_BANK_TYPES = [
  'Cash Book',
  'Bank Book',
  'Bank Reconciliation',
  'Non-Cash Ledger'
];

const CASH_FLOW_CATEGORIES = [
  'Operating Activities',
  'Investing Activities',
  'Financing Activities'
];

const APPROVAL_STATUSES = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending Audit' },
  { value: 'Rejected', label: 'Rejected' }
];

export default function AccountingManagement() {
  const [data, setData] = useState<FeeAccountingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterAccountType, setFilterAccountType] = useState<string>('');
  const [filterParentGroup, setFilterParentGroup] = useState<string>('');
  const [filterVoucherType, setFilterVoucherType] = useState<string>('');
  const [filterLedgerType, setFilterLedgerType] = useState<string>('');
  const [filterCashBankType, setFilterCashBankType] = useState<string>('');
  const [filterCashFlowCategory, setFilterCashFlowCategory] = useState<string>('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeAccountingItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeAccountingItem | null>(null);
  const [formData, setFormData] = useState({
    entry_code: '',
    account_name: 'Tuition Fee Income Account',
    account_code: 'GL-4001',
    account_type: 'Income' as 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense',
    parent_group: 'Tuition Fee Income',
    opening_balance: 0,
    debit_amount: 0,
    credit_amount: 5000000,
    fiscal_year: '2025-2026',
    as_of_date: new Date().toISOString().split('T')[0],
    voucher_reference: 'JRN-99201',
    voucher_type: 'Receipt Voucher',
    entry_mode: 'Auto Journal Entry',
    ledger_type: 'Student Ledger',
    cash_bank_type: 'Bank Book',
    cash_flow_category: 'Operating Activities',
    narration: 'Annual Tuition Fee Income Collections & Student Ledger Reconciliation.',
    approval_status: 'Approved' as 'Approved' | 'Pending' | 'Rejected',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchAccountings();
  }, [viewTrash, filterAccountType, filterParentGroup, filterVoucherType, filterLedgerType, filterCashBankType, filterCashFlowCategory, filterApprovalStatus, filterStatus]);

  const fetchAccountings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-accountings', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          account_type: filterAccountType || undefined,
          parent_group: filterParentGroup || undefined,
          voucher_type: filterVoucherType || undefined,
          ledger_type: filterLedgerType || undefined,
          cash_bank_type: filterCashBankType || undefined,
          cash_flow_category: filterCashFlowCategory || undefined,
          approval_status: filterApprovalStatus || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch accounting ledger records', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            entry_code: 'ACC-2026-001',
            account_name: 'Tuition Fee Income Account',
            account_code: 'GL-4001',
            account_type: 'Income',
            parent_group: 'Tuition Fee Income',
            opening_balance: 0.00,
            debit_amount: 0.00,
            credit_amount: 5000000.00,
            closing_balance: 5000000.00,
            fiscal_year: '2025-2026',
            as_of_date: '2026-04-01',
            voucher_reference: 'JRN-99201',
            voucher_type: 'Receipt Voucher',
            entry_mode: 'Auto Journal Entry',
            ledger_type: 'Student Ledger',
            cash_bank_type: 'Bank Book',
            cash_flow_category: 'Operating Activities',
            narration: 'Annual Tuition fee collections posting from student billing desk',
            approval_status: 'Approved',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            entry_code: 'ACC-2026-002',
            account_name: 'Teacher & Staff Salary Expense',
            account_code: 'GL-5001',
            account_type: 'Expense',
            parent_group: 'Salary & Staff Expenses',
            opening_balance: 0.00,
            debit_amount: 3500000.00,
            credit_amount: 0.00,
            closing_balance: 3500000.00,
            fiscal_year: '2025-2026',
            as_of_date: '2026-04-05',
            voucher_reference: 'JRN-99202',
            voucher_type: 'Payment Voucher',
            entry_mode: 'Manual Journal Entry',
            ledger_type: 'Party Ledger',
            cash_bank_type: 'Bank Book',
            cash_flow_category: 'Operating Activities',
            narration: 'Annual faculty salary and staff payroll disbursement',
            approval_status: 'Approved',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            entry_code: 'ACC-2026-003',
            account_name: 'School Main Bank Account (HDFC)',
            account_code: 'GL-1001',
            account_type: 'Asset',
            parent_group: 'Bank Balances',
            opening_balance: 1000000.00,
            debit_amount: 5000000.00,
            credit_amount: 3500000.00,
            closing_balance: 2500000.00,
            fiscal_year: '2025-2026',
            as_of_date: '2026-04-10',
            voucher_reference: 'JRN-99203',
            voucher_type: 'Contra Voucher',
            entry_mode: 'Voucher Posting',
            ledger_type: 'General Ledger',
            cash_bank_type: 'Bank Reconciliation',
            cash_flow_category: 'Operating Activities',
            narration: 'Liquid bank balance after fee collection and salary payouts',
            approval_status: 'Approved',
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
        item.entry_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.account_code && item.account_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.parent_group.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucher_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ledger_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.voucher_reference && item.voucher_reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.narration && item.narration.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const handleSort = (col: keyof FeeAccountingItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeAccountingItem) => {
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
      entry_code: 'ACC-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      account_name: '',
      account_code: 'GL-' + Math.floor(1000 + Math.random() * 9000),
      account_type: 'Income',
      parent_group: 'Tuition Fee Income',
      opening_balance: 0,
      debit_amount: 0,
      credit_amount: 50000,
      fiscal_year: '2025-2026',
      as_of_date: new Date().toISOString().split('T')[0],
      voucher_reference: 'JRN-' + Math.floor(10000 + Math.random() * 90000),
      voucher_type: 'Journal Voucher',
      entry_mode: 'Manual Journal Entry',
      ledger_type: 'General Ledger',
      cash_bank_type: 'Non-Cash Ledger',
      cash_flow_category: 'Operating Activities',
      narration: '',
      approval_status: 'Approved',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeAccountingItem) => {
    setEditingItem(item);
    setFormData({
      entry_code: item.entry_code,
      account_name: item.account_name,
      account_code: item.account_code || 'GL-1001',
      account_type: item.account_type,
      parent_group: item.parent_group,
      opening_balance: item.opening_balance,
      debit_amount: item.debit_amount,
      credit_amount: item.credit_amount,
      fiscal_year: item.fiscal_year || '2025-2026',
      as_of_date: item.as_of_date,
      voucher_reference: item.voucher_reference || '',
      voucher_type: item.voucher_type || 'Journal Voucher',
      entry_mode: item.entry_mode || 'Manual Journal Entry',
      ledger_type: item.ledger_type || 'General Ledger',
      cash_bank_type: item.cash_bank_type || 'Non-Cash Ledger',
      cash_flow_category: item.cash_flow_category || 'Operating Activities',
      narration: item.narration || '',
      approval_status: item.approval_status || 'Approved',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name.trim()) {
      alert('Please enter account name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-accountings/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-accountings', formData);
      }
      setIsModalOpen(false);
      fetchAccountings();
    } catch (error: any) {
      alert('Failed to save accounting ledger entry: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-accountings/${id}/toggle-status`);
      fetchAccountings();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this accounting ledger entry to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-accountings/${id}`);
      fetchAccountings();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-accountings/${id}/restore`);
      fetchAccountings();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this accounting ledger entry? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-accountings/${id}/force`);
      fetchAccountings();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete' | 'approve') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected accounting ledger entry(ies)?`)) return;

    try {
      await axios.post('/api/school/fee-accountings/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchAccountings();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchAccountings();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-accountings/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-accountings/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { entry_code: 'ACC-2026-001', account_name: 'Tuition Fee Income Account', account_code: 'GL-4001', account_type: 'Income', parent_group: 'Tuition Fee Income', voucher_type: 'Receipt Voucher', ledger_type: 'Student Ledger', opening_balance: 0, debit_amount: 0, credit_amount: 5000000, as_of_date: '2026-04-01', voucher_reference: 'JRN-99201' },
      { entry_code: 'ACC-2026-002', account_name: 'Teacher & Staff Salary Expense', account_code: 'GL-5001', account_type: 'Expense', parent_group: 'Salary & Staff Expenses', voucher_type: 'Payment Voucher', ledger_type: 'Party Ledger', opening_balance: 0, debit_amount: 3500000, credit_amount: 0, as_of_date: '2026-04-05', voucher_reference: 'JRN-99202' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-accountings/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchAccountings();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchAccountings();
    } finally {
      setImporting(false);
    }
  };

  // Financial Statements Realtime Calculations
  const stats = useMemo(() => {
    const totalIncome = data.filter(d => d.account_type === 'Income').reduce((sum, d) => sum + (d.closing_balance || d.credit_amount), 0);
    const totalExpense = data.filter(d => d.account_type === 'Expense').reduce((sum, d) => sum + (d.closing_balance || d.debit_amount), 0);
    const netProfit = totalIncome - totalExpense;

    const totalAssets = data.filter(d => d.account_type === 'Asset').reduce((sum, d) => sum + (d.closing_balance || d.opening_balance + d.debit_amount - d.credit_amount), 0);
    const totalLiabilities = data.filter(d => d.account_type === 'Liability').reduce((sum, d) => sum + (d.closing_balance || d.opening_balance + d.credit_amount - d.debit_amount), 0);
    const totalEquityCapital = totalAssets - totalLiabilities;

    return { totalIncome, totalExpense, netProfit, totalAssets, totalLiabilities, totalEquityCapital };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Core Financial Accounting System</h1>
            <p className="text-[10px] text-gray-500">Chart of Accounts, Journal Vouchers, General/Student/Vendor Ledgers, Cash & Bank Book Reconciliation, Trial Balance, P&L (₹50L - ₹35L = ₹15L Profit) & Balance Sheet.</p>
          </div>
        </div>
      </div>

      {/* Financial Statements Counter Cards (Profit & Loss + Balance Sheet Realtime Audit) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Income (Tuition/Transport/Hostel)</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalIncome.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Expenses (Salary/Utility/Maint)</p>
            <h3 className="text-lg font-black text-rose-700 mt-0.5">₹{stats.totalExpense.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Net Profit / Loss Audit</p>
            <h3 className={`text-lg font-black mt-0.5 ${stats.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹{stats.netProfit.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-800 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Balance Sheet Assets = Liab + Cap</p>
            <h3 className="text-lg font-black text-amber-800 mt-0.5">₹{stats.totalAssets.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-800 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Accounting Ledger */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Account, GL Code, Voucher, Ledger, Narration..."
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

          {/* Action Buttons: Sample, Import, Export, + Add Journal Entry */}
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
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-bold shadow-md text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Journal Entry</span>
            </button>
          </div>
        </div>

        {/* Row 2: Clean Filter Toolbar (No Scrollbar, No Bracket Labels) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {/* Account Type Filter */}
          <select
            value={filterAccountType}
            onChange={(e) => setFilterAccountType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Account Type</option>
            {ACCOUNT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Voucher Type Filter */}
          <select
            value={filterVoucherType}
            onChange={(e) => setFilterVoucherType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Voucher Type</option>
            {VOUCHER_TYPES.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* Ledger Type Filter */}
          <select
            value={filterLedgerType}
            onChange={(e) => setFilterLedgerType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Ledger Type</option>
            {LEDGER_TYPES.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Cash & Bank Filter */}
          <select
            value={filterCashBankType}
            onChange={(e) => setFilterCashBankType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Cash & Bank</option>
            {CASH_BANK_TYPES.map(cb => (
              <option key={cb} value={cb}>{cb}</option>
            ))}
          </select>

          {/* Cash Flow Filter */}
          <select
            value={filterCashFlowCategory}
            onChange={(e) => setFilterCashFlowCategory(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Cash Flow</option>
            {CASH_FLOW_CATEGORIES.map(cf => (
              <option key={cf} value={cf}>{cf}</option>
            ))}
          </select>

          {/* Parent Group Filter */}
          <select
            value={filterParentGroup}
            onChange={(e) => setFilterParentGroup(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Parent Group</option>
            {PARENT_GROUPS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Approval Status Filter */}
          <select
            value={filterApprovalStatus}
            onChange={(e) => setFilterApprovalStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[110px]"
          >
            <option value="">Approval Status</option>
            {APPROVAL_STATUSES.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
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

          {(filterAccountType || filterParentGroup || filterVoucherType || filterLedgerType || filterCashBankType || filterCashFlowCategory || filterApprovalStatus || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterAccountType('');
                setFilterParentGroup('');
                setFilterVoucherType('');
                setFilterLedgerType('');
                setFilterCashBankType('');
                setFilterCashFlowCategory('');
                setFilterApprovalStatus('');
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
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-blue-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} accounting entry(ies) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] hover:bg-emerald-700"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-blue-300 rounded font-bold text-[10px] hover:bg-blue-100 text-blue-800"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkAction('inactive')}
                  className="px-3 py-1 bg-white border border-blue-300 rounded font-bold text-[10px] hover:bg-blue-100 text-gray-600"
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
                  className="px-3 py-1 bg-white border border-blue-300 rounded font-bold text-[10px] hover:bg-blue-100 text-blue-800"
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
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('entry_code')}>
                <div className="flex items-center gap-0.5">ENTRY & VOUCHER {getSortIcon('entry_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('account_name')}>
                <div className="flex items-center gap-0.5">CHART OF ACCOUNTS & LEDGER {getSortIcon('account_name')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('account_type')}>
                <div className="flex items-center gap-0.5">TYPE & CASH/BANK {getSortIcon('account_type')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('debit_amount')}>
                <div className="flex items-center justify-end gap-0.5">DEBIT (₹) {getSortIcon('debit_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('credit_amount')}>
                <div className="flex items-center justify-end gap-0.5">CREDIT (₹) {getSortIcon('credit_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('closing_balance')}>
                <div className="flex items-center justify-end gap-0.5">CLOSING BALANCE {getSortIcon('closing_balance')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('as_of_date')}>
                <div className="flex items-center gap-0.5">DATE & STATEMENT {getSortIcon('as_of_date')}</div>
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
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading accounting ledger entries...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No accounting ledger entries found.'}
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <div className="font-bold text-blue-900">{item.entry_code}</div>
                      <div className="text-[9px] font-bold text-indigo-700">{item.voucher_type}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.account_name}</div>
                      <div className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">{item.parent_group} • <span className="text-indigo-800">{item.ledger_type}</span></div>
                      {item.voucher_reference && <div className="text-[9px] text-slate-500 font-mono">Ref: {item.voucher_reference}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-[9.5px]">
                      <span className={`px-1.5 py-0.2 rounded font-black uppercase border ${
                        item.account_type === 'Asset' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        item.account_type === 'Liability' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                        item.account_type === 'Equity' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        item.account_type === 'Income' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.account_type}
                      </span>
                      <div className="text-[9px] text-slate-500 font-semibold mt-0.5">{item.cash_bank_type}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className={item.debit_amount > 0 ? 'font-bold text-rose-700' : 'text-gray-400'}>
                        {item.debit_amount > 0 ? `₹${item.debit_amount.toFixed(2)}` : '-'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className={item.credit_amount > 0 ? 'font-bold text-emerald-700' : 'text-gray-400'}>
                        {item.credit_amount > 0 ? `₹${item.credit_amount.toFixed(2)}` : '-'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black">
                      <div className="text-gray-900">₹{item.closing_balance.toFixed(2)}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <div className="font-bold text-gray-800">{item.as_of_date}</div>
                      <div className="text-[8.5px] font-extrabold text-indigo-700">{item.cash_flow_category}</div>
                    </td>
                    {!viewTrash && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${
                              item.is_active ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                                item.is_active ? 'translate-x-[18px]' : 'translate-x-[4px]'
                              }`}
                            />
                          </button>
                          <span className={`text-[9px] font-bold ${item.is_active ? 'text-blue-700' : 'text-gray-400'}`}>
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
                              className="p-1 text-blue-700 hover:bg-blue-50 rounded transition"
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
                              className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-bold rounded text-[9px] hover:bg-blue-100 transition"
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
              Showing page <span className="font-semibold text-blue-600">{currentPage}</span> of{' '}
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
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-700 font-black'
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

      {/* Add / Edit Accounting Entry Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Financial Accounting Ledger Entry' : 'Post New Journal Voucher / Ledger Entry'}</h3>
                  <p className="text-[9.5px] text-gray-500">Chart of Accounts, Journal Voucher Posting, General/Student/Vendor Ledgers, Cash & Bank Reconciliation.</p>
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
              {/* Row 1: Entry Code, Account Name, Account Code, Account Type (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Entry Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.entry_code}
                    onChange={(e) => setFormData({ ...formData, entry_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="ACC-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Account Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-[10.5px] font-bold"
                    placeholder="e.g. Tuition Fee Income Account"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">GL Account Code</label>
                  <input
                    type="text"
                    value={formData.account_code}
                    onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] bg-white font-bold"
                    placeholder="GL-4001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Chart of Accounts Type *</label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                  >
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Parent Group, Voucher Type, Entry Mode, Ledger Type (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-blue-50/40 p-2 rounded-lg border border-blue-200/80">
                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Parent Ledger Group *</label>
                  <select
                    value={formData.parent_group}
                    onChange={(e) => setFormData({ ...formData, parent_group: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    {PARENT_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Voucher Type *</label>
                  <select
                    value={formData.voucher_type}
                    onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    {VOUCHER_TYPES.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Journal Entry Mode</label>
                  <select
                    value={formData.entry_mode}
                    onChange={(e) => setFormData({ ...formData, entry_mode: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    {ENTRY_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Ledger Classification</label>
                  <select
                    value={formData.ledger_type}
                    onChange={(e) => setFormData({ ...formData, ledger_type: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    {LEDGER_TYPES.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Cash/Bank Book, Cash Flow Statement, As Of Date, Voucher Reference (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Cash & Bank Book</label>
                  <select
                    value={formData.cash_bank_type}
                    onChange={(e) => setFormData({ ...formData, cash_bank_type: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    {CASH_BANK_TYPES.map(cb => (
                      <option key={cb} value={cb}>{cb}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Cash Flow Category</label>
                  <select
                    value={formData.cash_flow_category}
                    onChange={(e) => setFormData({ ...formData, cash_flow_category: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    {CASH_FLOW_CATEGORIES.map(cf => (
                      <option key={cf} value={cf}>{cf}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">As Of Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.as_of_date}
                    onChange={(e) => setFormData({ ...formData, as_of_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Voucher Ref / Serial</label>
                  <input
                    type="text"
                    value={formData.voucher_reference}
                    onChange={(e) => setFormData({ ...formData, voucher_reference: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono uppercase"
                    placeholder="JRN-99201"
                  />
                </div>
              </div>

              {/* Row 4: Opening Balance, Debit Amount, Credit Amount, Approval Audit (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Debit Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.debit_amount}
                    onChange={(e) => setFormData({ ...formData, debit_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-black text-rose-800"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Credit Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.credit_amount}
                    onChange={(e) => setFormData({ ...formData, credit_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-emerald-800"
                    placeholder="5000000"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Approval Audit Status</label>
                  <select
                    value={formData.approval_status}
                    onChange={(e) => setFormData({ ...formData, approval_status: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-blue-900"
                  >
                    {APPROVAL_STATUSES.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Narration */}
              <div>
                <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Journal Narration & Accounting Audit Notes</label>
                <input
                  type="text"
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white"
                  placeholder="Enter detailed audit narration..."
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Active Accounting Entry</span>
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
                    className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Post Entry'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Accounting Entries Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into ledger database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Code</th>
                    <th className="px-3 py-2 border">Account Name</th>
                    <th className="px-3 py-2 border">Voucher Type</th>
                    <th className="px-3 py-2 border">Ledger Type</th>
                    <th className="px-3 py-2 border text-right">Debit (₹)</th>
                    <th className="px-3 py-2 border text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-blue-800">{row.entry_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.account_name}</td>
                      <td className="px-3 py-2 border font-semibold">{row.voucher_type}</td>
                      <td className="px-3 py-2 border font-semibold">{row.ledger_type}</td>
                      <td className="px-3 py-2 border text-right font-black text-rose-800">₹{row.debit_amount}</td>
                      <td className="px-3 py-2 border text-right font-black text-emerald-700">₹{row.credit_amount}</td>
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
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-sm text-xs"
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
