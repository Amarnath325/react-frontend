import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../../services/api';

interface FeePaymentItem {
  id: number;
  student_id: number;
  student_name: string;
  father_name?: string;
  phone?: string;
  admission_number: string;
  roll_number?: string;
  section?: string;
  class_name: string;
  fee_structure_id: number;
  fee_head_label: string;
  frequency_label?: string;
  receipt_number: string;
  amount: number;
  late_fine?: number;
  discount_amount?: number;
  advance_amount?: number;
  refund_amount?: number;
  previous_balance_adjusted?: number;
  balance_remaining?: number;
  collection_type?: string;
  installment_period?: string;
  payment_date: string;
  payment_mode: string;
  transaction_id?: string;
  cheque_number?: string;
  bank_name?: string;
  payment_status: string;
  payment_for_month?: string;
  remarks?: string;
  collected_by_name?: string;
  is_active: boolean;
  created_at?: string;
}

interface SelectOption {
  value: string | number;
  label: string;
  class_id?: number;
  class_name?: string;
  amount?: number;
  fee_head_label?: string;
}

interface StudentProfile {
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number?: string;
  father_name: string;
  phone: string;
  class_name: string;
  section?: string;
  total_assigned_fee: number;
  total_paid: number;
  balance_remaining: number;
  total_discounts: number;
  total_scholarships: number;
  previous_balance: number;
  fine_carry_forward: number;
}

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
      checked ? 'bg-emerald-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-[22px]' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function FeeCollection() {
  const [data, setData] = useState<FeePaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_collected: 0,
    total_payments: 0,
    paid_count: 0,
    pending_count: 0,
    overdue_count: 0,
    partial_count: 0,
    trashed_count: 0,
    this_month: 0
  });

  // Dropdown masters
  const [classes, setClasses] = useState<SelectOption[]>([]);
  const [students, setStudents] = useState<SelectOption[]>([]);
  const [feeStructures, setFeeStructures] = useState<SelectOption[]>([]);
  const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);
  const [paymentModes, setPaymentModes] = useState<SelectOption[]>([]);
  const [collectionTypes, setCollectionTypes] = useState<SelectOption[]>([]);
  const [installmentPeriods, setInstallmentPeriods] = useState<SelectOption[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<SelectOption[]>([]);

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [viewTrash, setViewTrash] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Table Sorting
  const [sortField, setSortField] = useState<'receipt_number' | 'student_name' | 'class_name' | 'amount' | 'payment_date' | 'payment_status'>('payment_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Multi Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeePaymentItem | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [printingItem, setPrintingItem] = useState<FeePaymentItem | null>(null);
  const [isBulkReceiptModalOpen, setIsBulkReceiptModalOpen] = useState(false);

  // Student Profile Summary state
  const [loadedStudentProfile, setLoadedStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    fee_structure_id: '',
    academic_year_id: '',
    collection_type: 'full',
    installment_period: 'April',
    amount: '',
    late_fine: '0',
    discount_amount: '0',
    advance_amount: '0',
    refund_amount: '0',
    previous_balance_adjusted: '0',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'Cash',
    transaction_id: '',
    cheque_number: '',
    bank_name: '',
    payment_status: 'paid',
    payment_for_month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    remarks: '',
    is_active: true
  });

  // Fetch Masters & Data
  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [viewTrash, filterClass, filterMode, filterStatus, filterAcademicYear, fromDate, toDate]);

  const fetchMasters = async () => {
    try {
      const res = await api.get('/school/fee-payments/masters');
      if (res.data.success) {
        const { classes, academicYears, paymentModes, collectionTypes, installmentPeriods, paymentStatuses } = res.data.data;
        setClasses(classes || []);
        setAcademicYears(academicYears || []);
        setPaymentModes(paymentModes || []);
        setCollectionTypes(collectionTypes || []);
        setInstallmentPeriods(installmentPeriods || []);
        setPaymentStatuses(paymentStatuses || []);
        if (academicYears && academicYears.length > 0) {
          setFilterAcademicYear(academicYears[0].value.toString());
        }
      }

      // Fetch students list
      const studRes = await api.get('/school/students');
      if (studRes.data.success) {
        const studOptions = studRes.data.data.map((s: any) => ({
          value: s.id,
          label: `${s.user?.first_name || ''} ${s.user?.last_name || ''} (Adm: ${s.admission_number || '-'}) | Class: ${s.class?.m_name || '-'}`,
          class_id: s.class_id,
          class_name: s.class?.m_name || ''
        }));
        setStudents(studOptions);
      }

      // Fetch fee structures
      const structRes = await api.get('/school/fee-structures');
      if (structRes.data.success) {
        const structOptions = structRes.data.data.map((s: any) => ({
          value: s.id,
          label: `${s.fee_head_label || 'Fee'} - ₹${parseFloat(s.amount || 0).toFixed(2)} (${s.frequency_label || 'One Time'})`,
          class_id: s.class_id,
          amount: parseFloat(s.amount || 0),
          fee_head_label: s.fee_head_label
        }));
        setFeeStructures(structOptions);
      }
    } catch (err) {
      console.error('Failed to load master metadata', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/school/fee-payments/stats', {
        params: { academic_year_id: filterAcademicYear }
      });
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        only_trashed: viewTrash ? 1 : 0,
        class_id: filterClass || undefined,
        payment_mode: filterMode || undefined,
        payment_status: filterStatus || undefined,
        academic_year_id: filterAcademicYear || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      const res = await api.get('/school/fee-payments', { params });
      if (res.data.success) {
        setData(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load fee collections');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Student Profile on Selection
  const loadStudentProfile = async (studentId: string) => {
    if (!studentId) {
      setLoadedStudentProfile(null);
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await api.get(`/school/fee-payments/student-profile/${studentId}`);
      if (res.data.success) {
        setLoadedStudentProfile(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student profile', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Filter & Search & Sort
  const filteredData = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        item.receipt_number.toLowerCase().includes(q) ||
        item.student_name.toLowerCase().includes(q) ||
        (item.father_name && item.father_name.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        item.admission_number.toLowerCase().includes(q) ||
        item.class_name.toLowerCase().includes(q) ||
        (item.transaction_id && item.transaction_id.toLowerCase().includes(q)) ||
        (item.cheque_number && item.cheque_number.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, search, sortField, sortDirection]);

  // Handle Sort
  const handleSort = (field: 'receipt_number' | 'student_name' | 'class_name' | 'amount' | 'payment_date' | 'payment_status') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = paginatedData.map(item => item.id);
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number) => {
    const next = new Set(selectedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItems(next);
  };

  // Open Add/Edit Modal
  const openAddModal = () => {
    setEditingItem(null);
    setLoadedStudentProfile(null);
    setFormData({
      student_id: '',
      fee_structure_id: '',
      academic_year_id: filterAcademicYear,
      collection_type: 'full',
      installment_period: 'April',
      amount: '',
      late_fine: '0',
      discount_amount: '0',
      advance_amount: '0',
      refund_amount: '0',
      previous_balance_adjusted: '0',
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: 'Cash',
      transaction_id: '',
      cheque_number: '',
      bank_name: '',
      payment_status: 'paid',
      payment_for_month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      remarks: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeePaymentItem) => {
    setEditingItem(item);
    loadStudentProfile(item.student_id.toString());
    setFormData({
      student_id: item.student_id.toString(),
      fee_structure_id: item.fee_structure_id.toString(),
      academic_year_id: filterAcademicYear,
      collection_type: item.collection_type || 'full',
      installment_period: item.installment_period || 'April',
      amount: item.amount.toString(),
      late_fine: (item.late_fine || 0).toString(),
      discount_amount: (item.discount_amount || 0).toString(),
      advance_amount: (item.advance_amount || 0).toString(),
      refund_amount: (item.refund_amount || 0).toString(),
      previous_balance_adjusted: (item.previous_balance_adjusted || 0).toString(),
      payment_date: item.payment_date,
      payment_mode: item.payment_mode,
      transaction_id: item.transaction_id || '',
      cheque_number: item.cheque_number || '',
      bank_name: item.bank_name || '',
      payment_status: item.payment_status || 'paid',
      payment_for_month: item.payment_for_month || '',
      remarks: item.remarks || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  // Dynamic Net Remaining Balance Calculation inside Form
  const calculatedFormBalance = () => {
    const basePending = loadedStudentProfile ? loadedStudentProfile.balance_remaining : 0;
    const paidAmt = parseFloat(formData.amount) || 0;
    const fine = parseFloat(formData.late_fine) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    const prevAdj = parseFloat(formData.previous_balance_adjusted) || 0;

    const netBal = basePending - paidAmt + fine - discount + prevAdj;
    return Math.max(0, netBal);
  };

  // Submit Add/Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) {
      toast.error('Please select a student');
      return;
    }
    if (!formData.fee_structure_id) {
      toast.error('Please select a fee structure head');
      return;
    }
    if (formData.collection_type !== 'refund' && (!formData.amount || parseFloat(formData.amount) < 0)) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      const payload = {
        student_id: Number(formData.student_id),
        fee_structure_id: Number(formData.fee_structure_id),
        academic_year_id: formData.academic_year_id ? Number(formData.academic_year_id) : undefined,
        collection_type: formData.collection_type,
        installment_period: formData.installment_period,
        amount: parseFloat(formData.amount) || 0,
        late_fine: parseFloat(formData.late_fine) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        advance_amount: parseFloat(formData.advance_amount) || 0,
        refund_amount: parseFloat(formData.refund_amount) || 0,
        previous_balance_adjusted: parseFloat(formData.previous_balance_adjusted) || 0,
        balance_remaining: calculatedFormBalance(),
        payment_date: formData.payment_date,
        payment_mode: formData.payment_mode,
        transaction_id: formData.transaction_id || null,
        cheque_number: formData.cheque_number || null,
        bank_name: formData.bank_name || null,
        payment_status: formData.payment_status,
        payment_for_month: formData.payment_for_month,
        remarks: formData.remarks,
        is_active: formData.is_active
      };

      if (editingItem) {
        const res = await api.put(`/school/fee-payments/${editingItem.id}`, payload);
        if (res.data.success) {
          toast.success('Fee payment record updated successfully');
          setIsModalOpen(false);
          fetchData();
          fetchStats();
        }
      } else {
        const res = await api.post('/school/fee-payments', payload);
        if (res.data.success) {
          toast.success(res.data.message || 'Fee collected successfully');
          setIsModalOpen(false);
          fetchData();
          fetchStats();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save fee payment');
    }
  };

  // Single Actions
  const handleToggleStatus = async (item: FeePaymentItem) => {
    try {
      const res = await api.patch(`/school/fee-payments/${item.id}/toggle-status`);
      if (res.data.success) {
        toast.success(res.data.message);
        setData(prev => prev.map(d => d.id === item.id ? { ...d, is_active: res.data.is_active } : d));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleSingleTrash = async (id: number) => {
    try {
      const res = await api.delete(`/school/fee-payments/${id}`);
      if (res.data.success) {
        toast.success('Record moved to trash');
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to trash payment');
    }
  };

  const handleSingleRestore = async (id: number) => {
    try {
      const res = await api.post(`/school/fee-payments/${id}/restore`);
      if (res.data.success) {
        toast.success('Record restored successfully');
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore payment');
    }
  };

  const handleSinglePermanentDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this receipt record? This action cannot be undone.')) return;
    try {
      const res = await api.delete(`/school/fee-payments/${id}/force`);
      if (res.data.success) {
        toast.success('Record permanently deleted');
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = async (status: boolean) => {
    if (selectedItems.size === 0) return;
    try {
      const res = await api.post('/school/fee-payments/bulk-status', {
        ids: Array.from(selectedItems),
        is_active: status
      });
      if (res.data.success) {
        toast.success(`Bulk status updated to ${status ? 'Active' : 'Inactive'}`);
        setSelectedItems(new Set());
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk status update failed');
    }
  };

  const handleBulkTrash = async () => {
    if (selectedItems.size === 0) return;
    try {
      const res = await api.post('/school/fee-payments/bulk-trash', {
        ids: Array.from(selectedItems)
      });
      if (res.data.success) {
        toast.success(`${selectedItems.size} record(s) moved to trash`);
        setSelectedItems(new Set());
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk trash failed');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.size === 0) return;
    try {
      const res = await api.post('/school/fee-payments/bulk-restore', {
        ids: Array.from(selectedItems)
      });
      if (res.data.success) {
        toast.success(`${selectedItems.size} record(s) restored`);
        setSelectedItems(new Set());
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk restore failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedItems.size} record(s)?`)) return;
    try {
      const res = await api.post('/school/fee-payments/bulk-delete', {
        ids: Array.from(selectedItems)
      });
      if (res.data.success) {
        toast.success('Selected records permanently deleted');
        setSelectedItems(new Set());
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk delete failed');
    }
  };

  // Excel Sample & Export
  const downloadSampleFile = () => {
    const sampleRows = [
      {
        admission_number: 'ADM-2026-001',
        class_name: 'Class 10th',
        fee_head_label: 'Tuition Fee',
        collection_type: 'full',
        installment_period: 'April',
        amount: 4500,
        late_fine: 0,
        discount_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'UPI',
        transaction_id: 'UPI928374910293',
        cheque_number: '',
        bank_name: '',
        payment_status: 'paid',
        payment_for_month: 'April 2026',
        remarks: 'Sample ERP Fee Collection Row',
        is_active: 'Yes'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Fee_Collection');
    XLSX.writeFile(wb, 'Fee_Collection_Sample.xlsx');
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const exportRows = filteredData.map(item => ({
      'Receipt Number': item.receipt_number,
      'Student Name': item.student_name,
      'Father Name': item.father_name || '-',
      'Phone': item.phone || '-',
      'Admission Number': item.admission_number,
      'Class': item.class_name,
      'Fee Head': item.fee_head_label,
      'Collection Type': (item.collection_type || 'full').toUpperCase(),
      'Installment Period': item.installment_period || '-',
      'Amount (₹)': item.amount,
      'Late Fine (₹)': item.late_fine || 0,
      'Discount (₹)': item.discount_amount || 0,
      'Balance Remaining (₹)': item.balance_remaining || 0,
      'Payment Date': item.payment_date,
      'Payment Mode': item.payment_mode,
      'Transaction ID': item.transaction_id || '-',
      'Payment Status': item.payment_status.toUpperCase(),
      'Collector Name': item.collected_by_name || 'Admin',
      'Status': item.is_active ? 'Active' : 'Inactive'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fee_Collections');
    XLSX.writeFile(wb, `Fee_Collections_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Excel Import Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws);

        if (rawRows.length === 0) {
          toast.error('No rows found inside Excel sheet');
          return;
        }

        setImportData(rawRows);
        setImportPreview(rawRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (err) {
        toast.error('Failed to parse Excel file format');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const processImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/school/fee-payments/bulk-import', {
        data: importData,
        academic_year_id: filterAcademicYear ? Number(filterAcademicYear) : undefined
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsImportModalOpen(false);
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import Excel payload');
    } finally {
      setImporting(false);
    }
  };

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedPrintItems = useMemo(() => {
    return data.filter(item => selectedItems.has(item.id));
  }, [data, selectedItems]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">Paid</span>;
      case 'pending':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase">Pending</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md uppercase">Overdue</span>;
      case 'partial':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md uppercase">Partial</span>;
      case 'refunded':
        return <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md uppercase">Refunded</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md uppercase">{status}</span>;
    }
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold rounded">Cash</span>;
      case 'Online':
      case 'UPI':
      case 'Wallet':
        return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold rounded">{mode}</span>;
      case 'Cheque':
      case 'DD':
      case 'NEFT':
      case 'RTGS':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded">{mode}</span>;
      default:
        return <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold rounded">{mode}</span>;
    }
  };

  return (
    <div className="p-4 space-y-4 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Student Fee Collection Portal</h1>
            <p className="text-[10px] text-gray-500">Collect full, partial, installment, advance & fine fees, calculate balances, and generate official receipts.</p>
          </div>
        </div>

        {/* Global Selects */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-xs">
          <span className="font-bold text-gray-700 text-[10px] uppercase tracking-wider">Academic Year:</span>
          <select
            value={filterAcademicYear}
            onChange={(e) => setFilterAcademicYear(e.target.value)}
            className="px-2 py-0.5 text-xs border border-gray-300 rounded font-semibold text-gray-800 focus:outline-none bg-white cursor-pointer"
          >
            {academicYears.map((year) => (
              <option key={year.value} value={year.value}>{year.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Collected</span>
          <span className="text-base font-black text-emerald-600 block mt-0.5">₹{stats.total_collected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="text-[9px] text-emerald-500 font-semibold mt-1 block">Month: ₹{stats.this_month.toLocaleString('en-IN')}</span>
        </div>

        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Receipts</span>
          <span className="text-base font-black text-gray-800 block mt-0.5">{stats.total_payments} Receipts</span>
          <span className="text-[9px] text-gray-400 font-medium mt-1 block">{stats.paid_count} Paid / {stats.pending_count} Pending</span>
        </div>

        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pending Receipts</span>
          <span className="text-base font-black text-amber-600 block mt-0.5">{stats.pending_count} Pending</span>
          <span className="text-[9px] text-amber-500 font-semibold mt-1 block">Awaiting payment</span>
        </div>

        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Overdue Receipts</span>
          <span className="text-base font-black text-rose-600 block mt-0.5">{stats.overdue_count} Overdue</span>
          <span className="text-[9px] text-rose-500 font-semibold mt-1 block">Delayed collection</span>
        </div>

        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Trashed Records</span>
          <span className="text-base font-black text-gray-500 block mt-0.5">{stats.trashed_count} Items</span>
          <span className="text-[9px] text-gray-400 font-medium mt-1 block">Soft deleted</span>
        </div>
      </div>

      {/* Advanced Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Per Page, Trash Toggle, Sample, Import, Export, + Collect Fee */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Receipt, Student Name, Adm No, Roll, Txn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Trash View Toggle */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
              <span className="font-bold text-gray-600 text-[10px] uppercase tracking-wider">Trash</span>
              <button
                type="button"
                onClick={() => setViewTrash(prev => !prev)}
                className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${
                  viewTrash ? 'bg-rose-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                    viewTrash ? 'translate-x-[18px]' : 'translate-x-[4px]'
                  }`}
                />
              </button>
            </div>

            {/* Items Per Page */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none"
            >
              <option value={10}>10 Per Page</option>
              <option value={25}>25 Per Page</option>
              <option value={50}>50 Per Page</option>
              <option value={-1}>All Records</option>
            </select>
          </div>

          {/* Action Buttons: Sample, Import, Export, + Collect Fee */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleFile}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition font-bold shadow-xs text-xs"
            >
              Sample
            </button>

            <label className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition cursor-pointer font-bold shadow-xs text-xs">
              Import
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Collect Fee
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Filter Controls (Class, Payment Mode, Status, From Date, To Date) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filters:</span>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Payment Mode Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none"
          >
            <option value="">All Payment Modes</option>
            {paymentModes.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none"
          >
            <option value="">All Payment Statuses</option>
            {paymentStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Date Range Filters */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-0.5 bg-white">
            <span className="text-[10px] font-bold text-gray-500 uppercase">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs text-gray-700 bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-0.5 bg-white">
            <span className="text-[10px] font-bold text-gray-500 uppercase">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs text-gray-700 bg-transparent focus:outline-none"
            />
          </div>

          {(filterClass || filterMode || filterStatus || fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFilterClass('');
                setFilterMode('');
                setFilterStatus('');
                setFromDate('');
                setToDate('');
              }}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-md transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Context Menu Bar */}
      {selectedItems.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px]">
              {selectedItems.size} Selected
            </span>
            <span>Bulk operational actions:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkReceiptModalOpen(true)}
              className="px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded font-bold shadow-xs"
            >
              Bulk Print Receipts
            </button>

            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkStatusChange(true)}
                  className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded font-semibold transition"
                >
                  Set Active
                </button>
                <button
                  onClick={() => handleBulkStatusChange(false)}
                  className="px-2.5 py-1 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 rounded font-semibold transition"
                >
                  Set Inactive
                </button>
                <button
                  onClick={handleBulkTrash}
                  className="px-2.5 py-1 bg-rose-600 text-white hover:bg-rose-700 rounded font-bold transition shadow-xs"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-bold transition shadow-xs"
                >
                  Restore Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-rose-700 text-white hover:bg-rose-800 rounded font-bold transition shadow-xs"
                >
                  Delete Permanently
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-gray-200 text-gray-700 font-bold text-[10.5px] uppercase tracking-wider">
                <th className="px-3 py-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 w-3.5 h-3.5"
                  />
                </th>
                <th onClick={() => handleSort('receipt_number')} className="px-3 py-3 cursor-pointer hover:bg-slate-200/50 transition select-none">
                  Receipt # {sortField === 'receipt_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('student_name')} className="px-3 py-3 cursor-pointer hover:bg-slate-200/50 transition select-none">
                  Student Name {sortField === 'student_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('class_name')} className="px-3 py-3 cursor-pointer hover:bg-slate-200/50 transition select-none">
                  Class {sortField === 'class_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3">Fee Head / Period</th>
                <th onClick={() => handleSort('amount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200/50 transition select-none">
                  Paid Amount (₹) {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-right">Balance (₹)</th>
                <th onClick={() => handleSort('payment_date')} className="px-3 py-3 cursor-pointer hover:bg-slate-200/50 transition select-none">
                  Date {sortField === 'payment_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3">Mode</th>
                <th onClick={() => handleSort('payment_status')} className="px-3 py-3 cursor-pointer hover:bg-slate-200/50 transition select-none">
                  Status {sortField === 'payment_status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-center">Active</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-150">
              {loading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-400 italic">
                    Loading fee collection records...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-400 italic">
                    No fee collection records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-gray-300 text-emerald-600 w-3.5 h-3.5"
                      />
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-emerald-700">
                      {item.receipt_number}
                      {item.collection_type && (
                        <span className="block text-[8.5px] uppercase font-bold text-indigo-600">
                          {item.collection_type}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-gray-900">{item.student_name}</div>
                      <div className="text-[10px] text-gray-400">Father: {item.father_name || '-'} | Adm: {item.admission_number}</div>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-700">
                      {item.class_name} {item.section ? `(${item.section})` : ''}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-gray-800">{item.fee_head_label}</span>
                      <span className="block text-[9px] text-indigo-700 font-semibold">{item.installment_period || item.payment_for_month || 'Regular'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-black text-gray-900">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      {Number(item.late_fine) > 0 && <span className="block text-[8.5px] text-rose-500 font-bold">+Fine: ₹{item.late_fine}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-rose-600">
                      ₹{(item.balance_remaining || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                      {item.payment_date}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {getModeBadge(item.payment_mode)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {getStatusBadge(item.payment_status)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <ToggleSwitch checked={item.is_active} onChange={() => handleToggleStatus(item)} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setPrintingItem(item);
                            setIsReceiptModalOpen(true);
                          }}
                          title="Print Receipt Slip"
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>

                        {!viewTrash ? (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit Record"
                              className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleSingleTrash(item.id)}
                              title="Trash / Void Receipt"
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSingleRestore(item.id)}
                              title="Restore Record"
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleSinglePermanentDelete(item.id)}
                              title="Delete Permanently"
                              className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && itemsPerPage !== -1 && (
          <div className="p-3 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`px-2.5 py-1 text-xs font-bold border rounded ${
                    currentPage === pNum ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pNum}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collect Fee Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-200 flex flex-col max-h-[94vh] overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">{editingItem ? 'Edit Student Fee Collection' : 'Record Student Fee Payment & Print Receipt'}</h3>
                  <p className="text-[10px] text-gray-500">Collect full, partial, installment, advance & fine fees, calculate balance, and generate official receipt.</p>
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

            {/* Content Row split */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <form onSubmit={handleSubmitForm} className="lg:col-span-7 space-y-3 bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs">
                  {/* 1. Student Select */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-0.5 text-[11px]">Search Student (Adm No / Name / Mobile):</label>
                    <Select
                      options={students}
                      isDisabled={!!editingItem}
                      value={students.find(s => s.value.toString() === formData.student_id)}
                      onChange={(selected: any) => {
                        const studId = selected ? selected.value.toString() : '';
                        setFormData({
                          ...formData,
                          student_id: studId,
                          fee_structure_id: ''
                        });
                        loadStudentProfile(studId);
                      }}
                      placeholder="Type student name, admission number or roll..."
                      menuPortalTarget={document.body}
                      styles={{
                        control: (base) => ({
                          ...base,
                          fontSize: '11px',
                          borderColor: '#d1d5db',
                          borderRadius: '6px',
                          minHeight: '32px',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#9ca3af' }
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  </div>

                  {/* Student Fee Screen Profile summary box */}
                  {loadingProfile ? (
                    <div className="p-2 bg-gray-50 border rounded-lg text-center text-gray-400 italic text-[10px]">
                      Loading student fee profile summary...
                    </div>
                  ) : loadedStudentProfile ? (
                    <div className="bg-emerald-50/50 border border-emerald-200 p-2.5 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center border-b border-emerald-200/70 pb-1">
                        <div>
                          <span className="font-black text-gray-900 text-[11px]">{loadedStudentProfile.student_name}</span>
                          <span className="text-[9.5px] text-gray-500 block">Father: {loadedStudentProfile.father_name} | Phone: {loadedStudentProfile.phone}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[9.5px] font-bold shadow-xs">
                          {loadedStudentProfile.class_name} {loadedStudentProfile.section ? `(${loadedStudentProfile.section})` : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-[9.5px] font-bold text-gray-700 text-center">
                        <div className="bg-white p-1 rounded-lg border border-emerald-100 shadow-xs">
                          <span className="text-gray-400 block font-normal text-[8.5px] uppercase">Assigned Fee</span>
                          <span className="text-gray-900">₹{loadedStudentProfile.total_assigned_fee.toFixed(2)}</span>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-emerald-100 shadow-xs">
                          <span className="text-emerald-600 block font-normal text-[8.5px] uppercase">Total Paid</span>
                          <span className="text-emerald-700">₹{loadedStudentProfile.total_paid.toFixed(2)}</span>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-emerald-100 shadow-xs">
                          <span className="text-amber-600 block font-normal text-[8.5px] uppercase">Discounts</span>
                          <span className="text-amber-700">₹{loadedStudentProfile.total_discounts.toFixed(2)}</span>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-emerald-100 shadow-xs">
                          <span className="text-rose-600 block font-normal text-[8.5px] uppercase">Pending Balance</span>
                          <span className="text-rose-700">₹{loadedStudentProfile.balance_remaining.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* 2. Collection Type & Installment Period */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[11px]">Collection Type:</label>
                      <select
                        value={formData.collection_type}
                        onChange={(e) => setFormData({ ...formData, collection_type: e.target.value })}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-md bg-white font-semibold text-gray-800 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        {collectionTypes.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[11px]">Installment / Period:</label>
                      <select
                        value={formData.installment_period}
                        onChange={(e) => setFormData({ ...formData, installment_period: e.target.value })}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-md bg-white font-semibold text-gray-800 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        {installmentPeriods.map(i => (
                          <option key={i.value} value={i.value}>{i.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3. Fee Structure Select */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-0.5 text-[11px]">Select Fee Structure Head:</label>
                    <select
                      value={formData.fee_structure_id}
                      onChange={(e) => {
                        const structId = e.target.value;
                        const matched = feeStructures.find(s => s.value.toString() === structId);
                        setFormData({
                          ...formData,
                          fee_structure_id: structId,
                          amount: matched && matched.amount ? matched.amount.toString() : formData.amount
                        });
                      }}
                      className="w-full px-2.5 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-semibold text-gray-700 text-[11px]"
                    >
                      <option value="">Select fee structure head...</option>
                      {feeStructures.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Payment Amount Math Calculations */}
                  <div className="grid grid-cols-3 gap-2 border border-gray-200 p-2 rounded-lg bg-slate-50/60">
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Paid Amount (₹):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded font-bold text-emerald-700 text-[11px] bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Late Fine (₹):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.late_fine}
                        onChange={(e) => setFormData({ ...formData, late_fine: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded font-bold text-rose-600 text-[11px] bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Discount (₹):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded font-bold text-amber-700 text-[11px] bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* 5. Payment Mode & Status */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Payment Mode:</label>
                      <select
                        value={formData.payment_mode}
                        onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-[11px]"
                      >
                        {paymentModes.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Payment Status:</label>
                      <select
                        value={formData.payment_status}
                        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-[11px]"
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="partial">Partial</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Payment Date:</label>
                      <input
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 6. Mode Specific Details */}
                  {(formData.payment_mode !== 'Cash') && (
                    <div className="grid grid-cols-2 gap-2 bg-purple-50/30 border border-purple-200 p-2 rounded-lg">
                      <div>
                        <label className="font-bold text-purple-900 block mb-0.5 text-[10px]">Transaction / UTR Reference ID:</label>
                        <input
                          type="text"
                          value={formData.transaction_id}
                          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                          className="w-full px-2 py-1 border border-purple-300 rounded font-mono text-[10.5px]"
                          placeholder="e.g. TXN920193847291"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-purple-900 block mb-0.5 text-[10px]">Cheque / Bank Name:</label>
                        <input
                          type="text"
                          value={formData.bank_name}
                          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                          className="w-full px-2 py-1 border border-purple-300 rounded text-[10.5px]"
                          placeholder="e.g. HDFC / SBI"
                        />
                      </div>
                    </div>
                  )}

                  {/* 7. Remarks */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-0.5 text-[10.5px]">Remarks / Internal Notes:</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className="w-full px-2.5 py-1 border border-gray-300 rounded-md h-10 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Specify installment notes, discount justification, cheque details etc."
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <ToggleSwitch checked={formData.is_active} onChange={() => setFormData({ ...formData, is_active: !formData.is_active })} />
                    <span className="font-bold text-gray-750 text-[10.5px]">Active Fee Receipt Record</span>
                  </div>
                </form>

                {/* Right side live docket preview card */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-xl p-4 shadow-xl flex flex-col justify-between border border-slate-800 self-stretch min-h-[380px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                      <div>
                        <h4 className="font-black text-[11px] uppercase tracking-wider text-emerald-400">official erp receipt preview</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Live docket layout calculation</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded uppercase tracking-wider">RCPT</span>
                    </div>

                    {formData.student_id ? (
                      <div className="mb-3 bg-slate-800/80 p-2 rounded-lg border border-slate-700 space-y-0.5">
                        <div className="font-bold text-[11px] text-emerald-200">
                          {students.find(s => s.value.toString() === formData.student_id)?.label}
                        </div>
                        {loadedStudentProfile && (
                          <div className="text-[9px] text-slate-300">
                            Father: {loadedStudentProfile.father_name} | Phone: {loadedStudentProfile.phone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-3 bg-slate-800/40 p-3 rounded-lg text-center text-slate-400 italic text-[10px] border border-dashed border-slate-700">
                        Select student to preview receipt docket
                      </div>
                    )}

                    <div className="space-y-2 text-[10.5px]">
                      <div className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-300">
                        <span>Collection Type:</span>
                        <span className="font-bold uppercase text-emerald-400">{formData.collection_type}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-300">
                        <span>Installment Period:</span>
                        <span className="font-semibold text-white">{formData.installment_period}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-300">
                        <span>Fee Head:</span>
                        <span className="font-bold text-white">
                          {feeStructures.find(s => s.value.toString() === formData.fee_structure_id)?.fee_head_label || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-300">
                        <span>Payment Mode:</span>
                        <span className="font-bold text-emerald-300">{formData.payment_mode}</span>
                      </div>
                    </div>

                    <div className="mt-3 bg-slate-800/70 p-2.5 rounded-lg border border-slate-700 space-y-1 text-[10px]">
                      <div className="flex justify-between text-emerald-300 font-semibold">
                        <span>Current Paid Amount:</span>
                        <span className="font-bold">₹{(parseFloat(formData.amount) || 0).toFixed(2)}</span>
                      </div>
                      {Number(formData.late_fine) > 0 && (
                        <div className="flex justify-between text-rose-300">
                          <span>Late Fine:</span>
                          <span>+₹{(parseFloat(formData.late_fine) || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(formData.discount_amount) > 0 && (
                        <div className="flex justify-between text-amber-300">
                          <span>Discount Waiver:</span>
                          <span>-₹{(parseFloat(formData.discount_amount) || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-700/80 pt-1 text-rose-400 font-bold">
                        <span>Remaining Net Balance:</span>
                        <span>₹{calculatedFormBalance().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-400">Total Receipt Amount</span>
                      <span className="text-xl font-black text-emerald-400">
                        ₹{(parseFloat(formData.amount || '0') + (parseFloat(formData.late_fine) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-150 flex items-center justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitForm}
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs shadow-md transition"
              >
                {editingItem ? 'Save Updates' : 'Confirm & Generate Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Slip Modal */}
      {isReceiptModalOpen && printingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <h3 className="text-sm font-black uppercase tracking-wider">Official Fee Receipt Slip</h3>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-white/80 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Receipt Printable Card Area */}
            <div className="p-6 bg-white space-y-4 font-sans text-xs">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-base font-black uppercase text-emerald-800">MY SCHOOL POINT ERP</h2>
                  <span className="text-[10px] text-gray-500 block">Official Fee Receipt Docket</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-gray-900 block">{printingItem.receipt_number}</span>
                  <span className="text-[10px] text-gray-400 block">{printingItem.payment_date}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg text-[11px]">
                <div>
                  <span className="text-gray-400 text-[10px] block">Student Name:</span>
                  <span className="font-bold text-gray-900">{printingItem.student_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Father Name:</span>
                  <span className="font-bold text-gray-900">{printingItem.father_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Admission No:</span>
                  <span className="font-bold text-gray-900">{printingItem.admission_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Class / Section:</span>
                  <span className="font-semibold text-gray-800">{printingItem.class_name} {printingItem.section ? `(${printingItem.section})` : ''}</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-[10px] uppercase font-bold text-gray-600">
                    <tr>
                      <th className="p-2 border-b">Fee Item & Period</th>
                      <th className="p-2 border-b text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-gray-800">
                        {printingItem.fee_head_label} ({printingItem.installment_period || printingItem.payment_for_month || 'Regular'})
                      </td>
                      <td className="p-2 text-right font-bold">₹{printingItem.amount.toFixed(2)}</td>
                    </tr>
                    {Number(printingItem.late_fine) > 0 && (
                      <tr className="border-b text-rose-700">
                        <td className="p-2 font-semibold">Late Fine Charge</td>
                        <td className="p-2 text-right font-bold">+₹{Number(printingItem.late_fine).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(printingItem.discount_amount) > 0 && (
                      <tr className="border-b text-amber-700">
                        <td className="p-2 font-semibold">Discount Waiver</td>
                        <td className="p-2 text-right font-bold">-₹{Number(printingItem.discount_amount).toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-[10px] text-gray-500 space-y-0.5">
                  <div>Payment Mode: <strong className="text-gray-800">{printingItem.payment_mode}</strong></div>
                  {printingItem.transaction_id && <div>Txn ID: {printingItem.transaction_id}</div>}
                  {printingItem.collected_by_name && <div>Collected By: {printingItem.collected_by_name}</div>}
                  <div className="font-bold text-rose-700 mt-1">Remaining Balance: ₹{(printingItem.balance_remaining || 0).toFixed(2)}</div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Total Paid</span>
                  <span className="text-lg font-black text-emerald-600">
                    ₹{printingItem.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>

                  {/* QR Code Barcode Mockup */}
                  <div className="mt-2 p-1 border border-dashed rounded bg-slate-50 flex items-center gap-1">
                    <div className="w-8 h-8 bg-gray-900 flex items-center justify-center text-[7px] text-white font-mono rounded">
                      QR-CODE
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-150 flex items-center justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Slip Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Print Receipts Modal */}
      {isBulkReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/65 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-650 text-white">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Bulk Receipts Batch Printer</h3>
                <p className="text-[10px] text-indigo-200">Printing {selectedPrintItems.length} selected fee receipt dockets.</p>
              </div>
              <button onClick={() => setIsBulkReceiptModalOpen(false)} className="text-white/80 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-100">
              {selectedPrintItems.map(item => (
                <div key={item.id} className="p-4 bg-white border border-gray-300 rounded-xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.receipt_number} - {item.student_name}</h4>
                      <span className="text-[10px] text-gray-500">Class: {item.class_name} | Father: {item.father_name}</span>
                    </div>
                    <span className="font-black text-emerald-600 text-sm">₹{item.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>Head: {item.fee_head_label} ({item.installment_period || 'Regular'})</span>
                    <span>Mode: {item.payment_mode} | Date: {item.payment_date}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-150 flex items-center justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setIsBulkReceiptModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded font-bold text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold shadow-xs flex items-center gap-1.5"
              >
                Print All {selectedPrintItems.length} Receipts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/45 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full border border-gray-150 flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Excel Fee Collection Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing first 5 rows before recording bulk transactions to database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Admission Number</th>
                    <th className="px-3 py-2 border">Class</th>
                    <th className="px-3 py-2 border">Fee Head</th>
                    <th className="px-3 py-2 border text-right">Amount (₹)</th>
                    <th className="px-3 py-2 border">Payment Date</th>
                    <th className="px-3 py-2 border">Mode</th>
                    <th className="px-3 py-2 border">Transaction ID</th>
                    <th className="px-3 py-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-semibold">{row.admission_number || '-'}</td>
                      <td className="px-3 py-2 border font-bold">{row.class_name || '-'}</td>
                      <td className="px-3 py-2 border">{row.fee_head_label || '-'}</td>
                      <td className="px-3 py-2 border text-right font-bold text-emerald-700">₹{parseFloat(row.amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border">{row.payment_date || '-'}</td>
                      <td className="px-3 py-2 border">{row.payment_mode || 'Cash'}</td>
                      <td className="px-3 py-2 border font-mono">{row.transaction_id || '-'}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-emerald-600">{row.payment_status || 'PAID'}</td>
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
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={processImport}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-sm"
              >
                {importing ? 'Importing...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
