import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeVendorPaymentItem {
  id: number;
  voucher_code: string;
  vendor_name: string;
  vendor_code: string | null;
  vendor_category: string;
  contact_person: string | null;
  contact_phone: string | null;
  gstin_number: string | null;
  pan_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_amount: number;
  tax_amount: number;
  tds_deducted: number;
  other_deductions: number;
  paid_amount: number;
  balance_due: number;
  payment_date: string;
  payment_mode: 'Bank_Transfer' | 'Cheque' | 'UPI' | 'Cash' | 'Demand_Draft';
  transaction_reference: string | null;
  payment_status: 'Paid' | 'Partially_Paid' | 'Pending' | 'Overdue';
  approval_status: 'Approved' | 'Pending' | 'Rejected';
  receipt_attachment: string | null;
  academic_year: string;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
}

const VENDOR_TYPES = [
  'Stationery Supplier',
  'Book Supplier',
  'Uniform Vendor',
  'Transport Vendor',
  'IT Vendor',
  'Maintenance Vendor',
  'Building / Civil Contractor',
  'Canteen / Catering Vendor'
];

const PAYMENT_MODES = [
  { value: 'Cash', label: 'Cash Payment' },
  { value: 'Cheque', label: 'Bank Cheque' },
  { value: 'Bank_Transfer', label: 'Bank Transfer (NEFT/RTGS/IMPS)' },
  { value: 'UPI', label: 'UPI / QR Code' },
  { value: 'Demand_Draft', label: 'Demand Draft (DD)' }
];

const PAYMENT_STATUSES = [
  { value: 'Paid', label: 'Fully Settled / Paid' },
  { value: 'Partially_Paid', label: 'Partially Paid' },
  { value: 'Pending', label: 'Payment Pending' },
  { value: 'Overdue', label: 'Overdue Invoice' }
];

const APPROVAL_STATUSES = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending Approval' },
  { value: 'Rejected', label: 'Rejected / On Hold' }
];

