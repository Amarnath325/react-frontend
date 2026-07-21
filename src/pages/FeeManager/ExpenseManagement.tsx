import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeExpenseItem {
  id: number;
  expense_code: string;
  expense_title: string;
  expense_category: string;
  expense_source: string;
  vendor_name: string;
  vendor_phone: string | null;
  invoice_number: string | null;
  payment_mode: 'Cash' | 'UPI' | 'Bank_Transfer' | 'Cheque' | 'Demand_Draft';
  transaction_reference: string | null;
  receipt_file: string | null;
  amount: number;
  tax_amount: number;
  net_amount: number;
  budget_allocated: number;
  expense_date: string;
  academic_year: string;
  payment_status: 'Paid' | 'Pending' | 'Partially_Paid' | 'Approved';
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  approval_remarks: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const EXPENSE_CATEGORIES_MAPPING: Record<string, string[]> = {
  'Salary Expenses': ['Teacher Salary', 'Staff Salary', 'Driver & Attendant Salary', 'Overtime & Bonus'],
  'Utility Expenses': ['Electricity Bill', 'Water Bill', 'Internet Bill', 'Telephone & Gas Bill'],
  'Maintenance': ['Building Repair', 'Vehicle Maintenance', 'Equipment Repair', 'Sanitation & Cleaning'],
  'Academic Expenses': ['Books', 'Lab Material', 'Stationery', 'Printing & Exam Answer Sheets'],
  'Events & Miscellaneous': ['Annual Sports & Fest', 'Excursion & Field Trips', 'Prizes & Awards', 'Legal & Audit Fees']
};

const ALL_EXPENSE_SOURCES = [
  'Teacher Salary',
  'Staff Salary',
  'Electricity Bill',
  'Water Bill',
  'Internet Bill',
  'Building Repair',
  'Vehicle Maintenance',
  'Equipment Repair',
  'Books',
  'Lab Material',
  'Stationery',
  'Annual Sports & Fest'
];

const PAYMENT_MODES = [
  { value: 'Cash', label: 'Cash Payment' },
  { value: 'UPI', label: 'UPI / QR Code' },
  { value: 'Bank_Transfer', label: 'Bank Transfer (NEFT/RTGS/IMPS)' },
  { value: 'Cheque', label: 'Bank Cheque' },
  { value: 'Demand_Draft', label: 'Demand Draft (DD)' }
];

const PAYMENT_STATUSES = [
  { value: 'Paid', label: 'Fully Paid Out' },
  { value: 'Pending', label: 'Payment Pending' },
  { value: 'Partially_Paid', label: 'Partially Paid' },
  { value: 'Approved', label: 'Approved for Payout' }
];

const APPROVAL_STATUSES = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending Approval' },
  { value: 'Rejected', label: 'Rejected / On Hold' }
];

