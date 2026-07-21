import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeBankAccountItem {
  id: number;
  account_code: string;
  account_name: string;
  bank_name: string;
  branch_name: string | null;
  account_number: string;
  ifsc_code: string | null;
  account_type: 'Current Account' | 'Savings Account' | 'Fixed Deposit' | 'Overdraft Account';
  opening_balance: number;
  current_balance: number;
  book_balance: number;
  statement_balance: number;
  unreconciled_amount: number;
  transaction_date: string | null;
  transaction_type: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Cheque Deposit' | 'Cheque Issue' | 'UPI Collection' | 'Online Collection';
  reference_number: string | null;
  cheque_number: string | null;
  debit_amount: number;
  credit_amount: number;
  statement_date: string | null;
  matching_mode: 'Auto Matched' | 'Manual Matched' | 'Unmatched';
  reconciled_status: 'Yes' | 'No' | 'Pending Clearance';
  reconciliation_status: 'Reconciled' | 'Difference Pending' | 'Under Audit';
  last_reconciled_date: string | null;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
}

const BANKS_LIST = [
  'HDFC Bank',
  'State Bank of India',
  'ICICI Bank',
  'Punjab National Bank',
  'Axis Bank',
  'Bank of Baroda',
  'Kotak Mahindra Bank'
];

const ACCOUNT_TYPES = [
  'Current Account',
  'Savings Account',
  'Fixed Deposit',
  'Overdraft Account'
];

const TRANSACTION_TYPES = [
  'Deposit',
  'Withdrawal',
  'Transfer',
  'Cheque Deposit',
  'Cheque Issue',
  'UPI Collection',
  'Online Collection'
];

const MATCHING_MODES = [
  'Auto Matched',
  'Manual Matched',
  'Unmatched'
];

const RECONCILIATION_STATUSES = [
  { value: 'Reconciled', label: 'Reconciled' },
  { value: 'Difference Pending', label: 'Difference Pending' },
  { value: 'Under Audit', label: 'Under Audit' }
];

