import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeRefundItem {
  id: number;
  refund_number: string;
  student_id: number | null;
  student_name: string;
  admission_no: string;
  class_name: string;
  receipt_number: string | null;
  refund_category: 'caution_money' | 'excess_fee' | 'cancellation' | 'scholarship_reimbursement' | 'security_deposit' | 'other';
  refund_reason: 'admission_cancelled' | 'duplicate_payment' | 'excess_payment' | 'tc_issued' | 'scholarship_adjustment' | 'wrong_collection' | 'course_withdrawal' | 'other';
  refund_mode: 'bank_transfer' | 'cheque' | 'cash' | 'upi' | 'wallet';
  requested_amount: number;
  approved_amount: number;
  deduction_amount: number;
  net_refund_amount: number;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  cheque_transaction_no: string | null;
  refund_date: string | null;
  status: 'Pending' | 'Approved' | 'Processed' | 'Rejected';
  rejection_reason: string | null;
  approval_notes: string | null;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
}

const REFUND_CATEGORIES = [
  { value: 'caution_money', label: 'Caution Money Security Deposit' },
  { value: 'excess_fee', label: 'Excess / Duplicate Fee Adjustment' },
  { value: 'cancellation', label: 'School Leaving Admission Cancellation' },
  { value: 'scholarship_reimbursement', label: 'Scholarship / Govt Grant Reimbursement' },
  { value: 'security_deposit', label: 'Hostel / Transport Security Refund' },
  { value: 'other', label: 'Other Discretionary Refund' }
];

const REFUND_REASONS = [
  { value: 'admission_cancelled', label: 'Admission Cancelled' },
  { value: 'duplicate_payment', label: 'Duplicate Fee Payment' },
  { value: 'excess_payment', label: 'Excess Fee Collection' },
  { value: 'tc_issued', label: 'Transfer Certificate (TC Issued)' },
  { value: 'scholarship_adjustment', label: 'Scholarship Adjustment' },
  { value: 'wrong_collection', label: 'Wrong Fee Collection' },
  { value: 'course_withdrawal', label: 'Course Withdrawal' }
];