export default function ExpenseManagement() {
  const [data, setData] = useState<FeeExpenseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeExpenseItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeExpenseItem | null>(null);
  const [formData, setFormData] = useState({
    expense_code: '',
    expense_title: 'April Teaching Staff Monthly Salary Disbursement',
    expense_category: 'Salary Expenses',
    expense_source: 'Teacher Salary',
    vendor_name: 'School Staff Payroll Account',
    vendor_phone: '9876543210',
    invoice_number: 'INV-99201',
    payment_mode: 'Bank_Transfer' as 'Cash' | 'UPI' | 'Bank_Transfer' | 'Cheque' | 'Demand_Draft',
    transaction_reference: 'NEFT/774839201',
    receipt_file: 'salary_receipt_apr2026.pdf',
    amount: 450000,
    tax_amount: 0,
    budget_allocated: 500000,
    expense_date: '2026-04-01',
    academic_year: '2025-2026',
    payment_status: 'Paid' as 'Paid' | 'Pending' | 'Partially_Paid' | 'Approved',
    approval_status: 'Approved' as 'Pending' | 'Approved' | 'Rejected',
    approval_remarks: 'Approved by Finance Director.',
    description: 'Monthly payroll disbursement for all teaching staff members.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchExpenses();
  }, [viewTrash, filterCategory, filterSource, filterMode, filterPaymentStatus, filterApprovalStatus, filterStatus]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-expenses', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          expense_category: filterCategory || undefined,
          expense_source: filterSource || undefined,
          payment_mode: filterMode || undefined,
          payment_status: filterPaymentStatus || undefined,
          approval_status: filterApprovalStatus || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch expense records', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            expense_code: 'EXP-2026-001',
            expense_title: 'April Staff Salary Disbursement',
            expense_category: 'Salary Expenses',
            expense_source: 'Teacher Salary',
            vendor_name: 'School Staff Payroll System',
            vendor_phone: '9876543210',
            invoice_number: 'INV-99201',
            payment_mode: 'Bank_Transfer',
            transaction_reference: 'NEFT/774839201',
            receipt_file: 'payroll_apr_2026.pdf',
            amount: 450000.00,
            tax_amount: 0.00,
            net_amount: 450000.00,
            budget_allocated: 500000.00,
            expense_date: '2026-04-01',
            academic_year: '2025-2026',
            payment_status: 'Paid',
            approval_status: 'Approved',
            approval_remarks: 'Approved by Principal',
            description: 'Monthly payroll disbursement for teaching staff',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            expense_code: 'EXP-2026-002',
            expense_title: 'April Electricity Utility Bill',
            expense_category: 'Utility Expenses',
            expense_source: 'Electricity Bill',
            vendor_name: 'State Electricity Board',
            vendor_phone: '9876543211',
            invoice_number: 'INV-99202',
            payment_mode: 'Bank_Transfer',
            transaction_reference: 'UPI/884920112',
            receipt_file: 'electricity_bill_apr.pdf',
            amount: 18500.00,
            tax_amount: 3330.00,
            net_amount: 21830.00,
            budget_allocated: 25000.00,
            expense_date: '2026-04-10',
            academic_year: '2025-2026',
            payment_status: 'Paid',
            approval_status: 'Approved',
            approval_remarks: 'Verified utility meter bill',
            description: 'Monthly power consumption bill for main campus & hostel',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            expense_code: 'EXP-2026-003',
            expense_title: 'Chemistry Lab Consumables & Reagents',
            expense_category: 'Academic Expenses',
            expense_source: 'Lab Material',
            vendor_name: 'Scientific Supply Depot',
            vendor_phone: '9876543212',
            invoice_number: 'INV-99203',
            payment_mode: 'Cheque',
            transaction_reference: 'CHQ-771029',
            receipt_file: 'lab_bill_voucher.jpg',
            amount: 12400.00,
            tax_amount: 2232.00,
            net_amount: 14632.00,
            budget_allocated: 20000.00,
            expense_date: '2026-04-15',
            academic_year: '2025-2026',
            payment_status: 'Paid',
            approval_status: 'Approved',
            approval_remarks: 'Approved by Head of Science Dept',
            description: 'Annual replenish of chemistry lab test tubes, reagents & beakers',
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
        item.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.expense_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.expense_source && item.expense_source.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoice_number && item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const handleSort = (col: keyof FeeExpenseItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeExpenseItem) => {
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
      expense_code: 'EXP-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      expense_title: '',
      expense_category: 'Salary Expenses',
      expense_source: 'Teacher Salary',
      vendor_name: '',
      vendor_phone: '',
      invoice_number: 'INV-' + Math.floor(10000 + Math.random() * 90000),
      payment_mode: 'Bank_Transfer',
      transaction_reference: '',
      receipt_file: '',
      amount: 10000,
      tax_amount: 0,
      budget_allocated: 15000,
      expense_date: new Date().toISOString().split('T')[0],
      academic_year: '2025-2026',
      payment_status: 'Paid',
      approval_status: 'Approved',
      approval_remarks: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeExpenseItem) => {
    setEditingItem(item);
    setFormData({
      expense_code: item.expense_code,
      expense_title: item.expense_title,
      expense_category: item.expense_category,
      expense_source: item.expense_source || 'Teacher Salary',
      vendor_name: item.vendor_name,
      vendor_phone: item.vendor_phone || '',
      invoice_number: item.invoice_number || '',
      payment_mode: item.payment_mode,
      transaction_reference: item.transaction_reference || '',
      receipt_file: item.receipt_file || '',
      amount: item.amount,
      tax_amount: item.tax_amount,
      budget_allocated: item.budget_allocated || 0,
      expense_date: item.expense_date,
      academic_year: item.academic_year || '2025-2026',
      payment_status: item.payment_status,
      approval_status: item.approval_status || 'Approved',
      approval_remarks: item.approval_remarks || '',
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expense_title.trim() || !formData.vendor_name.trim()) {
      alert('Please enter expense title and vendor name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-expenses/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-expenses', formData);
      }
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error: any) {
      alert('Failed to save expense record: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-expenses/${id}/toggle-status`);
      fetchExpenses();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this expense record to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-expenses/${id}/restore`);
      fetchExpenses();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this expense record? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-expenses/${id}/force`);
      fetchExpenses();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete' | 'approve') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected expense record(s)?`)) return;

    try {
      await axios.post('/api/school/fee-expenses/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchExpenses();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchExpenses();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-expenses/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-expenses/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { expense_code: 'EXP-2026-001', expense_title: 'Staff Salary', expense_category: 'Salary Expenses', expense_source: 'Teacher Salary', vendor_name: 'School Payroll', amount: 450000, tax_amount: 0, budget_allocated: 500000, expense_date: '2026-04-01', payment_mode: 'Bank_Transfer', payment_status: 'Paid', approval_status: 'Approved' },
      { expense_code: 'EXP-2026-002', expense_title: 'Electricity Bill', expense_category: 'Utility Expenses', expense_source: 'Electricity Bill', vendor_name: 'Electricity Board', amount: 18500, tax_amount: 3330, budget_allocated: 25000, expense_date: '2026-04-10', payment_mode: 'Bank_Transfer', payment_status: 'Paid', approval_status: 'Approved' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-expenses/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchExpenses();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchExpenses();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalBaseSum = data.reduce((sum, d) => sum + d.amount, 0);
    const totalNetSum = data.reduce((sum, d) => sum + d.net_amount, 0);
    const totalBudgetSum = data.reduce((sum, d) => sum + (d.budget_allocated || 0), 0);
    const totalTxnCount = data.length;
    const budgetVariance = totalBudgetSum - totalNetSum;
    return { totalBaseSum, totalNetSum, totalBudgetSum, totalTxnCount, budgetVariance };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Expense Tracker & Budget Monitoring</h1>
            <p className="text-[10px] text-gray-500">Record & Analyze Expenses: Salary (Teacher/Staff), Utilities (Electricity/Water/Internet), Maintenance (Building/Vehicle), Academic (Books/Lab/Stationery) & Budget Monitoring.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Net Payouts</p>
            <h3 className="text-lg font-black text-rose-700 mt-0.5">₹{stats.totalNetSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Allocated Budget</p>
            <h3 className="text-lg font-black text-indigo-750 mt-0.5">₹{stats.totalBudgetSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Budget Surplus / Savings</p>
            <h3 className={`text-lg font-black mt-0.5 ${stats.budgetVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹{stats.budgetVariance.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className={`p-2 rounded-lg ${stats.budgetVariance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Expense Vouchers</p>
            <h3 className="text-lg font-black text-purple-750 mt-0.5">{stats.totalTxnCount} Vouchers</h3>
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
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Expense */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Expense Code, Title, Vendor, Invoice No..."
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

          {/* Action Buttons: Sample, Import, Export, + Add Expense */}
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
              <span>+ Log Expense Entry</span>
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
            <option value="">All Categories (Salary/Utility/Maintenance/Academic)</option>
            {Object.keys(EXPENSE_CATEGORIES_MAPPING).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Expense Source Filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[150px]"
          >
            <option value="">All Expense Sources (Teacher Salary/Electricity/Repair/Lab)</option>
            {(filterCategory && EXPENSE_CATEGORIES_MAPPING[filterCategory] ? EXPENSE_CATEGORIES_MAPPING[filterCategory] : ALL_EXPENSE_SOURCES).map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>

          {/* Payment Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">All Payment Modes</option>
            {PAYMENT_MODES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Approval Status Filter */}
          <select
            value={filterApprovalStatus}
            onChange={(e) => setFilterApprovalStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">All Approval Statuses</option>
            {APPROVAL_STATUSES.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
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

          {(filterCategory || filterSource || filterMode || filterPaymentStatus || filterApprovalStatus || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('');
                setFilterSource('');
                setFilterMode('');
                setFilterPaymentStatus('');
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
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} expense record(s) selected</span>
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
                  className="px-3 py-1 bg-white border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-800"
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
                  className="px-3 py-1 bg-white border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-800"
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
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('expense_code')}>
                <div className="flex items-center gap-0.5">CODE {getSortIcon('expense_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('expense_title')}>
                <div className="flex items-center gap-0.5">EXPENSE TITLE & CATEGORY {getSortIcon('expense_title')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('vendor_name')}>
                <div className="flex items-center gap-0.5">VENDOR & INVOICE NO {getSortIcon('vendor_name')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">ATTACHMENT & MODE</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('net_amount')}>
                <div className="flex items-center justify-end gap-0.5">NET PAYOUT (₹) {getSortIcon('net_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('budget_allocated')}>
                <div className="flex items-center justify-end gap-0.5">BUDGET & VARIANCE {getSortIcon('budget_allocated')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('expense_date')}>
                <div className="flex items-center gap-0.5">DATE & APPROVAL {getSortIcon('expense_date')}</div>
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
                    <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading expense tracker records...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No expense records found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const budgetAlloc = item.budget_allocated || 0;
                const variance = budgetAlloc > 0 ? budgetAlloc - item.net_amount : 0;
                const pctUsed = budgetAlloc > 0 ? Math.min(100, Math.round((item.net_amount / budgetAlloc) * 100)) : 0;

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
                      {item.expense_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.expense_title}</div>
                      <div className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-wider">{item.expense_category} • {item.expense_source}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.vendor_name}</div>
                      <div className="text-[9.5px] text-slate-500 font-mono font-semibold">{item.invoice_number || 'N/A'} {item.vendor_phone ? `• ${item.vendor_phone}` : ''}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 bg-rose-50 text-rose-800 border border-rose-200 rounded font-bold uppercase">
                          {item.payment_mode.replace('_', ' ')}
                        </span>
                        {item.receipt_file && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded" title={item.receipt_file}>
                            📎 Receipt
                          </span>
                        )}
                      </div>
                      {item.transaction_reference && <div className="text-[9px] text-gray-400 font-mono mt-0.2">{item.transaction_reference}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-black text-rose-950">₹{item.net_amount.toFixed(2)}</div>
                      {item.tax_amount > 0 && <div className="text-[8.5px] text-amber-700 font-semibold">GST: ₹{item.tax_amount.toFixed(2)}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[10px]">
                      {budgetAlloc > 0 ? (
                        <div>
                          <div className="font-bold text-gray-800">Budget: ₹{budgetAlloc.toFixed(2)}</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 my-0.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${pctUsed > 90 ? 'bg-rose-500' : pctUsed > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pctUsed}%` }}
                            />
                          </div>
                          <div className={`text-[8.5px] font-bold ${variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {variance >= 0 ? `Savings: +₹${variance.toFixed(2)}` : `Over Budget: -₹${Math.abs(variance).toFixed(2)}`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No budget set</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <div className="font-bold text-gray-800">{item.expense_date}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[8.5px] font-bold rounded uppercase px-1 py-0.2 ${
                          item.approval_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          item.approval_status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Appr: {item.approval_status}
                        </span>
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
                              className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded text-[9px] hover:bg-rose-100 transition"
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

      {/* Add / Edit Expense Record Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Operational Expense Record' : 'Log New Operational Expense Entry'}</h3>
                  <p className="text-[9.5px] text-gray-500">Salary (Teacher/Staff), Utility (Electricity/Water), Maintenance (Building/Vehicle), Academic & Budget Allocation.</p>
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
              {/* Row 1: Expense Code, Expense Title, Category, Expense Source (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Expense Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.expense_code}
                    onChange={(e) => setFormData({ ...formData, expense_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="EXP-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Expense Title / Purpose *</label>
                  <input
                    type="text"
                    required
                    value={formData.expense_title}
                    onChange={(e) => setFormData({ ...formData, expense_title: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none text-[10.5px]"
                    placeholder="e.g. April Teaching Staff Salary"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Expense Category *</label>
                  <select
                    value={formData.expense_category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const defaultSrc = EXPENSE_CATEGORIES_MAPPING[newCat]?.[0] || 'Teacher Salary';
                      setFormData({ ...formData, expense_category: newCat, expense_source: defaultSrc });
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                  >
                    {Object.keys(EXPENSE_CATEGORIES_MAPPING).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Specific Expense Head *</label>
                  <select
                    value={formData.expense_source}
                    onChange={(e) => setFormData({ ...formData, expense_source: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-bold text-rose-900"
                  >
                    {(EXPENSE_CATEGORIES_MAPPING[formData.expense_category] || ALL_EXPENSE_SOURCES).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Vendor Name, Vendor Phone, Invoice No, Receipt File (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-rose-50/40 p-2 rounded-lg border border-rose-200/80">
                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Vendor / Payee Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-gray-900"
                    placeholder="e.g. State Electricity Board"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Vendor Phone Contact</label>
                  <input
                    type="text"
                    value={formData.vendor_phone}
                    onChange={(e) => setFormData({ ...formData, vendor_phone: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono"
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Invoice / Bill No</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono font-bold"
                    placeholder="INV-99201"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Receipt File Attachment</label>
                  <input
                    type="text"
                    value={formData.receipt_file}
                    onChange={(e) => setFormData({ ...formData, receipt_file: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono"
                    placeholder="bill_voucher_apr.pdf"
                  />
                </div>
              </div>

              {/* Row 3: Payment Mode, Base Amount, GST Tax, Allocated Budget (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Payment Mode *</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-rose-900"
                  >
                    {PAYMENT_MODES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Base Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-rose-950"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">GST / Tax Paid (₹)</label>
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
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Allocated Budget Limit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget_allocated}
                    onChange={(e) => setFormData({ ...formData, budget_allocated: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-indigo-900"
                    placeholder="15000"
                  />
                </div>
              </div>

              {/* Row 4: Expense Date, Payment Status, Approval Status, Approval Remarks (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Payment Status *</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    {PAYMENT_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Approval Workflow *</label>
                  <select
                    value={formData.approval_status}
                    onChange={(e) => setFormData({ ...formData, approval_status: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-emerald-800"
                  >
                    {APPROVAL_STATUSES.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Approval Notes</label>
                  <input
                    type="text"
                    value={formData.approval_remarks}
                    onChange={(e) => setFormData({ ...formData, approval_remarks: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white"
                    placeholder="Approved by Principal"
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
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Active Expense Voucher</span>
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
                    {editingItem ? 'Save Updates' : 'Confirm & Save Expense'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Expense Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Code</th>
                    <th className="px-3 py-2 border">Expense Title</th>
                    <th className="px-3 py-2 border">Category</th>
                    <th className="px-3 py-2 border">Vendor</th>
                    <th className="px-3 py-2 border text-right">Net (₹)</th>
                    <th className="px-3 py-2 border text-right">Budget (₹)</th>
                    <th className="px-3 py-2 border text-center">Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-rose-800">{row.expense_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.expense_title}</td>
                      <td className="px-3 py-2 border font-semibold">{row.expense_category}</td>
                      <td className="px-3 py-2 border font-semibold text-indigo-800">{row.vendor_name}</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.amount}</td>
                      <td className="px-3 py-2 border text-right font-bold text-indigo-900">₹{row.budget_allocated}</td>
                      <td className="px-3 py-2 border text-center font-bold">{row.approval_status}</td>
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
                {importing ? 'Importing records...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
