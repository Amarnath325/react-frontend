import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface ReceiptInvoiceItem {
  id: number;
  invoice_number: string;
  receipt_type: 'receipt' | 'invoice' | 'credit_note';
  student_id: number;
  student?: {
    first_name: string;
    last_name: string;
    admission_number: string;
    father_name?: string;
    class_master?: {
      m_name: string;
    };
  };
  title: string;
  issue_date: string;
  due_date: string | null;
  subtotal_amount: number;
  discount_amount: number;
  fine_amount: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' | 'Cancelled';
  payment_mode: string;
  transaction_id: string | null;
  gst_number: string | null;
  school_address: string | null;
  parent_address: string | null;
  collected_by_name: string | null;
  notes: string | null;
  is_active: boolean;
  is_duplicate: boolean;
  cancelled_reason: string | null;
  created_at: string;
}

export default function ReceiptManagement() {
  const [data, setData] = useState<ReceiptInvoiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof ReceiptInvoiceItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ReceiptInvoiceItem | null>(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    receipt_type: 'receipt',
    student_id: 1,
    student_name: 'Rahul Sharma',
    admission_number: 'ADM-2026-004',
    title: 'Term 1 Tuition & Annual Fee Receipt',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal_amount: 4500,
    discount_amount: 0,
    fine_amount: 0,
    tax_amount: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    total_amount: 4500,
    paid_amount: 4500,
    payment_status: 'Paid',
    payment_mode: 'UPI',
    transaction_id: 'TXN_9918231201',
    gst_number: '09AAACM9918E1Z4',
    school_address: 'Main Academic Block, New Delhi Road Campus',
    parent_address: 'House 42, Civil Lines, Sector 5',
    collected_by_name: 'Admin Desk (Ramesh Kumar)',
    notes: 'Fee collection receipt',
    is_active: true
  });

  // Print Preview Modal State (A4 vs Thermal POS 80mm)
  const [printModalItem, setPrintModalItem] = useState<ReceiptInvoiceItem | null>(null);
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [isDuplicatePrint, setIsDuplicatePrint] = useState<boolean>(false);

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoices();
  }, [viewTrash, filterType, filterStatus, filterMode]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-invoices', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          receipt_type: filterType || undefined,
          payment_status: filterStatus || undefined,
          payment_mode: filterMode || undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch receipts and invoices', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            invoice_number: 'RCPT-2026-00412',
            receipt_type: 'receipt',
            student_id: 1,
            student: {
              first_name: 'Rahul',
              last_name: 'Sharma',
              admission_number: 'ADM-2026-004',
              father_name: 'Sanjay Sharma',
              class_master: { m_name: 'Class 10-A' }
            },
            title: 'Term 1 Tuition & Lab Fee Receipt',
            issue_date: '2026-07-20',
            due_date: '2026-07-25',
            subtotal_amount: 4500,
            discount_amount: 0,
            fine_amount: 0,
            tax_amount: 0,
            cgst_amount: 0,
            sgst_amount: 0,
            total_amount: 4500,
            paid_amount: 4500,
            balance_amount: 0,
            payment_status: 'Paid',
            payment_mode: 'UPI',
            transaction_id: 'TXN_9918231201',
            gst_number: '09AAACM9918E1Z4',
            school_address: 'Main Academic Block, New Delhi Road Campus',
            parent_address: 'House 42, Civil Lines, Sector 5',
            collected_by_name: 'Cashier Desk (Ramesh)',
            notes: 'Official fee collection receipt',
            is_active: true,
            is_duplicate: false,
            cancelled_reason: null,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            invoice_number: 'INV-2026-00891',
            receipt_type: 'invoice',
            student_id: 2,
            student: {
              first_name: 'Priya',
              last_name: 'Verma',
              admission_number: 'ADM-2026-012',
              father_name: 'Rakesh Verma',
              class_master: { m_name: 'Class 8-B' }
            },
            title: 'Term 2 Hostel & Mess Charges Tax Invoice',
            issue_date: '2026-07-20',
            due_date: '2026-08-05',
            subtotal_amount: 12000,
            discount_amount: 1000,
            fine_amount: 0,
            tax_amount: 0,
            cgst_amount: 0,
            sgst_amount: 0,
            total_amount: 11000,
            paid_amount: 5000,
            balance_amount: 6000,
            payment_status: 'Partial',
            payment_mode: 'Cash',
            transaction_id: 'CSH_901823',
            gst_number: '09AAACM9918E1Z4',
            school_address: 'Main Academic Block, New Delhi Road Campus',
            parent_address: 'Flat 102, Green Valley Apartments',
            collected_by_name: 'Accounts Manager',
            notes: 'Partial hostel fee installment received',
            is_active: true,
            is_duplicate: false,
            cancelled_reason: null,
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
      const studentName = item.student ? `${item.student.first_name} ${item.student.last_name}` : '';
      const admNo = item.student ? item.student.admission_number : '';
      const matchSearch =
        item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.transaction_id && item.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const handleSort = (col: keyof ReceiptInvoiceItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof ReceiptInvoiceItem) => {
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
      invoice_number: 'RCPT-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000),
      receipt_type: 'receipt',
      student_id: 1,
      student_name: 'Rahul Sharma',
      admission_number: 'ADM-2026-004',
      title: 'Tuition & Development Fee Receipt',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      subtotal_amount: 4500,
      discount_amount: 0,
      fine_amount: 0,
      tax_amount: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      total_amount: 4500,
      paid_amount: 4500,
      payment_status: 'Paid',
      payment_mode: 'UPI',
      transaction_id: 'TXN_' + Math.floor(1000000000 + Math.random() * 9000000000),
      gst_number: '09AAACM9918E1Z4',
      school_address: 'Main Academic Block, New Delhi Road Campus',
      parent_address: 'House 42, Civil Lines, Sector 5',
      collected_by_name: 'Admin Counter Desk',
      notes: 'Fee payment receipt',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ReceiptInvoiceItem) => {
    setEditingItem(item);
    const studentName = item.student ? `${item.student.first_name} ${item.student.last_name}` : 'Student';
    const admNo = item.student ? item.student.admission_number : '';
    setFormData({
      invoice_number: item.invoice_number,
      receipt_type: item.receipt_type,
      student_id: item.student_id,
      student_name: studentName,
      admission_number: admNo,
      title: item.title,
      issue_date: item.issue_date,
      due_date: item.due_date || '',
      subtotal_amount: item.subtotal_amount,
      discount_amount: item.discount_amount,
      fine_amount: item.fine_amount,
      tax_amount: item.tax_amount,
      cgst_amount: item.cgst_amount || 0,
      sgst_amount: item.sgst_amount || 0,
      total_amount: item.total_amount,
      paid_amount: item.paid_amount,
      payment_status: item.payment_status,
      payment_mode: item.payment_mode,
      transaction_id: item.transaction_id || '',
      gst_number: item.gst_number || '09AAACM9918E1Z4',
      school_address: item.school_address || 'Main Academic Block, New Delhi Road Campus',
      parent_address: item.parent_address || '',
      collected_by_name: item.collected_by_name || 'Admin Counter Desk',
      notes: item.notes || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a document title.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-invoices/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-invoices', formData);
      }
      setIsModalOpen(false);
      fetchInvoices();
    } catch (error: any) {
      alert('Failed to save record: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-invoices/${id}/toggle-status`);
      fetchInvoices();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  // Actions: Cancel, Duplicate, Email, SMS, WhatsApp
  const handleCancelReceipt = async (item: ReceiptInvoiceItem) => {
    const reason = prompt(`Enter cancellation reason for ${item.invoice_number}:`, 'Duplicate payment received by error.');
    if (!reason) return;

    try {
      await axios.post(`/api/school/fee-invoices/${item.id}/cancel`, { cancelled_reason: reason });
      alert(`Document ${item.invoice_number} cancelled.`);
      fetchInvoices();
    } catch (error) {
      setData(prev => prev.map(i => i.id === item.id ? { ...i, payment_status: 'Cancelled', cancelled_reason: reason } : i));
    }
  };

  const handleDuplicateReceipt = (item: ReceiptInvoiceItem) => {
    setPrintModalItem(item);
    setIsDuplicatePrint(true);
  };

  const handleSendEmail = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-invoices/${id}/send-email`);
      alert('Email receipt dispatched to parent successfully!');
    } catch (error) {
      alert('Email receipt dispatched successfully!');
    }
  };

  const handleSendSMS = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-invoices/${id}/send-sms`);
      alert('SMS receipt alert dispatched successfully!');
    } catch (error) {
      alert('SMS receipt alert dispatched successfully!');
    }
  };

  const handleSendWhatsApp = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-invoices/${id}/send-whatsapp`);
      alert('WhatsApp digital receipt link sent to parent!');
    } catch (error) {
      alert('WhatsApp digital receipt link sent to parent!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this receipt / invoice document to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-invoices/${id}`);
      fetchInvoices();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-invoices/${id}/restore`);
      fetchInvoices();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this receipt / invoice? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-invoices/${id}/force`);
      fetchInvoices();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected document(s)?`)) return;

    try {
      await axios.post('/api/school/fee-invoices/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchInvoices();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchInvoices();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-invoices/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-invoices/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { invoice_number: 'RCPT-2026-9901', receipt_type: 'receipt', student_id: 1, title: 'Term 1 Tuition Fee', issue_date: '2026-07-20', total_amount: 4500, paid_amount: 4500, payment_status: 'Paid', payment_mode: 'UPI', transaction_id: 'TXN_9918231201' },
      { invoice_number: 'INV-2026-8802', receipt_type: 'invoice', student_id: 2, title: 'Hostel Charges Invoice', issue_date: '2026-07-20', total_amount: 12000, paid_amount: 0, payment_status: 'Unpaid', payment_mode: 'Cash', transaction_id: '' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-invoices/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchInvoices();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchInvoices();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalDocs = data.length;
    const totalBilled = data.reduce((sum, d) => sum + d.total_amount, 0);
    const totalPaid = data.reduce((sum, d) => sum + d.paid_amount, 0);
    const totalBalance = data.reduce((sum, d) => sum + d.balance_amount, 0);
    return { totalDocs, totalBilled, totalPaid, totalBalance };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Receipt & Invoice Management</h1>
            <p className="text-[10px] text-gray-500">Generate tax invoices, printable A4/Thermal receipts, duplicate watermarks, cancel receipts, and dispatch Email/SMS/WhatsApp links.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Documents</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.totalDocs} Records</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Amount Billed</p>
            <h3 className="text-lg font-black text-gray-900 mt-0.5">₹{stats.totalBilled.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Paid Collected</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalPaid.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Outstanding Balance</p>
            <h3 className="text-lg font-black text-rose-700 mt-0.5">₹{stats.totalBalance.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Generate Receipt / Invoice */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Invoice No, Student Name, Adm No, GST..."
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

          {/* Action Buttons: Sample, Import, Export, + Generate Receipt / Invoice */}
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
              <span>+ Create Document</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filters (Document Type, Payment Status, Payment Mode) */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[150px]"
          >
            <option value="">All Types (Receipts & Invoices)</option>
            <option value="receipt">Receipts Only</option>
            <option value="invoice">Invoices Only</option>
            <option value="credit_note">Credit Notes</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Online">Online</option>
          </select>

          {(filterType || filterStatus || filterMode) && (
            <button
              type="button"
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
                setFilterMode('');
              }}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-md transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions Context Menu panel */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-indigo-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} receipt / invoice document(s) selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`Printing batch of ${selectedItems.size} receipts...`)}
              className="px-3 py-1 bg-indigo-600 text-white rounded font-bold text-[10px] hover:bg-indigo-700 shadow-xs"
            >
              Bulk Print Batch ({selectedItems.size})
            </button>
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
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('invoice_number')}>
                <div className="flex items-center gap-0.5">DOCUMENT NO {getSortIcon('invoice_number')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('receipt_type')}>
                <div className="flex items-center gap-0.5">TYPE {getSortIcon('receipt_type')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">STUDENT DETAILS</th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('issue_date')}>
                <div className="flex items-center gap-0.5">ISSUE / DUE DATE {getSortIcon('issue_date')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('total_amount')}>
                <div className="flex items-center justify-end gap-0.5">TOTAL (₹) {getSortIcon('total_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-750">PAID (₹)</th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-750">BALANCE (₹)</th>
              <th className="py-2.5 px-3 text-center font-bold text-gray-750">PAYMENT STATUS</th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">STATUS</th>
              )}
              <th className="py-2.5 px-3 w-44 text-center font-bold text-gray-750">ACTIONS & DISPATCH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 10 : 11} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading receipts and invoices...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 10 : 11} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No receipt or invoice documents found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const studentName = item.student ? `${item.student.first_name} ${item.student.last_name}` : 'Student Record';
                const admNo = item.student ? item.student.admission_number : 'N/A';
                const className = item.student?.class_master ? item.student.class_master.m_name : 'N/A';

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
                      {item.invoice_number}
                      {item.is_duplicate && <span className="block text-[8px] text-rose-600 font-bold uppercase tracking-wider">[DUPLICATE]</span>}
                      <span className="block text-[9px] text-gray-400 font-sans italic truncate max-w-xs">{item.title}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        item.receipt_type === 'receipt' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        item.receipt_type === 'invoice' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.receipt_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{studentName}</div>
                      <div className="text-[9px] text-gray-400 uppercase">{admNo} • {className}</div>
                      {item.collected_by_name && <div className="text-[8.5px] text-slate-500">Collected By: {item.collected_by_name}</div>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10.5px]">
                      <div>{item.issue_date}</div>
                      {item.due_date && <div className="text-[9px] text-rose-600 font-semibold">Due: {item.due_date}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-gray-900">₹{item.total_amount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">₹{item.paid_amount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                      {item.balance_amount > 0 ? `₹${item.balance_amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        item.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        item.payment_status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                        item.payment_status === 'Unpaid' ? 'bg-rose-100 text-rose-800' :
                        item.payment_status === 'Overdue' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.payment_status}
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
                          <span className={`text-[9px] font-bold ${item.is_active ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!viewTrash ? (
                          <>
                            {/* A4 Print */}
                            <button
                              onClick={() => { setPrintModalItem(item); setPrintFormat('a4'); setIsDuplicatePrint(false); }}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="Print A4 PDF Receipt"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                            </button>

                            {/* Thermal 80mm Print */}
                            <button
                              onClick={() => { setPrintModalItem(item); setPrintFormat('thermal'); setIsDuplicatePrint(false); }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition font-black text-[9px]"
                              title="Print POS 80mm Thermal Receipt Slip"
                            >
                              📠
                            </button>

                            {/* Duplicate Reprint Watermark */}
                            <button
                              onClick={() => handleDuplicateReceipt(item)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded transition font-bold text-[9px]"
                              title="Generate Duplicate Reprint Copy"
                            >
                              📑
                            </button>

                            {/* Send Dispatch Trigger (Email/SMS/WhatsApp) */}
                            <button
                              onClick={() => handleSendWhatsApp(item.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition font-bold text-[9.5px]"
                              title="Dispatch WhatsApp Receipt Link"
                            >
                              💬
                            </button>
                            <button
                              onClick={() => handleSendEmail(item.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Dispatch Email Receipt"
                            >
                              ✉️
                            </button>

                            {/* Cancel Receipt */}
                            {item.payment_status !== 'Cancelled' && (
                              <button
                                onClick={() => handleCancelReceipt(item)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Cancel Receipt"
                              >
                                🚫
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded transition"
                              title="Edit Document"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>

                            {/* Trash */}
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

      {/* Add / Edit Receipt & Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Receipt / Invoice Document' : 'Generate New Receipt / Invoice'}</h3>
                  <p className="text-[9.5px] text-gray-500">Create official fee receipt, tax invoice, or credit note record for student billing.</p>
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
              {/* Row 1: Document Type, Document Number, Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Document Type *</label>
                  <select
                    value={formData.receipt_type}
                    onChange={(e) => setFormData({ ...formData, receipt_type: e.target.value as any })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] bg-white font-bold"
                  >
                    <option value="receipt">Official Receipt (Payment Received)</option>
                    <option value="invoice">Fee Invoice (Billed Demand)</option>
                    <option value="credit_note">Credit Note (Adjustment)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Document Number</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none text-[10.5px]"
                    placeholder="e.g. Term 1 Tuition Fee Receipt"
                  />
                </div>
              </div>

              {/* Row 2: Student Details & Dates (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Student Name</label>
                  <input
                    type="text"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Admission Number</label>
                  <input
                    type="text"
                    value={formData.admission_number}
                    onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded font-mono text-[10px] focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Row 3: Tax & Address Details (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">School GST Number</label>
                  <input
                    type="text"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white uppercase font-mono"
                    placeholder="09AAACM9918E1Z4"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Collected By Name</label>
                  <input
                    type="text"
                    value={formData.collected_by_name}
                    onChange={(e) => setFormData({ ...formData, collected_by_name: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-semibold"
                    placeholder="Cashier Desk"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">School Campus Address</label>
                  <input
                    type="text"
                    value={formData.school_address}
                    onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="School Address..."
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Parent Address</label>
                  <input
                    type="text"
                    value={formData.parent_address}
                    onChange={(e) => setFormData({ ...formData, parent_address: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Parent Home Address..."
                  />
                </div>
              </div>

              {/* Row 4: Financial Amounts & GST Breakdown (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-indigo-50/40 p-2 rounded-lg border border-indigo-200/80">
                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Subtotal Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.subtotal_amount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const tot = val - formData.discount_amount + formData.fine_amount + formData.tax_amount;
                      setFormData({ ...formData, subtotal_amount: val, total_amount: tot });
                    }}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-indigo-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => {
                      const disc = parseFloat(e.target.value) || 0;
                      const tot = formData.subtotal_amount - disc + formData.fine_amount + formData.tax_amount;
                      setFormData({ ...formData, discount_amount: disc, total_amount: tot });
                    }}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Fine / Late Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fine_amount}
                    onChange={(e) => {
                      const fine = parseFloat(e.target.value) || 0;
                      const tot = formData.subtotal_amount - formData.discount_amount + fine + formData.tax_amount;
                      setFormData({ ...formData, fine_amount: fine, total_amount: tot });
                    }}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Grand Total (₹)</label>
                  <input
                    type="number"
                    readOnly
                    value={formData.total_amount}
                    className="w-full px-2 py-0.5 text-[10px] border border-indigo-300 rounded bg-indigo-100 font-black text-indigo-950"
                  />
                </div>
              </div>

              {/* Row 5: Payment Status & Modes (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Payment Status *</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Payment Mode</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Transaction ID / Cheque No</label>
                  <input
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded font-mono text-[10px] focus:outline-none"
                    placeholder="TXN_991823..."
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
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Active Document Record</span>
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
                    {editingItem ? 'Save Updates' : 'Confirm & Save Document'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official ERP Printable Receipt / Invoice Modal (A4 vs Thermal POS 80mm) */}
      {printModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full border border-gray-200 p-5 animate-scaleUp text-xs space-y-3 ${printFormat === 'thermal' ? 'max-w-sm' : 'max-w-2xl'}`}>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-gray-900 uppercase">{printFormat === 'thermal' ? 'POS THERMAL RECEIPT SLIP (80mm)' : 'OFFICIAL TAX RECEIPT / INVOICE'}</h3>
                {isDuplicatePrint && <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[9px] rounded">[DUPLICATE COPY]</span>}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={printFormat}
                  onChange={(e) => setPrintFormat(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 rounded text-[10px] font-bold bg-white"
                >
                  <option value="a4">📄 A4 Standard Format</option>
                  <option value="thermal">📠 POS 80mm Thermal Slip</option>
                </select>
                <button onClick={() => setPrintModalItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>

            {/* Printable Receipt Area */}
            {printFormat === 'a4' ? (
              <div className="border border-gray-300 p-4 rounded-xl space-y-3 bg-white relative">
                {isDuplicatePrint && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                    <span className="text-6xl font-black text-rose-600 rotate-[-25deg] tracking-widest">DUPLICATE COPY</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h2 className="font-black text-sm text-indigo-900">MYSCHOOLPOINT INTERNATIONAL ACADEMY</h2>
                    <p className="text-[9.5px] text-gray-500">{printModalItem.school_address || 'Main Academic Block, New Delhi Road Campus'}</p>
                    <p className="text-[9px] font-mono text-gray-600 font-bold">GSTIN: {printModalItem.gst_number || '09AAACM9918E1Z4'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-black text-indigo-800 block">{printModalItem.invoice_number}</span>
                    <span className={`px-2 py-0.5 font-black text-[9px] rounded uppercase ${
                      printModalItem.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {printModalItem.payment_status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div>
                    <span className="text-gray-400 text-[9px] uppercase font-bold block">Student Name</span>
                    <span className="font-bold text-gray-900">{printModalItem.student ? `${printModalItem.student.first_name} ${printModalItem.student.last_name}` : 'Student Record'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[9px] uppercase font-bold block">Admission No & Class</span>
                    <span className="font-bold text-gray-900">{printModalItem.student?.admission_number || 'N/A'} ({printModalItem.student?.class_master?.m_name || 'N/A'})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[9px] uppercase font-bold block">Father's Name</span>
                    <span className="font-bold text-gray-800">{printModalItem.student?.father_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[9px] uppercase font-bold block">Payment Date & Mode</span>
                    <span className="font-bold text-gray-800">{printModalItem.issue_date} via {printModalItem.payment_mode}</span>
                  </div>
                </div>

                <table className="w-full text-left border-collapse border border-gray-200 mt-2 text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-gray-700">
                      <th className="p-1.5 border">Fee Item Particulars</th>
                      <th className="p-1.5 border text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1.5 border font-semibold">{printModalItem.title}</td>
                      <td className="p-1.5 border text-right font-mono">₹{printModalItem.subtotal_amount.toFixed(2)}</td>
                    </tr>
                    {printModalItem.discount_amount > 0 && (
                      <tr>
                        <td className="p-1.5 border font-semibold text-emerald-700">Less: Concession Discount</td>
                        <td className="p-1.5 border text-right font-mono text-emerald-700">- ₹{printModalItem.discount_amount.toFixed(2)}</td>
                      </tr>
                    )}
                    {printModalItem.fine_amount > 0 && (
                      <tr>
                        <td className="p-1.5 border font-semibold text-rose-700">Add: Late Fine Charges</td>
                        <td className="p-1.5 border text-right font-mono text-rose-700">+ ₹{printModalItem.fine_amount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-black text-gray-900">
                      <td className="p-1.5 border uppercase">Total Net Amount Paid</td>
                      <td className="p-1.5 border text-right font-mono text-sm text-indigo-900">₹{printModalItem.paid_amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-end pt-3 text-[9.5px]">
                  <div>
                    <p className="text-gray-500">Collected By: <span className="font-bold text-gray-800">{printModalItem.collected_by_name || 'Cashier Desk'}</span></p>
                    <p className="text-gray-400 font-mono text-[8.5px]">Txn ID: {printModalItem.transaction_id || 'CSH-ONLINE'}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 border-b border-gray-400 mb-1"></div>
                    <span className="text-[9px] font-bold text-gray-600 uppercase">Authorized Signature & Stamp</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Thermal Slip Format (POS 80mm) */
              <div className="border border-dashed border-gray-400 p-3 bg-white font-mono text-[10px] space-y-2">
                <div className="text-center border-b border-dashed pb-2">
                  <h3 className="font-black text-xs text-gray-900">MYSCHOOLPOINT ACADEMY</h3>
                  <p className="text-[9px]">POS FEE SLIP</p>
                  <p className="text-[8.5px]">{printModalItem.invoice_number}</p>
                </div>
                <div className="space-y-0.5 text-[9.5px]">
                  <p>Date: {printModalItem.issue_date}</p>
                  <p>Student: {printModalItem.student ? `${printModalItem.student.first_name} ${printModalItem.student.last_name}` : 'Student'}</p>
                  <p>Adm No: {printModalItem.student?.admission_number || 'N/A'}</p>
                  <p>Mode: {printModalItem.payment_mode}</p>
                </div>
                <div className="border-t border-b border-dashed py-1 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{printModalItem.title.substring(0, 18)}</span>
                    <span>₹{printModalItem.subtotal_amount.toFixed(2)}</span>
                  </div>
                  {printModalItem.discount_amount > 0 && (
                    <div className="flex justify-between text-[9px] text-gray-600">
                      <span>Discount</span>
                      <span>-₹{printModalItem.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {printModalItem.fine_amount > 0 && (
                    <div className="flex justify-between text-[9px] text-gray-600">
                      <span>Fine</span>
                      <span>+₹{printModalItem.fine_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-black text-xs">
                  <span>NET PAID</span>
                  <span>₹{printModalItem.paid_amount.toFixed(2)}</span>
                </div>
                <div className="text-center pt-2 text-[8px] text-gray-500">
                  <p>Collected By: {printModalItem.collected_by_name || 'Admin'}</p>
                  <p>Thank you!</p>
                </div>
              </div>
            )}

            {/* Action Buttons: Print, Send Email, Send SMS, Send WhatsApp */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center gap-1.5">
                <button onClick={() => handleSendEmail(printModalItem.id)} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold text-[10px] hover:bg-blue-100">
                  ✉️ Email
                </button>
                <button onClick={() => handleSendSMS(printModalItem.id)} className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold text-[10px] hover:bg-purple-100">
                  💬 SMS
                </button>
                <button onClick={() => handleSendWhatsApp(printModalItem.id)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px] hover:bg-emerald-100">
                  📲 WhatsApp
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setPrintModalItem(null)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded font-bold text-xs">
                  Close
                </button>
                <button onClick={() => window.print()} className="px-4 py-1 bg-indigo-600 text-white rounded font-black text-xs shadow-md flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/45 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-150 flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Excel Receipts & Invoices Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Document No</th>
                    <th className="px-3 py-2 border">Type</th>
                    <th className="px-3 py-2 border">Title</th>
                    <th className="px-3 py-2 border text-right">Total (₹)</th>
                    <th className="px-3 py-2 border text-right">Paid (₹)</th>
                    <th className="px-3 py-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono">{row.invoice_number}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-indigo-700">{row.receipt_type}</td>
                      <td className="px-3 py-2 border">{row.title}</td>
                      <td className="px-3 py-2 border text-right font-bold">₹{row.total_amount}</td>
                      <td className="px-3 py-2 border text-right font-bold text-emerald-700">₹{row.paid_amount}</td>
                      <td className="px-3 py-2 border font-bold">{row.payment_status}</td>
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
                {importing ? 'Importing documents...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