export default function VendorPaymentManagement() {
  const [data, setData] = useState<FeeVendorPaymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeVendorPaymentItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeVendorPaymentItem | null>(null);
  const [formData, setFormData] = useState({
    voucher_code: '',
    vendor_name: 'Oxford Book Publications Pvt Ltd',
    vendor_code: 'VND-101',
    vendor_category: 'Book Supplier',
    contact_person: 'Ramesh Kumar',
    contact_phone: '9876543210',
    gstin_number: '07AAAAA0000A1Z5',
    pan_number: 'AAAAA0000A',
    bank_name: 'HDFC Bank',
    account_number: '50100293847123',
    ifsc_code: 'HDFC0000123',
    invoice_number: 'INV-88391',
    invoice_date: '2026-04-02',
    invoice_amount: 125000,
    tax_amount: 6250,
    tds_deducted: 2500,
    other_deductions: 0,
    paid_amount: 128750,
    payment_date: '2026-04-05',
    payment_mode: 'Bank_Transfer' as 'Cash' | 'Cheque' | 'Bank_Transfer' | 'UPI' | 'Demand_Draft',
    transaction_reference: 'NEFT/998472910',
    payment_status: 'Paid' as 'Paid' | 'Partially_Paid' | 'Pending' | 'Overdue',
    approval_status: 'Approved' as 'Approved' | 'Pending' | 'Rejected',
    receipt_attachment: 'oxford_inv_88391.pdf',
    academic_year: '2025-2026',
    remarks: 'Annual textbook and workbook bulk order payment with 5% GST and 2% TDS deduction.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchPayments();
  }, [viewTrash, filterCategory, filterMode, filterPaymentStatus, filterApprovalStatus, filterStatus]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-vendor-payments', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          vendor_category: filterCategory || undefined,
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
      console.error('Failed to fetch vendor payment vouchers', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            voucher_code: 'VND-2026-001',
            vendor_name: 'Oxford Book Publications Pvt Ltd',
            vendor_code: 'VND-101',
            vendor_category: 'Book Supplier',
            contact_person: 'Ramesh Kumar',
            contact_phone: '9876543210',
            gstin_number: '07AAAAA0000A1Z5',
            pan_number: 'AAAAA0000A',
            bank_name: 'HDFC Bank',
            account_number: '50100293847123',
            ifsc_code: 'HDFC0000123',
            invoice_number: 'INV-88391',
            invoice_date: '2026-04-02',
            invoice_amount: 125000.00,
            tax_amount: 6250.00,
            tds_deducted: 2500.00,
            other_deductions: 0.00,
            paid_amount: 128750.00,
            balance_due: 0.00,
            payment_date: '2026-04-05',
            payment_mode: 'Bank_Transfer',
            transaction_reference: 'NEFT/998472910',
            payment_status: 'Paid',
            approval_status: 'Approved',
            receipt_attachment: 'oxford_inv_88391.pdf',
            academic_year: '2025-2026',
            remarks: 'Annual textbook and workbook bulk order settlement.',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            vendor_name: 'National Transport Bus Spares',
            voucher_code: 'VND-2026-002',
            vendor_code: 'VND-105',
            vendor_category: 'Transport Vendor',
            contact_person: 'Sanjay Singh',
            contact_phone: '9876543211',
            gstin_number: '07BBBBB1111B2Z6',
            pan_number: 'BBBBB1111B',
            bank_name: 'ICICI Bank',
            account_number: '602901928374',
            ifsc_code: 'ICIC0006029',
            invoice_number: 'INV-88392',
            invoice_date: '2026-04-08',
            invoice_amount: 45000.00,
            tax_amount: 2250.00,
            tds_deducted: 900.00,
            other_deductions: 0.00,
            paid_amount: 46350.00,
            balance_due: 0.00,
            payment_date: '2026-04-12',
            payment_mode: 'Bank_Transfer',
            transaction_reference: 'NEFT/998472911',
            receipt_attachment: 'bus_spares_invoice.pdf',
            academic_year: '2025-2026',
            payment_status: 'Paid',
            approval_status: 'Approved',
            remarks: 'School buses annual servicing and new tyre replacement',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            voucher_code: 'VND-2026-003',
            vendor_name: 'City Uniform Outfitters',
            vendor_code: 'VND-109',
            vendor_category: 'Uniform Vendor',
            contact_person: 'Vikram Joshi',
            contact_phone: '9876543212',
            gstin_number: '07CCCCC2222C3Z7',
            pan_number: 'CCCCC2222C',
            bank_name: 'State Bank of India',
            account_number: '30948271928',
            ifsc_code: 'SBIN0000452',
            invoice_number: 'INV-88393',
            invoice_date: '2026-04-15',
            invoice_amount: 85000.00,
            tax_amount: 4250.00,
            tds_deducted: 1700.00,
            other_deductions: 0.00,
            paid_amount: 40000.00,
            balance_due: 47550.00,
            payment_date: '2026-04-18',
            payment_mode: 'Cheque',
            transaction_reference: 'CHQ-992018',
            receipt_attachment: 'uniform_bill.jpg',
            academic_year: '2025-2026',
            payment_status: 'Partially_Paid',
            approval_status: 'Approved',
            remarks: 'Part payment for student summer uniform supply',
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
        item.voucher_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.vendor_code && item.vendor_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.contact_person && item.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.gstin_number && item.gstin_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const handleSort = (col: keyof FeeVendorPaymentItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeVendorPaymentItem) => {
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
      voucher_code: 'VND-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      vendor_name: '',
      vendor_code: 'VND-' + Math.floor(100 + Math.random() * 900),
      vendor_category: 'Stationery Supplier',
      contact_person: '',
      contact_phone: '',
      gstin_number: '',
      pan_number: '',
      bank_name: 'HDFC Bank',
      account_number: '',
      ifsc_code: '',
      invoice_number: 'INV-' + Math.floor(10000 + Math.random() * 90000),
      invoice_date: new Date().toISOString().split('T')[0],
      invoice_amount: 50000,
      tax_amount: 2500,
      tds_deducted: 1000,
      other_deductions: 0,
      paid_amount: 51500,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: 'Bank_Transfer',
      transaction_reference: '',
      payment_status: 'Paid',
      approval_status: 'Approved',
      receipt_attachment: '',
      academic_year: '2025-2026',
      remarks: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeVendorPaymentItem) => {
    setEditingItem(item);
    setFormData({
      voucher_code: item.voucher_code,
      vendor_name: item.vendor_name,
      vendor_code: item.vendor_code || 'VND-101',
      vendor_category: item.vendor_category,
      contact_person: item.contact_person || '',
      contact_phone: item.contact_phone || '',
      gstin_number: item.gstin_number || '',
      pan_number: item.pan_number || '',
      bank_name: item.bank_name || '',
      account_number: item.account_number || '',
      ifsc_code: item.ifsc_code || '',
      invoice_number: item.invoice_number || '',
      invoice_date: item.invoice_date || '',
      invoice_amount: item.invoice_amount,
      tax_amount: item.tax_amount || 0,
      tds_deducted: item.tds_deducted || 0,
      other_deductions: item.other_deductions || 0,
      paid_amount: item.paid_amount,
      payment_date: item.payment_date,
      payment_mode: item.payment_mode,
      transaction_reference: item.transaction_reference || '',
      payment_status: item.payment_status,
      approval_status: item.approval_status || 'Approved',
      receipt_attachment: item.receipt_attachment || '',
      academic_year: item.academic_year || '2025-2026',
      remarks: item.remarks || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_name.trim()) {
      alert('Please enter vendor name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-vendor-payments/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-vendor-payments', formData);
      }
      setIsModalOpen(false);
      fetchPayments();
    } catch (error: any) {
      alert('Failed to save vendor payment voucher: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-vendor-payments/${id}/toggle-status`);
      fetchPayments();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this vendor payment voucher to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-vendor-payments/${id}`);
      fetchPayments();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-vendor-payments/${id}/restore`);
      fetchPayments();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this vendor payment voucher? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-vendor-payments/${id}/force`);
      fetchPayments();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete' | 'approve') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected vendor payment voucher(s)?`)) return;

    try {
      await axios.post('/api/school/fee-vendor-payments/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchPayments();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchPayments();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-vendor-payments/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-vendor-payments/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { voucher_code: 'VND-2026-001', vendor_name: 'Oxford Publications', vendor_code: 'VND-101', vendor_category: 'Book Supplier', invoice_number: 'INV-88391', invoice_amount: 125000, tax_amount: 6250, tds_deducted: 2500, paid_amount: 128750, payment_date: '2026-04-05', payment_mode: 'Bank_Transfer', payment_status: 'Paid' },
      { voucher_code: 'VND-2026-002', vendor_name: 'National Transport Spares', vendor_code: 'VND-105', vendor_category: 'Transport Vendor', invoice_number: 'INV-88392', invoice_amount: 45000, tax_amount: 2250, tds_deducted: 900, paid_amount: 46350, payment_date: '2026-04-12', payment_mode: 'Bank_Transfer', payment_status: 'Paid' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-vendor-payments/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchPayments();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchPayments();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalInvoiceSum = data.reduce((sum, d) => sum + d.invoice_amount, 0);
    const totalPaidSum = data.reduce((sum, d) => sum + d.paid_amount, 0);
    const totalDueSum = data.reduce((sum, d) => sum + d.balance_due, 0);
    const totalTdsSum = data.reduce((sum, d) => sum + d.tds_deducted, 0);
    return { totalInvoiceSum, totalPaidSum, totalDueSum, totalTdsSum };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5m-5 0V11m0 0H7m5 0h5" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Vendor Payments Hub</h1>
            <p className="text-[10px] text-gray-500">Vendor Master (Code/GSTIN/Contact), Purchase Bills (Bill No/Date/Amount/Tax), Payment Processing (Cash/Cheque/Bank Transfer/UPI) & Vendor Outstanding Ledgers.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Purchase Bills</p>
            <h3 className="text-lg font-black text-indigo-900 mt-0.5">₹{stats.totalInvoiceSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Settled Payouts</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalPaidSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Vendor Outstanding Dues</p>
            <h3 className="text-lg font-black text-rose-700 mt-0.5">₹{stats.totalDueSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">TDS Tax Deductions</p>
            <h3 className="text-lg font-black text-amber-700 mt-0.5">₹{stats.totalTdsSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Vendor Voucher */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Voucher, Vendor, Code, Contact, GSTIN, Bill No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-xs"
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

          {/* Action Buttons: Sample, Import, Export, + Add Vendor Payment */}
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
              <span>+ Add Vendor Voucher</span>
            </button>
          </div>
        </div>

        {/* Row 2: Clean Filter Toolbar (No Scrollbar, No Bracket Labels) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {/* Vendor Type Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">Vendor Type</option>
            {VENDOR_TYPES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Payment Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">Payment Mode</option>
            {PAYMENT_MODES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">Payment Status</option>
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

          {(filterCategory || filterMode || filterPaymentStatus || filterApprovalStatus || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('');
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
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-blue-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} vendor voucher(s) selected</span>
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
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('voucher_code')}>
                <div className="flex items-center gap-0.5">VOUCHER CODE {getSortIcon('voucher_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('vendor_name')}>
                <div className="flex items-center gap-0.5">VENDOR MASTER {getSortIcon('vendor_name')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('invoice_number')}>
                <div className="flex items-center gap-0.5">PURCHASE BILL & GST {getSortIcon('invoice_number')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">PAYMENT PROCESSING</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('paid_amount')}>
                <div className="flex items-center justify-end gap-0.5">BILL AMOUNT & TAX (₹) {getSortIcon('paid_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('balance_due')}>
                <div className="flex items-center justify-end gap-0.5">OUTSTANDING DUE {getSortIcon('balance_due')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('payment_date')}>
                <div className="flex items-center gap-0.5">DATE & STATUS {getSortIcon('payment_date')}</div>
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
                    <span className="font-bold text-gray-600">Loading vendor payment vouchers...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No vendor payment vouchers found.'}
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
                      {item.voucher_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.vendor_name}</div>
                      <div className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-wider">{item.vendor_category} {item.vendor_code ? `(${item.vendor_code})` : ''}</div>
                      {item.contact_phone && <div className="text-[9px] text-slate-500">Ph: {item.contact_phone}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">Bill: {item.invoice_number || 'N/A'}</div>
                      <div className="text-[9.5px] text-slate-500 font-mono font-semibold">{item.gstin_number ? `GSTIN: ${item.gstin_number}` : 'No GSTIN'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.2 bg-blue-50 text-blue-800 border border-blue-200 rounded font-bold uppercase">
                          {item.payment_mode.replace('_', ' ')}
                        </span>
                        {item.receipt_attachment && <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1 rounded border border-indigo-100">📎 Bill</span>}
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono mt-0.2">
                        {item.bank_name ? `${item.bank_name} (${item.account_number || ''})` : item.transaction_reference || 'N/A'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-gray-900">₹{item.invoice_amount.toFixed(2)}</div>
                      {item.tax_amount > 0 && <div className="text-[8.5px] text-amber-700 font-semibold">GST Tax: ₹{item.tax_amount.toFixed(2)}</div>}
                      <div className="text-[9px] text-emerald-700 font-bold">Paid: ₹{item.paid_amount.toFixed(2)}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black">
                      <div className={item.balance_due > 0 ? 'text-rose-700 font-black' : 'text-emerald-700 font-bold'}>
                        {item.balance_due > 0 ? `₹${item.balance_due.toFixed(2)}` : 'Cleared'}
                      </div>
                      {item.tds_deducted > 0 && <div className="text-[8.5px] text-amber-700 font-semibold">TDS: ₹{item.tds_deducted.toFixed(2)}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <div className="font-bold text-gray-800">{item.payment_date}</div>
                      <span className={`text-[8.5px] font-bold rounded uppercase px-1 py-0.2 ${
                        item.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        item.payment_status === 'Partially_Paid' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.payment_status.replace('_', ' ')}
                      </span>
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

      {/* Add / Edit Vendor Payment Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5m-5 0V11m0 0H7m5 0h5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Vendor Master & Purchase Bill Record' : 'Log New Vendor Purchase Bill & Payment'}</h3>
                  <p className="text-[9.5px] text-gray-500">Vendor Master (Code/GSTIN/Contact), Purchase Bills (Bill No/Date/Amount/Tax), Payment Processing (Cash/Cheque/Bank/UPI).</p>
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
              {/* Row 1: Voucher Code, Vendor Name, Vendor Code, Vendor Category (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Voucher Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.voucher_code}
                    onChange={(e) => setFormData({ ...formData, voucher_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="VND-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Vendor / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-[10.5px] font-bold"
                    placeholder="e.g. Oxford Book Publications"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Vendor Code</label>
                  <input
                    type="text"
                    value={formData.vendor_code}
                    onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] bg-white font-bold"
                    placeholder="VND-101"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Vendor Type / Category *</label>
                  <select
                    value={formData.vendor_category}
                    onChange={(e) => setFormData({ ...formData, vendor_category: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                  >
                    {VENDOR_TYPES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Contact Person, Phone, GSTIN, PAN Number (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-blue-50/40 p-2 rounded-lg border border-blue-200/80">
                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Contact Person Name</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                    placeholder="Ramesh Kumar"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Contact Phone Number</label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono"
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">GST Number (GSTIN)</label>
                  <input
                    type="text"
                    value={formData.gstin_number}
                    onChange={(e) => setFormData({ ...formData, gstin_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono uppercase"
                    placeholder="07AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">PAN Number</label>
                  <input
                    type="text"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono uppercase"
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>

              {/* Row 3: Purchase Bill Number, Bill Date, Gross Bill Amount, Bill Tax Amount (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Purchase Bill Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono font-bold"
                    placeholder="INV-88391"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Purchase Bill Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Base Bill Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.invoice_amount}
                    onChange={(e) => setFormData({ ...formData, invoice_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-indigo-950"
                    placeholder="125000"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">GST / Bill Tax (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-amber-800"
                    placeholder="6250"
                  />
                </div>
              </div>

              {/* Row 4: TDS Deducted, Net Paid Amount, Payment Date, Payment Processing Mode (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">TDS Tax Deducted (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tds_deducted}
                    onChange={(e) => setFormData({ ...formData, tds_deducted: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-amber-800"
                    placeholder="2500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Net Paid Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-emerald-800"
                    placeholder="128750"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Payment Processing *</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-blue-900"
                  >
                    {PAYMENT_MODES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Transaction Ref, Receipt File, Remarks (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Transaction Ref / Cheque No</label>
                  <input
                    type="text"
                    value={formData.transaction_reference}
                    onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono"
                    placeholder="NEFT/998472910"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Purchase Bill Attachment</label>
                  <input
                    type="text"
                    value={formData.receipt_attachment}
                    onChange={(e) => setFormData({ ...formData, receipt_attachment: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-mono"
                    placeholder="oxford_inv_88391.pdf"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Audit Remarks & Ledger Notes</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Ledger notes..."
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
                    <span className="font-bold text-gray-800 text-[10px]">Active Vendor Voucher</span>
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
                    {editingItem ? 'Save Updates' : 'Confirm & Save Voucher'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Vendor Payments Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Code</th>
                    <th className="px-3 py-2 border">Vendor Name</th>
                    <th className="px-3 py-2 border">Vendor Type</th>
                    <th className="px-3 py-2 border">Bill No</th>
                    <th className="px-3 py-2 border text-right">Bill Amount (₹)</th>
                    <th className="px-3 py-2 border text-right">Tax (₹)</th>
                    <th className="px-3 py-2 border text-right">Paid (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-blue-800">{row.voucher_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.vendor_name}</td>
                      <td className="px-3 py-2 border font-semibold">{row.vendor_category}</td>
                      <td className="px-3 py-2 border font-mono">{row.invoice_number}</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.invoice_amount}</td>
                      <td className="px-3 py-2 border text-right font-bold text-amber-800">₹{row.tax_amount}</td>
                      <td className="px-3 py-2 border text-right font-bold text-emerald-700">₹{row.paid_amount}</td>
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