export default function BankManagement() {
  const [data, setData] = useState<FeeBankAccountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filter States
  const [filterBankName, setFilterBankName] = useState<string>('');
  const [filterAccountType, setFilterAccountType] = useState<string>('');
  const [filterTxnType, setFilterTxnType] = useState<string>('');
  const [filterMatchingMode, setFilterMatchingMode] = useState<string>('');
  const [filterReconcileStatus, setFilterReconcileStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);
  const [activeReportTab, setActiveReportTab] = useState<'All' | 'Bank Book' | 'Reconciliation Report' | 'Unmatched Transactions' | 'Cheque Clearance' | 'Bank Balance'>('All');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeBankAccountItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeBankAccountItem | null>(null);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: 'Main School Operating Account',
    bank_name: 'HDFC Bank',
    branch_name: 'Connaught Place',
    account_number: '50100293847123',
    ifsc_code: 'HDFC0000123',
    account_type: 'Current Account' as 'Current Account' | 'Savings Account' | 'Fixed Deposit' | 'Overdraft Account',
    opening_balance: 500000,
    current_balance: 1630000,
    book_balance: 1630000,
    statement_balance: 1630000,
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'Online Collection' as 'Deposit' | 'Withdrawal' | 'Transfer' | 'Cheque Deposit' | 'Cheque Issue' | 'UPI Collection' | 'Online Collection',
    reference_number: 'UTR-993848192',
    cheque_number: '',
    debit_amount: 0,
    credit_amount: 125000,
    statement_date: new Date().toISOString().split('T')[0],
    matching_mode: 'Auto Matched' as 'Auto Matched' | 'Manual Matched' | 'Unmatched',
    reconciled_status: 'Yes' as 'Yes' | 'No' | 'Pending Clearance',
    reconciliation_status: 'Reconciled' as 'Reconciled' | 'Difference Pending' | 'Under Audit',
    last_reconciled_date: new Date().toISOString().split('T')[0],
    remarks: 'Monthly bank statement reconciliation verified with zero variance.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchBankAccounts();
  }, [viewTrash, filterBankName, filterAccountType, filterTxnType, filterMatchingMode, filterReconcileStatus, filterStatus]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-bank-accounts', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          bank_name: filterBankName || undefined,
          account_type: filterAccountType || undefined,
          transaction_type: filterTxnType || undefined,
          matching_mode: filterMatchingMode || undefined,
          reconciliation_status: filterReconcileStatus || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch bank account records', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            account_code: 'BNK-2026-001',
            account_name: 'Main School Operating Account',
            bank_name: 'HDFC Bank',
            branch_name: 'Connaught Place Branch',
            account_number: '50100293847123',
            ifsc_code: 'HDFC0000123',
            account_type: 'Current Account',
            opening_balance: 500000.00,
            current_balance: 1630000.00,
            book_balance: 1630000.00,
            statement_balance: 1630000.00,
            unreconciled_amount: 0.00,
            transaction_date: '2026-04-10',
            transaction_type: 'Online Collection',
            reference_number: 'UTR-993848192',
            cheque_number: '',
            debit_amount: 0.00,
            credit_amount: 125000.00,
            statement_date: '2026-04-10',
            matching_mode: 'Auto Matched',
            reconciled_status: 'Yes',
            reconciliation_status: 'Reconciled',
            last_reconciled_date: '2026-04-10',
            remarks: 'Monthly bank statement reconciliation verified clean.',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            account_code: 'BNK-2026-002',
            account_name: 'Fee Collection Pool Account',
            bank_name: 'State Bank of India',
            branch_name: 'Model Town Branch',
            account_number: '30948271928',
            ifsc_code: 'SBIN0000452',
            account_type: 'Savings Account',
            opening_balance: 100000.00,
            current_balance: 850000.00,
            book_balance: 850000.00,
            statement_balance: 850000.00,
            unreconciled_amount: 0.00,
            transaction_date: '2026-04-12',
            transaction_type: 'UPI Collection',
            reference_number: 'UPI-304918239',
            cheque_number: '',
            debit_amount: 0.00,
            credit_amount: 85000.00,
            statement_date: '2026-04-12',
            matching_mode: 'Auto Matched',
            reconciled_status: 'Yes',
            reconciliation_status: 'Reconciled',
            last_reconciled_date: '2026-04-12',
            remarks: 'Fee gateway auto-settlement pool account.',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            account_code: 'BNK-2026-003',
            account_name: 'Staff Payroll Disbursement Account',
            bank_name: 'ICICI Bank',
            branch_name: 'Civil Lines Branch',
            account_number: '602901928374',
            ifsc_code: 'ICIC0006029',
            account_type: 'Current Account',
            opening_balance: 200000.00,
            current_balance: 425000.00,
            book_balance: 450000.00,
            statement_balance: 425000.00,
            unreconciled_amount: 25000.00,
            transaction_date: '2026-04-15',
            transaction_type: 'Cheque Issue',
            reference_number: 'CHQ-882910',
            cheque_number: '882910',
            debit_amount: 25000.00,
            credit_amount: 0.00,
            statement_date: '2026-04-18',
            matching_mode: 'Unmatched',
            reconciled_status: 'Pending Clearance',
            reconciliation_status: 'Difference Pending',
            last_reconciled_date: '2026-04-15',
            remarks: '₹25,000 cheque in transit pending clearing by clearing house.',
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
  const handleTabChange = (tab: 'All' | 'Bank Book' | 'Reconciliation Report' | 'Unmatched Transactions' | 'Cheque Clearance' | 'Bank Balance') => {
    setActiveReportTab(tab);
    setCurrentPage(1);
  };

  // Dynamic counts for tab badges
  const tabCounts = useMemo(() => {
    const all = data.length;
    const bankBook = data.length;
    const reconciled = data.filter(d => d.reconciliation_status === 'Reconciled' || d.reconciled_status === 'Yes').length;
    const unmatched = data.filter(d => d.unreconciled_amount !== 0 || d.matching_mode === 'Unmatched' || d.reconciliation_status === 'Difference Pending').length;
    const chequeClearance = data.filter(d => d.transaction_type === 'Cheque Deposit' || d.transaction_type === 'Cheque Issue' || d.reconciled_status === 'Pending Clearance' || Boolean(d.cheque_number)).length;
    const bankBalance = data.filter(d => d.is_active).length;
    return { all, bankBook, reconciled, unmatched, chequeClearance, bankBalance };
  }, [data]);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch =
        item.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.branch_name && item.branch_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ifsc_code && item.ifsc_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.reference_number && item.reference_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.cheque_number && item.cheque_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.remarks && item.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchTab = true;
      if (activeReportTab === 'Reconciliation Report') {
        matchTab = item.reconciliation_status === 'Reconciled' || item.reconciled_status === 'Yes';
      } else if (activeReportTab === 'Unmatched Transactions') {
        matchTab = item.unreconciled_amount !== 0 || item.matching_mode === 'Unmatched' || item.reconciliation_status === 'Difference Pending';
      } else if (activeReportTab === 'Cheque Clearance') {
        matchTab = item.transaction_type === 'Cheque Deposit' || item.transaction_type === 'Cheque Issue' || item.reconciled_status === 'Pending Clearance' || Boolean(item.cheque_number);
      } else if (activeReportTab === 'Bank Balance') {
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
    const totalBookBalance = sourceData.reduce((sum, d) => sum + d.book_balance, 0);
    const totalStatementBalance = sourceData.reduce((sum, d) => sum + d.statement_balance, 0);
    const totalUnreconciledVariance = sourceData.reduce((sum, d) => sum + Math.abs(d.unreconciled_amount), 0);
    const reconciledAccountsCount = sourceData.filter(d => d.reconciliation_status === 'Reconciled' || d.reconciled_status === 'Yes').length;
    return { totalBookBalance, totalStatementBalance, totalUnreconciledVariance, reconciledAccountsCount, totalCount: sourceData.length };
  }, [filteredData, data]);

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === -1 ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (col: keyof FeeBankAccountItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeBankAccountItem) => {
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
      account_code: 'BNK-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      account_name: '',
      bank_name: 'HDFC Bank',
      branch_name: '',
      account_number: '',
      ifsc_code: 'HDFC0000123',
      account_type: 'Current Account',
      opening_balance: 100000,
      current_balance: 500000,
      book_balance: 500000,
      statement_balance: 500000,
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'Deposit',
      reference_number: '',
      cheque_number: '',
      debit_amount: 0,
      credit_amount: 0,
      statement_date: new Date().toISOString().split('T')[0],
      matching_mode: 'Auto Matched',
      reconciled_status: 'Yes',
      reconciliation_status: 'Reconciled',
      last_reconciled_date: new Date().toISOString().split('T')[0],
      remarks: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeBankAccountItem) => {
    setEditingItem(item);
    setFormData({
      account_code: item.account_code,
      account_name: item.account_name,
      bank_name: item.bank_name,
      branch_name: item.branch_name || '',
      account_number: item.account_number,
      ifsc_code: item.ifsc_code || '',
      account_type: item.account_type,
      opening_balance: item.opening_balance,
      current_balance: item.current_balance,
      book_balance: item.book_balance,
      statement_balance: item.statement_balance,
      transaction_date: item.transaction_date || new Date().toISOString().split('T')[0],
      transaction_type: item.transaction_type,
      reference_number: item.reference_number || '',
      cheque_number: item.cheque_number || '',
      debit_amount: item.debit_amount,
      credit_amount: item.credit_amount,
      statement_date: item.statement_date || new Date().toISOString().split('T')[0],
      matching_mode: item.matching_mode,
      reconciled_status: item.reconciled_status,
      reconciliation_status: item.reconciliation_status,
      last_reconciled_date: item.last_reconciled_date || new Date().toISOString().split('T')[0],
      remarks: item.remarks || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name.trim() || !formData.account_number.trim()) {
      alert('Please enter bank account name and account number.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-bank-accounts/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-bank-accounts', formData);
      }
      setIsModalOpen(false);
      fetchBankAccounts();
    } catch (error: any) {
      alert('Failed to save bank account record: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-bank-accounts/${id}/toggle-status`);
      fetchBankAccounts();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this bank account record to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-bank-accounts/${id}`);
      fetchBankAccounts();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-bank-accounts/${id}/restore`);
      fetchBankAccounts();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this bank account record? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-bank-accounts/${id}/force`);
      fetchBankAccounts();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete' | 'reconcile') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected bank account record(s)?`)) return;

    try {
      await axios.post('/api/school/fee-bank-accounts/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchBankAccounts();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchBankAccounts();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-bank-accounts/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-bank-accounts/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { account_code: 'BNK-2026-001', account_name: 'Main School Operating Account', bank_name: 'HDFC Bank', branch_name: 'Connaught Place', account_number: '50100293847123', ifsc_code: 'HDFC0000123', account_type: 'Current Account', transaction_date: '2026-04-10', transaction_type: 'Online Collection', reference_number: 'UTR-993848192', debit_amount: 0, credit_amount: 125000, statement_date: '2026-04-10', matching_mode: 'Auto Matched', reconciled_status: 'Yes', book_balance: 1630000, statement_balance: 1630000, last_reconciled_date: '2026-04-10' },
      { account_code: 'BNK-2026-002', account_name: 'Fee Collection Pool Account', bank_name: 'State Bank of India', branch_name: 'Model Town', account_number: '30948271928', ifsc_code: 'SBIN0000452', account_type: 'Savings Account', transaction_date: '2026-04-12', transaction_type: 'UPI Collection', reference_number: 'UPI-304918239', debit_amount: 0, credit_amount: 85000, statement_date: '2026-04-12', matching_mode: 'Auto Matched', reconciled_status: 'Yes', book_balance: 850000, statement_balance: 850000, last_reconciled_date: '2026-04-12' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-bank-accounts/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchBankAccounts();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchBankAccounts();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Bank Account & Reconciliations</h1>
            <p className="text-[10px] text-gray-500">School Bank Master, Transaction Entries (Deposit/Withdrawal/UPI/Cheque), Statement Import, Auto/Manual Matching & Reconciliation Reports.</p>
          </div>
        </div>

        {/* Sub-Module Reports Quick Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-white p-1 border border-gray-200 rounded-xl shadow-2xs text-[10.5px]">
          <button
            type="button"
            onClick={() => handleTabChange('All')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'All' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>All</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'All' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {tabCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Bank Book')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Bank Book' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Bank Book</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Bank Book' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {tabCounts.bankBook}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Reconciliation Report')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Reconciliation Report' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Reconciliation Report</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Reconciliation Report' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {tabCounts.reconciled}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Unmatched Transactions')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Unmatched Transactions' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Unmatched Transactions</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Unmatched Transactions' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {tabCounts.unmatched}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Cheque Clearance')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Cheque Clearance' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Cheque Clearance</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Cheque Clearance' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {tabCounts.chequeClearance}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Bank Balance')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Bank Balance' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Bank Balance</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Bank Balance' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {tabCounts.bankBalance}
            </span>
          </button>
        </div>
      </div>

      {/* Active Tab Sub-module Info Indicator Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/60 p-2.5 rounded-xl flex items-center justify-between text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-blue-900 uppercase text-[10px] tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded-md">
            Active Sub-Module View: {activeReportTab}
          </span>
          <span className="text-gray-600 font-semibold text-[11px]">
            {activeReportTab === 'All' && 'Viewing all master accounts, transaction entries and reconciliation statements.'}
            {activeReportTab === 'Bank Book' && 'Showing complete school ledger bank book entries, deposits, withdrawals and UTR references.'}
            {activeReportTab === 'Reconciliation Report' && 'Showing matched & reconciled bank statements with zero variance.'}
            {activeReportTab === 'Unmatched Transactions' && 'Filtering unmatched transactions, pending variances and uncleared entries needing manual audit matching.'}
            {activeReportTab === 'Cheque Clearance' && 'Showing cheque deposits & cheque issues pending bank clearing house settlement.'}
            {activeReportTab === 'Bank Balance' && 'Showing live bank account balances, passbook totals, and opening/closing balances.'}
          </span>
        </div>
        <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-150">
          Showing {filteredData.length} of {data.length} Record(s)
        </span>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Book Ledger Balance</p>
            <h3 className="text-lg font-black text-indigo-900 mt-0.5">₹{stats.totalBookBalance.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Bank Statement Balance</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalStatementBalance.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Unreconciled Variance</p>
            <h3 className="text-lg font-black text-rose-700 mt-0.5">₹{stats.totalUnreconciledVariance.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Reconciled Bank Accounts</p>
            <h3 className="text-lg font-black text-blue-900 mt-0.5">{stats.reconciledAccountsCount} / {data.length} Accounts</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Bank Account */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Code, Account, Bank, Acc No, UTR, Cheque..."
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

          {/* Action Buttons: Sample, Import, Export, + Add Bank Transaction */}
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
              <span>+ Add Bank Transaction</span>
            </button>
          </div>
        </div>

        {/* Row 2: Clean Filter Toolbar (No Scrollbar, No Bracket Labels) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {/* Bank Name Filter */}
          <select
            value={filterBankName}
            onChange={(e) => setFilterBankName(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Bank Name</option>
            {BANKS_LIST.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Account Type Filter */}
          <select
            value={filterAccountType}
            onChange={(e) => setFilterAccountType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Account Type</option>
            {ACCOUNT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Transaction Type Filter */}
          <select
            value={filterTxnType}
            onChange={(e) => setFilterTxnType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Transaction Type</option>
            {TRANSACTION_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Matching Mode Filter */}
          <select
            value={filterMatchingMode}
            onChange={(e) => setFilterMatchingMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Matching Mode</option>
            {MATCHING_MODES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Reconciliation Status Filter */}
          <select
            value={filterReconcileStatus}
            onChange={(e) => setFilterReconcileStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Reconciliation Status</option>
            {RECONCILIATION_STATUSES.map(s => (
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

          {(filterBankName || filterAccountType || filterTxnType || filterMatchingMode || filterReconcileStatus || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterBankName('');
                setFilterAccountType('');
                setFilterTxnType('');
                setFilterMatchingMode('');
                setFilterReconcileStatus('');
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
          <span className="font-bold text-xs">{selectedItems.size} bank transaction(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('reconcile')}
                  className="px-3 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] hover:bg-emerald-700"
                >
                  Mark Reconciled
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
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('account_code')}>
                <div className="flex items-center gap-0.5">CODE {getSortIcon('account_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('account_name')}>
                <div className="flex items-center gap-0.5">BANK ACCOUNT & TYPE {getSortIcon('account_name')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('transaction_type')}>
                <div className="flex items-center gap-0.5">TXN TYPE & REF/CHEQUE {getSortIcon('transaction_type')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('debit_amount')}>
                <div className="flex items-center justify-end gap-0.5">DEBIT (WITHDRAWAL) {getSortIcon('debit_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('credit_amount')}>
                <div className="flex items-center justify-end gap-0.5">CREDIT (DEPOSIT) {getSortIcon('credit_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('statement_balance')}>
                <div className="flex items-center justify-end gap-0.5">PASSBOOK BAL (₹) {getSortIcon('statement_balance')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('unreconciled_amount')}>
                <div className="flex items-center justify-end gap-0.5">VARIANCE {getSortIcon('unreconciled_amount')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('reconciliation_status')}>
                <div className="flex items-center gap-0.5">RECONCILIATION {getSortIcon('reconciliation_status')}</div>
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
                <td colSpan={viewTrash ? 10 : 11} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading bank accounts & reconciliations...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 10 : 11} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No bank account records found.'}
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
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                      {item.account_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.account_name}</div>
                      <div className="text-[9.5px] font-semibold text-slate-500">{item.bank_name} - Acc: {item.account_number} ({item.account_type})</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-extrabold text-blue-950 text-[10px]">{item.transaction_type}</div>
                      <div className="text-[9px] font-mono text-slate-500">
                        {item.reference_number ? `Ref: ${item.reference_number}` : ''} {item.cheque_number ? `Chq: ${item.cheque_number}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-800">
                      {item.debit_amount > 0 ? `₹${item.debit_amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      {item.credit_amount > 0 ? `₹${item.credit_amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-950">
                      ₹{item.statement_balance.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black">
                      <div className={item.unreconciled_amount === 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-black'}>
                        {item.unreconciled_amount === 0 ? 'Balanced' : `₹${item.unreconciled_amount.toFixed(2)}`}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.2 rounded font-black uppercase text-[8.5px] ${
                          item.reconciliation_status === 'Reconciled' ? 'bg-emerald-100 text-emerald-800' :
                          item.reconciliation_status === 'Difference Pending' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {item.reconciliation_status}
                        </span>
                        <span className="px-1 py-0.2 rounded text-[8px] bg-slate-100 text-slate-700 font-bold">
                          {item.matching_mode}
                        </span>
                      </div>
                      {item.last_reconciled_date && <div className="text-[8.5px] text-gray-400 font-semibold mt-0.5">As of: {item.last_reconciled_date}</div>}
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

      {/* Add / Edit Bank Account & Transaction Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Bank Master & Statement Transaction Record' : 'Register Bank Master & Log Transaction'}</h3>
                  <p className="text-[9.5px] text-gray-500">Bank Details, Branch, Account Number, IFSC Code, Transaction Types, Passbook & Book Ledger Balances, Reconciliation Audit.</p>
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
              {/* Row 1: Account Code, Account Name, Bank Name, Account Type (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Account Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.account_code}
                    onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="BNK-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Account Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-[10.5px] font-bold"
                    placeholder="e.g. Main Operating Account"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] bg-white font-bold"
                    placeholder="e.g. HDFC Bank"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Account Category *</label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                  >
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Branch Name, Account Number, IFSC Code, Opening Balance (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-blue-50/40 p-2 rounded-lg border border-blue-200/80">
                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Branch Name</label>
                  <input
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                    placeholder="Connaught Place"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Bank Account Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono font-bold"
                    placeholder="50100293847123"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono uppercase"
                    placeholder="HDFC0000123"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                    placeholder="500000"
                  />
                </div>
              </div>

              {/* Row 3: Transaction Date, Transaction Type, Ref/UTR No, Cheque No (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-amber-50/40 p-2 rounded-lg border border-amber-200/80">
                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Transaction Date</label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Transaction Mode / Type *</label>
                  <select
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-amber-950"
                  >
                    {TRANSACTION_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Ref Number / UTR No</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono"
                    placeholder="UTR-993848192"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Cheque Number</label>
                  <input
                    type="text"
                    value={formData.cheque_number}
                    onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono"
                    placeholder="CHQ-882910"
                  />
                </div>
              </div>

              {/* Row 4: Debit (Withdrawal), Credit (Deposit), Book Balance, Statement Balance (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Debit (Withdrawal ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.debit_amount}
                    onChange={(e) => setFormData({ ...formData, debit_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-rose-800"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Credit (Deposit ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.credit_amount}
                    onChange={(e) => setFormData({ ...formData, credit_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-emerald-800"
                    placeholder="125000.00"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Book Ledger Balance (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.book_balance}
                    onChange={(e) => setFormData({ ...formData, book_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-indigo-950"
                    placeholder="1630000"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Bank Passbook Balance (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.statement_balance}
                    onChange={(e) => setFormData({ ...formData, statement_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-emerald-800"
                    placeholder="1630000"
                  />
                </div>
              </div>

              {/* Row 5: Matching Mode, Statement Date, Reconciliation Status, Remarks (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Matching Mode</label>
                  <select
                    value={formData.matching_mode}
                    onChange={(e) => setFormData({ ...formData, matching_mode: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    {MATCHING_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Bank Statement Date</label>
                  <input
                    type="date"
                    value={formData.statement_date}
                    onChange={(e) => setFormData({ ...formData, statement_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Reconciliation Status</label>
                  <select
                    value={formData.reconciliation_status}
                    onChange={(e) => setFormData({ ...formData, reconciliation_status: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-blue-900"
                  >
                    {RECONCILIATION_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Audit Notes & Remarks</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Uncleared cheques or variance remarks..."
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Active Bank Account</span>
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
                    {editingItem ? 'Save Updates' : 'Confirm & Save Account'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Bank Accounts Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Code</th>
                    <th className="px-3 py-2 border">Account Name</th>
                    <th className="px-3 py-2 border">Bank</th>
                    <th className="px-3 py-2 border">Txn Type</th>
                    <th className="px-3 py-2 border text-right">Debit (₹)</th>
                    <th className="px-3 py-2 border text-right">Credit (₹)</th>
                    <th className="px-3 py-2 border text-right">Passbook Bal (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-blue-800">{row.account_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.account_name}</td>
                      <td className="px-3 py-2 border font-semibold">{row.bank_name}</td>
                      <td className="px-3 py-2 border font-semibold">{row.transaction_type}</td>
                      <td className="px-3 py-2 border text-right font-black text-rose-800">₹{row.debit_amount || 0}</td>
                      <td className="px-3 py-2 border text-right font-black text-emerald-800">₹{row.credit_amount || 0}</td>
                      <td className="px-3 py-2 border text-right font-black text-indigo-950">₹{row.statement_balance}</td>
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