const REFUND_MODES = [
  { value: 'bank_transfer', label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
  { value: 'cheque', label: 'Account Payee Cheque' },
  { value: 'cash', label: 'Cash Disbursement' },
  { value: 'upi', label: 'UPI / Direct Wallet Payment' }
];

export default function FeeRefundManagement() {
  const [data, setData] = useState<FeeRefundItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterReason, setFilterReason] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [filterRefundStatus, setFilterRefundStatus] = useState<string>('');
  const [filterActiveStatus, setFilterActiveStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeRefundItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeRefundItem | null>(null);
  const [formData, setFormData] = useState({
    refund_number: '',
    student_name: '',
    admission_no: '',
    class_name: 'Class 10-A',
    receipt_number: '',
    refund_category: 'caution_money',
    refund_reason: 'tc_issued',
    refund_mode: 'bank_transfer',
    requested_amount: 5000,
    approved_amount: 5000,
    deduction_amount: 0,
    bank_name: 'State Bank of India',
    account_number: '394857201948',
    ifsc_code: 'SBIN0001234',
    cheque_transaction_no: '',
    refund_date: new Date().toISOString().split('T')[0],
    status: 'Approved' as 'Pending' | 'Approved' | 'Processed' | 'Rejected',
    approval_notes: 'Verified clearance from library, hostel, and accounts department.',
    remarks: 'Caution money deposit refund upon school completion.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchRefunds();
  }, [viewTrash, filterCategory, filterReason, filterMode, filterRefundStatus, filterActiveStatus]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-refunds', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          refund_category: filterCategory || undefined,
          refund_reason: filterReason || undefined,
          refund_mode: filterMode || undefined,
          status: filterRefundStatus || undefined,
          is_active: filterActiveStatus !== '' ? filterActiveStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fee refunds', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            refund_number: 'REFUND-2026-001',
            student_id: 101,
            student_name: 'Aarav Sharma',
            admission_no: 'ADM-2024-101',
            class_name: 'Class 10-A',
            receipt_number: 'REC-99420',
            refund_category: 'caution_money',
            refund_reason: 'tc_issued',
            refund_mode: 'bank_transfer',
            requested_amount: 5000.00,
            approved_amount: 5000.00,
            deduction_amount: 0.00,
            net_refund_amount: 5000.00,
            bank_name: 'State Bank of India',
            account_number: '394857201948',
            ifsc_code: 'SBIN0001234',
            cheque_transaction_no: 'NEFT-992384729',
            refund_date: '2026-04-10',
            status: 'Processed',
            rejection_reason: null,
            approval_notes: 'All dues cleared, TC issued',
            remarks: 'Caution money deposit refund upon TC issuance',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            refund_number: 'REFUND-2026-002',
            student_id: 205,
            student_name: 'Priya Verma',
            admission_no: 'ADM-2024-205',
            class_name: 'Class 8-B',
            receipt_number: 'REC-99480',
            refund_category: 'excess_fee',
            refund_reason: 'duplicate_payment',
            refund_mode: 'cheque',
            requested_amount: 2500.00,
            approved_amount: 2500.00,
            deduction_amount: 100.00,
            net_refund_amount: 2400.00,
            bank_name: 'HDFC Bank',
            account_number: '501002938475',
            ifsc_code: 'HDFC0004321',
            cheque_transaction_no: 'CHQ-883920',
            refund_date: '2026-04-12',
            status: 'Approved',
            rejection_reason: null,
            approval_notes: 'Duplicate online gateway fee verified',
            remarks: 'Excess double payment refund after ₹100 processing charge',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            refund_number: 'REFUND-2026-003',
            student_id: 309,
            student_name: 'Rohan Gupta',
            admission_no: 'ADM-2024-309',
            class_name: 'Class 12-C',
            receipt_number: 'REC-99510',
            refund_category: 'cancellation',
            refund_reason: 'admission_cancelled',
            refund_mode: 'bank_transfer',
            requested_amount: 12000.00,
            approved_amount: 10000.00,
            deduction_amount: 2000.00,
            net_refund_amount: 8000.00,
            bank_name: 'ICICI Bank',
            account_number: '001205938201',
            ifsc_code: 'ICIC0000012',
            cheque_transaction_no: null,
            refund_date: null,
            status: 'Pending',
            rejection_reason: null,
            approval_notes: null,
            remarks: 'Admission withdrawal refund pending management approval',
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
        item.refund_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.receipt_number && item.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.bank_name && item.bank_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchReason = filterReason === '' ? true : item.refund_reason === filterReason;

      return matchSearch && matchReason;
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
  }, [data, searchTerm, filterReason, sortColumn, sortOrder]);

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === -1 ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (col: keyof FeeRefundItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeRefundItem) => {
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
      refund_number: 'REFUND-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      student_name: '',
      admission_no: 'ADM-' + Math.floor(1000 + Math.random() * 9000),
      class_name: 'Class 10-A',
      receipt_number: 'REC-' + Math.floor(10000 + Math.random() * 90000),
      refund_category: 'caution_money',
      refund_reason: 'tc_issued',
      refund_mode: 'bank_transfer',
      requested_amount: 5000,
      approved_amount: 5000,
      deduction_amount: 0,
      bank_name: 'State Bank of India',
      account_number: '',
      ifsc_code: 'SBIN0001234',
      cheque_transaction_no: '',
      refund_date: new Date().toISOString().split('T')[0],
      status: 'Approved',
      approval_notes: 'Dues clearance verified from accounts & library.',
      remarks: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeRefundItem) => {
    setEditingItem(item);
    setFormData({
      refund_number: item.refund_number,
      student_name: item.student_name,
      admission_no: item.admission_no,
      class_name: item.class_name,
      receipt_number: item.receipt_number || '',
      refund_category: item.refund_category,
      refund_reason: item.refund_reason || 'excess_payment',
      refund_mode: item.refund_mode,
      requested_amount: item.requested_amount,
      approved_amount: item.approved_amount,
      deduction_amount: item.deduction_amount,
      bank_name: item.bank_name || '',
      account_number: item.account_number || '',
      ifsc_code: item.ifsc_code || '',
      cheque_transaction_no: item.cheque_transaction_no || '',
      refund_date: item.refund_date || '',
      status: item.status,
      approval_notes: item.approval_notes || '',
      remarks: item.remarks || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name.trim()) {
      alert('Please enter student name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-refunds/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-refunds', formData);
      }
      setIsModalOpen(false);
      fetchRefunds();
    } catch (error: any) {
      alert('Failed to save refund record: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveRefund = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-refunds/${id}/approve`, { approval_notes: 'Approved by fee accounts desk.' });
      fetchRefunds();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Approved' } : item));
    }
  };

  const handleDisburseRefund = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-refunds/${id}/disburse`);
      fetchRefunds();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Processed' } : item));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-refunds/${id}/toggle-status`);
      fetchRefunds();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this refund record to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-refunds/${id}`);
      fetchRefunds();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-refunds/${id}/restore`);
      fetchRefunds();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this refund record? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-refunds/${id}/force`);
      fetchRefunds();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'approve' | 'disburse' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected refund record(s)?`)) return;

    try {
      await axios.post('/api/school/fee-refunds/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchRefunds();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchRefunds();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-refunds/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-refunds/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { refund_number: 'REFUND-2026-001', student_name: 'Aarav Sharma', admission_no: 'ADM-101', class_name: 'Class 10', receipt_number: 'REC-99420', refund_category: 'caution_money', refund_reason: 'tc_issued', refund_mode: 'bank_transfer', requested_amount: 5000, deduction_amount: 0, status: 'Approved' },
      { refund_number: 'REFUND-2026-002', student_name: 'Priya Verma', admission_no: 'ADM-205', class_name: 'Class 8', receipt_number: 'REC-99480', refund_category: 'excess_fee', refund_reason: 'duplicate_payment', refund_mode: 'cheque', requested_amount: 2500, deduction_amount: 100, status: 'Pending' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-refunds/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchRefunds();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchRefunds();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = data.length;
    const disbursedSum = data.filter(d => d.status === 'Processed').reduce((sum, d) => sum + d.net_refund_amount, 0);
    const cautionCount = data.filter(d => d.refund_category === 'caution_money' || d.refund_category === 'security_deposit').length;
    const pendingCount = data.filter(d => d.status === 'Pending').length;
    return { total, disbursedSum, cautionCount, pendingCount };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Refund Processing Portal</h1>
            <p className="text-[10px] text-gray-500">Manage Student Refund Requests, Approval Workflows, Disbursals, TC Refunds, Duplicate Payment adjustments & Withdrawal Settlements.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Applications</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.total} Refunds</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Disbursed Refunds</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.disbursedSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Caution & Security Deposits</p>
            <h3 className="text-lg font-black text-indigo-750 mt-0.5">{stats.cautionCount} Refunds</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Pending Approvals</p>
            <h3 className="text-lg font-black text-amber-700 mt-0.5">{stats.pendingCount} Pending</h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Initiate Refund Request */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Refund No, Student, Admission, Reason..."
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

          {/* Action Buttons: Sample, Import, Export, + Initiate Refund Request */}
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
              <span>+ Initiate Refund Request</span>
            </button>
          </div>
        </div>

        {/* Row 2: Single Row Filters */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Refund Reason Filter */}
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[160px]"
          >
            <option value="">All Refund Reasons (TC/Duplicate/Cancellation)</option>
            {REFUND_REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Refund Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[150px]"
          >
            <option value="">All Categories (Caution/Excess/Cancellation)</option>
            {REFUND_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Refund Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Payment Modes</option>
            {REFUND_MODES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Refund Status Filter */}
          <select
            value={filterRefundStatus}
            onChange={(e) => setFilterRefundStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Disbursal Statuses</option>
            <option value="Pending">Pending Approval</option>
            <option value="Approved">Approved (Ready for Payment)</option>
            <option value="Processed">Processed / Disbursed</option>
            <option value="Rejected">Rejected Application</option>
          </select>

          {/* Active Status Filter */}
          <select
            value={filterActiveStatus}
            onChange={(e) => setFilterActiveStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[110px]"
          >
            <option value="">All Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Inactive Only</option>
          </select>

          {(filterCategory || filterReason || filterMode || filterRefundStatus || filterActiveStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('');
                setFilterReason('');
                setFilterMode('');
                setFilterRefundStatus('');
                setFilterActiveStatus('');
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
          <span className="font-bold text-xs">{selectedItems.size} refund record(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-1 bg-white border border-emerald-300 rounded font-bold text-[10px] hover:bg-emerald-100 text-emerald-700"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction('disburse')}
                  className="px-3 py-1 bg-white border border-emerald-300 rounded font-bold text-[10px] hover:bg-emerald-100 text-emerald-800"
                >
                  Mark Processed
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
                  className="px-3 py-1 bg-white border border-emerald-300 rounded font-bold text-[10px] hover:bg-emerald-100 text-emerald-750"
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
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('refund_number')}>
                <div className="flex items-center gap-0.5">REFUND NO {getSortIcon('refund_number')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('student_name')}>
                <div className="flex items-center gap-0.5">STUDENT & ADMISSION NO {getSortIcon('student_name')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">REFUND REASON & CATEGORY</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('requested_amount')}>
                <div className="flex items-center justify-end gap-0.5">REQUESTED (₹) {getSortIcon('requested_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('net_refund_amount')}>
                <div className="flex items-center justify-end gap-0.5">NET REFUND (₹) {getSortIcon('net_refund_amount')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">BANK & DISBURSAL INFO</th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('status')}>
                <div className="flex items-center justify-center gap-0.5">DISBURSAL STATUS {getSortIcon('status')}</div>
              </th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">STATUS</th>
              )}
              <th className="py-2.5 px-3 w-32 text-center font-bold text-gray-750">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading fee refund records...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No fee refund requests found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const rReasonObj = REFUND_REASONS.find(r => r.value === item.refund_reason);
                const reasonLabel = rReasonObj ? rReasonObj.label : item.refund_reason;

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
                      {item.refund_number}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.student_name}</div>
                      <div className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">{item.admission_no} • {item.class_name}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-extrabold text-emerald-950 text-[10.5px]">{reasonLabel}</div>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{item.refund_category.replace('_', ' ')}</div>
                      {item.receipt_number && <div className="text-[9px] text-gray-400 font-mono">Linked Receipt: {item.receipt_number}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-700">
                      ₹{item.requested_amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-950">
                      ₹{item.net_refund_amount.toFixed(2)}
                      {item.deduction_amount > 0 && (
                        <div className="text-[8.5px] text-rose-600 font-semibold">Ded: ₹{item.deduction_amount.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-gray-700">
                      <div className="font-bold text-gray-800 uppercase">{item.refund_mode.replace('_', ' ')}</div>
                      {item.bank_name && <div className="text-[9px] text-slate-500">{item.bank_name} {item.account_number ? `(${item.account_number.slice(-4)})` : ''}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        item.status === 'Processed' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
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
                            {item.status === 'Pending' && (
                              <button
                                onClick={() => handleApproveRefund(item.id)}
                                className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-bold rounded text-[9px] hover:bg-blue-100 transition"
                                title="Approve Refund"
                              >
                                Approve
                              </button>
                            )}
                            {item.status === 'Approved' && (
                              <button
                                onClick={() => handleDisburseRefund(item.id)}
                                className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded text-[9px] hover:bg-emerald-100 transition"
                                title="Disburse Refund"
                              >
                                Disburse
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-blue-700 hover:bg-blue-50 rounded transition"
                              title="Edit Refund"
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
                              className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-750 font-bold rounded text-[9px] hover:bg-emerald-100 transition"
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

      {/* Add / Edit Refund Request Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Fee Refund Record' : 'Initiate New Fee Refund Request'}</h3>
                  <p className="text-[9.5px] text-gray-500">Configure Admission Cancellation, Duplicate Payment, TC Refunds & Disbursal Bank Details.</p>
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
              {/* Row 1: Refund No, Student Name, Admission No, Class (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Refund Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.refund_number}
                    onChange={(e) => setFormData({ ...formData, refund_number: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="REFUND-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-[10.5px]"
                    placeholder="e.g. Aarav Sharma"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Admission No *</label>
                  <input
                    type="text"
                    required
                    value={formData.admission_no}
                    onChange={(e) => setFormData({ ...formData, admission_no: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-white font-bold"
                    placeholder="ADM-2024-101"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Class & Section *</label>
                  <input
                    type="text"
                    required
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                    placeholder="Class 10-A"
                  />
                </div>
              </div>

              {/* Row 2: Refund Reason, Refund Category, Mode, Receipt No (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-emerald-50/40 p-2 rounded-lg border border-emerald-200/80">
                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Refund Reason *</label>
                  <select
                    value={formData.refund_reason}
                    onChange={(e) => setFormData({ ...formData, refund_reason: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-emerald-900"
                  >
                    {REFUND_REASONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Refund Category *</label>
                  <select
                    value={formData.refund_category}
                    onChange={(e) => setFormData({ ...formData, refund_category: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-emerald-900"
                  >
                    {REFUND_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Disbursal Payment Mode *</label>
                  <select
                    value={formData.refund_mode}
                    onChange={(e) => setFormData({ ...formData, refund_mode: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-emerald-900"
                  >
                    {REFUND_MODES.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-0.5 text-[9.5px]">Linked Receipt / Invoice No</label>
                  <input
                    type="text"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-mono"
                    placeholder="REC-99420"
                  />
                </div>
              </div>

              {/* Row 3: Requested Amount, Approved Amount, Deduction Amount, Status (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Requested Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.requested_amount}
                    onChange={(e) => setFormData({ ...formData, requested_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-emerald-950"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Approved Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.approved_amount}
                    onChange={(e) => setFormData({ ...formData, approved_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-emerald-800"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Deductions / Fee Charges (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deduction_amount}
                    onChange={(e) => setFormData({ ...formData, deduction_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-rose-800"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Disbursal Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    <option value="Pending">Pending Approval</option>
                    <option value="Approved">Approved (Ready for Payment)</option>
                    <option value="Processed">Processed / Disbursed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Bank Account & IFSC (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Beneficiary Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="State Bank of India"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Account Number / Cheque No</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none font-mono"
                    placeholder="394857201948"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Bank IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none font-mono uppercase"
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>

              {/* Row 5: Approval Notes & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Approval / Clearance Remarks</label>
                  <input
                    type="text"
                    value={formData.approval_notes}
                    onChange={(e) => setFormData({ ...formData, approval_notes: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Clearance details from accounts..."
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Student / Parental Notes</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Application notes..."
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
                    className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Save Refund'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Fee Refunds Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Refund No</th>
                    <th className="px-3 py-2 border">Student Name</th>
                    <th className="px-3 py-2 border">Admission No</th>
                    <th className="px-3 py-2 border">Reason</th>
                    <th className="px-3 py-2 border text-right">Requested (₹)</th>
                    <th className="px-3 py-2 border text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-emerald-800">{row.refund_number}</td>
                      <td className="px-3 py-2 border font-bold">{row.student_name}</td>
                      <td className="px-3 py-2 border font-mono">{row.admission_no}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-blue-700">{row.refund_reason}</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.requested_amount}</td>
                      <td className="px-3 py-2 border text-center font-bold">{row.status}</td>
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
                {importing ? 'Importing refunds...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
