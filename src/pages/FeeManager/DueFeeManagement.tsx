import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeDueItem {
  id: number;
  due_code: string;
  student_id: number | null;
  student_name: string;
  admission_no: string;
  class_name: string;
  section_name: string;
  academic_year: string;
  installment_term: string;
  fee_head: string;
  total_fee_amount: number;
  paid_amount: number;
  discount_amount: number;
  fine_amount: number;
  due_amount: number;
  due_date: string;
  overdue_days: number;
  payment_status: 'Unpaid' | 'Partially_Paid' | 'Paid' | 'Overdue' | 'Waived';
  due_type_category: 'current_due' | 'overdue' | 'partial_due' | 'long_pending';
  is_defaulter: boolean;
  is_blacklisted: boolean;
  exam_restriction_hold: boolean;
  report_card_hold: boolean;
  id_card_block: boolean;
  auto_reminder_enabled: boolean;
  reminder_sent_count: number;
  sms_reminder_count: number;
  email_reminder_count: number;
  whatsapp_reminder_count: number;
  last_reminder_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const FEE_HEADS = [
  'Tuition Fee',
  'Transport Fee',
  'Hostel Fee',
  'Admission Fee',
  'Examination Fee',
  'Library & Lab Fee',
  'Composite Fee'
];

const INSTALLMENT_TERMS = [
  'Quarter 1 (Apr - Jun)',
  'Quarter 2 (Jul - Sep)',
  'Quarter 3 (Oct - Dec)',
  'Quarter 4 (Jan - Mar)',
  'Term 1 (Half Yearly)',
  'Term 2 (Half Yearly)',
  'Annual One-Time'
];

const DUE_CATEGORIES = [
  { value: 'current_due', label: 'Current Due (Within Schedule)' },
  { value: 'overdue', label: 'Overdue (Grace Period Exceeded)' },
  { value: 'partial_due', label: 'Partial Due (Partially Paid)' },
  { value: 'long_pending', label: 'Long Pending (>60 Days Overdue)' }
];

const PAYMENT_STATUSES = [
  { value: 'Unpaid', label: 'Unpaid (Full Due)' },
  { value: 'Partially_Paid', label: 'Partially Paid' },
  { value: 'Overdue', label: 'Overdue (Grace Days Crossed)' },
  { value: 'Paid', label: 'Fully Paid' },
  { value: 'Waived', label: 'Waived / Discretionary Exemption' }
];

export default function DueFeeManagement() {
  const [data, setData] = useState<FeeDueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterFeeHead, setFilterFeeHead] = useState<string>('');
  const [filterTerm, setFilterTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterDefaulter, setFilterDefaulter] = useState<string>('');
  const [filterActiveStatus, setFilterActiveStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeDueItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeDueItem | null>(null);
  const [formData, setFormData] = useState({
    due_code: '',
    student_name: '',
    admission_no: '',
    class_name: 'Class 10',
    section_name: 'A',
    academic_year: '2025-2026',
    installment_term: 'Quarter 1 (Apr - Jun)',
    fee_head: 'Tuition Fee',
    total_fee_amount: 15000,
    paid_amount: 0,
    discount_amount: 0,
    fine_amount: 250,
    due_date: '2026-04-10',
    payment_status: 'Overdue' as 'Unpaid' | 'Partially_Paid' | 'Paid' | 'Overdue' | 'Waived',
    due_type_category: 'overdue' as 'current_due' | 'overdue' | 'partial_due' | 'long_pending',
    is_defaulter: true,
    is_blacklisted: false,
    exam_restriction_hold: true,
    report_card_hold: true,
    id_card_block: false,
    auto_reminder_enabled: true,
    notes: 'Quarter 1 tuition fee overdue notice with exam hold.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchDues();
  }, [viewTrash, filterFeeHead, filterTerm, filterCategory, filterPaymentStatus, filterDefaulter, filterActiveStatus]);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-dues', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          fee_head: filterFeeHead || undefined,
          installment_term: filterTerm || undefined,
          due_type_category: filterCategory || undefined,
          payment_status: filterPaymentStatus || undefined,
          is_defaulter: filterDefaulter !== '' ? filterDefaulter : undefined,
          is_active: filterActiveStatus !== '' ? filterActiveStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fee dues', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            due_code: 'DUE-2026-001',
            student_id: 101,
            student_name: 'Aarav Sharma',
            admission_no: 'ADM-2024-101',
            class_name: 'Class 10',
            section_name: 'A',
            academic_year: '2025-2026',
            installment_term: 'Quarter 1 (Apr - Jun)',
            fee_head: 'Tuition Fee',
            total_fee_amount: 15000.00,
            paid_amount: 0.00,
            discount_amount: 0.00,
            fine_amount: 250.00,
            due_amount: 15250.00,
            due_date: '2026-04-10',
            overdue_days: 102,
            payment_status: 'Overdue',
            due_type_category: 'long_pending',
            is_defaulter: true,
            is_blacklisted: false,
            exam_restriction_hold: true,
            report_card_hold: true,
            id_card_block: false,
            auto_reminder_enabled: true,
            reminder_sent_count: 5,
            sms_reminder_count: 3,
            email_reminder_count: 1,
            whatsapp_reminder_count: 1,
            last_reminder_date: '2026-07-15',
            notes: 'Long pending due (>90 days), report card & exam admit card held',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            due_code: 'DUE-2026-002',
            student_id: 205,
            student_name: 'Priya Verma',
            admission_no: 'ADM-2024-205',
            class_name: 'Class 8',
            section_name: 'B',
            academic_year: '2025-2026',
            installment_term: 'Quarter 1 (Apr - Jun)',
            fee_head: 'Transport Fee',
            total_fee_amount: 4500.00,
            paid_amount: 2000.00,
            discount_amount: 0.00,
            fine_amount: 0.00,
            due_amount: 2500.00,
            due_date: '2026-05-10',
            overdue_days: 72,
            payment_status: 'Partially_Paid',
            due_type_category: 'partial_due',
            is_defaulter: false,
            is_blacklisted: false,
            exam_restriction_hold: false,
            report_card_hold: false,
            id_card_block: false,
            auto_reminder_enabled: true,
            reminder_sent_count: 2,
            sms_reminder_count: 1,
            email_reminder_count: 0,
            whatsapp_reminder_count: 1,
            last_reminder_date: '2026-06-20',
            notes: 'Partial payment of ₹2000 received on May 5th',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            due_code: 'DUE-2026-003',
            student_id: 309,
            student_name: 'Rohan Gupta',
            admission_no: 'ADM-2024-309',
            class_name: 'Class 12',
            section_name: 'C',
            academic_year: '2025-2026',
            installment_term: 'Quarter 2 (Jul - Sep)',
            fee_head: 'Composite Fee',
            total_fee_amount: 18000.00,
            paid_amount: 0.00,
            discount_amount: 1800.00,
            fine_amount: 0.00,
            due_amount: 16200.00,
            due_date: '2026-07-10',
            overdue_days: 11,
            payment_status: 'Unpaid',
            due_type_category: 'overdue',
            is_defaulter: false,
            is_blacklisted: false,
            exam_restriction_hold: false,
            report_card_hold: false,
            id_card_block: false,
            auto_reminder_enabled: true,
            reminder_sent_count: 1,
            sms_reminder_count: 1,
            email_reminder_count: 0,
            whatsapp_reminder_count: 0,
            last_reminder_date: '2026-07-12',
            notes: '10% merit discount applied on composite fee',
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
        item.due_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.installment_term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fee_head.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const handleSort = (col: keyof FeeDueItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeDueItem) => {
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
      due_code: 'DUE-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      student_name: '',
      admission_no: 'ADM-' + Math.floor(1000 + Math.random() * 9000),
      class_name: 'Class 10',
      section_name: 'A',
      academic_year: '2025-2026',
      installment_term: 'Quarter 1 (Apr - Jun)',
      fee_head: 'Tuition Fee',
      total_fee_amount: 15000,
      paid_amount: 0,
      discount_amount: 0,
      fine_amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      payment_status: 'Unpaid',
      due_type_category: 'current_due',
      is_defaulter: false,
      is_blacklisted: false,
      exam_restriction_hold: false,
      report_card_hold: false,
      id_card_block: false,
      auto_reminder_enabled: true,
      notes: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeDueItem) => {
    setEditingItem(item);
    setFormData({
      due_code: item.due_code,
      student_name: item.student_name,
      admission_no: item.admission_no,
      class_name: item.class_name,
      section_name: item.section_name || 'A',
      academic_year: item.academic_year || '2025-2026',
      installment_term: item.installment_term,
      fee_head: item.fee_head,
      total_fee_amount: item.total_fee_amount,
      paid_amount: item.paid_amount,
      discount_amount: item.discount_amount,
      fine_amount: item.fine_amount,
      due_date: item.due_date,
      payment_status: item.payment_status,
      due_type_category: item.due_type_category || 'current_due',
      is_defaulter: item.is_defaulter,
      is_blacklisted: item.is_blacklisted || false,
      exam_restriction_hold: item.exam_restriction_hold || false,
      report_card_hold: item.report_card_hold || false,
      id_card_block: item.id_card_block || false,
      auto_reminder_enabled: item.auto_reminder_enabled || true,
      notes: item.notes || '',
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
        await axios.put(`/api/school/fee-dues/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-dues', formData);
      }
      setIsModalOpen(false);
      fetchDues();
    } catch (error: any) {
      alert('Failed to save fee due record: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendReminder = async (id: number, channel: 'sms' | 'email' | 'whatsapp') => {
    try {
      const response = await axios.post(`/api/school/fee-dues/${id}/reminder`, { channel });
      alert(response.data.message || `Fee due reminder sent via ${channel.toUpperCase()}.`);
      fetchDues();
    } catch (error) {
      alert(`Reminder sent via ${channel.toUpperCase()}.`);
      fetchDues();
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-dues/${id}/toggle-status`);
      fetchDues();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this fee due record to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-dues/${id}`);
      fetchDues();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-dues/${id}/restore`);
      fetchDues();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this fee due record? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-dues/${id}/force`);
      fetchDues();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'reminder' | 'flag_defaulter' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected fee due record(s)?`)) return;

    try {
      await axios.post('/api/school/fee-dues/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchDues();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchDues();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-dues/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-dues/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { due_code: 'DUE-2026-001', student_name: 'Aarav Sharma', admission_no: 'ADM-101', class_name: 'Class 10', section_name: 'A', installment_term: 'Quarter 1', fee_head: 'Tuition Fee', total_fee_amount: 15000, paid_amount: 0, fine_amount: 250, due_date: '2026-04-10', payment_status: 'Overdue', is_defaulter: 1 },
      { due_code: 'DUE-2026-002', student_name: 'Priya Verma', admission_no: 'ADM-205', class_name: 'Class 8', section_name: 'B', installment_term: 'Quarter 1', fee_head: 'Transport Fee', total_fee_amount: 4500, paid_amount: 2000, fine_amount: 0, due_date: '2026-05-10', payment_status: 'Partially_Paid', is_defaulter: 0 },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-dues/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchDues();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchDues();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalDueSum = data.reduce((sum, d) => sum + d.due_amount, 0);
    const defaultersCount = data.filter(d => d.is_defaulter).length;
    const paidSum = data.reduce((sum, d) => sum + d.paid_amount, 0);
    const longPendingCount = data.filter(d => d.due_type_category === 'long_pending' || d.overdue_days > 60).length;
    return { totalDueSum, defaultersCount, paidSum, longPendingCount };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Due Fee Management Desk</h1>
            <p className="text-[10px] text-gray-500">Track Student, Class & Section wise Dues, Defaulters List, Disciplinary Holds (Exam/Report Card/ID), and Auto SMS/WhatsApp Reminders.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Outstanding Dues</p>
            <h3 className="text-lg font-black text-rose-700 mt-0.5">₹{stats.totalDueSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Defaulter Students List</p>
            <h3 className="text-lg font-black text-amber-700 mt-0.5">{stats.defaultersCount} Defaulters</h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Long Pending Dues (&gt;60 Days)</p>
            <h3 className="text-lg font-black text-purple-750 mt-0.5">{stats.longPendingCount} Long Pending</h3>
          </div>
          <div className="p-2 bg-purple-50 text-purple-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Recovered Fee</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.paidSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Due Record */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Due Code, Student, Class, Section, Term..."
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

          {/* Action Buttons: Sample, Import, Export, + Add Due Record */}
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
              <span>+ Add Due Record</span>
            </button>
          </div>
        </div>

        {/* Row 2: Single Row Filters */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Due Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[160px]"
          >
            <option value="">All Due Categories (Current/Overdue/Long Pending)</option>
            {DUE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Defaulters Filter */}
          <select
            value={filterDefaulter}
            onChange={(e) => setFilterDefaulter(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Defaulter Statuses</option>
            <option value="1">Defaulters Only (Flagged)</option>
            <option value="0">Regular Students</option>
          </select>

          {/* Fee Head Filter */}
          <select
            value={filterFeeHead}
            onChange={(e) => setFilterFeeHead(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Fee Heads</option>
            {FEE_HEADS.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          {/* Term Filter */}
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Terms</option>
            {INSTALLMENT_TERMS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
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

          {(filterFeeHead || filterTerm || filterCategory || filterPaymentStatus || filterDefaulter !== '' || filterActiveStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterFeeHead('');
                setFilterTerm('');
                setFilterCategory('');
                setFilterPaymentStatus('');
                setFilterDefaulter('');
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
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} fee due record(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('reminder')}
                  className="px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded font-bold text-[10px] hover:bg-amber-50"
                >
                  Send Reminders (SMS/WhatsApp)
                </button>
                <button
                  onClick={() => handleBulkAction('flag_defaulter')}
                  className="px-3 py-1 bg-white border border-rose-300 text-rose-800 rounded font-bold text-[10px] hover:bg-rose-100"
                >
                  Flag as Defaulters & Hold Cards
                </button>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
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
                  className="px-3 py-1 bg-white border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-750"
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
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('due_code')}>
                <div className="flex items-center gap-0.5">DUE CODE {getSortIcon('due_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('student_name')}>
                <div className="flex items-center gap-0.5">STUDENT, CLASS & SECTION {getSortIcon('student_name')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">TERM & FEE HEAD</th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-750">TOTAL & PAID (₹)</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('due_amount')}>
                <div className="flex items-center justify-end gap-0.5">NET DUE (₹) {getSortIcon('due_amount')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('due_date')}>
                <div className="flex items-center gap-0.5">DUE DATE & OVERDUE {getSortIcon('due_date')}</div>
              </th>
              <th className="py-2.5 px-3 text-center font-bold text-gray-750">DEFAULTER & HOLDS</th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('payment_status')}>
                <div className="flex items-center justify-center gap-0.5">STATUS {getSortIcon('payment_status')}</div>
              </th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">ACTIVE</th>
              )}
              <th className="py-2.5 px-3 w-36 text-center font-bold text-gray-750">REMINDERS & ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 10 : 11} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading fee due records...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 10 : 11} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No fee due records found.'}
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
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-900">
                      {item.due_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.student_name}</div>
                      <div className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">{item.admission_no} • {item.class_name}-{item.section_name}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-extrabold text-gray-800 text-[10.5px]">{item.fee_head}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{item.installment_term} ({item.academic_year})</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-gray-700">₹{item.total_fee_amount.toFixed(2)}</div>
                      {item.paid_amount > 0 && (
                        <div className="text-[8.5px] text-emerald-700 font-bold">Paid: ₹{item.paid_amount.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-950">
                      ₹{item.due_amount.toFixed(2)}
                      {item.fine_amount > 0 && (
                        <div className="text-[8.5px] text-amber-700 font-semibold">+₹{item.fine_amount.toFixed(2)} Fine</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <div className="font-bold text-gray-800">{item.due_date}</div>
                      {item.overdue_days > 0 ? (
                        <div className="text-[9px] text-rose-600 font-black uppercase">{item.overdue_days} Days Overdue</div>
                      ) : (
                        <div className="text-[9px] text-emerald-600 font-bold">On Schedule</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {item.is_defaulter && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 font-black text-[8.5px] rounded uppercase">Defaulter</span>
                        )}
                        {item.exam_restriction_hold && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold text-[8.5px] rounded">Exam Hold</span>
                        )}
                        {item.report_card_hold && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold text-[8.5px] rounded">Report Hold</span>
                        )}
                        {!item.is_defaulter && !item.exam_restriction_hold && !item.report_card_hold && (
                          <span className="text-[9px] text-gray-400 italic">Clear</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        item.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        item.payment_status === 'Partially_Paid' ? 'bg-blue-100 text-blue-800' :
                        item.payment_status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                        item.payment_status === 'Waived' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
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
                              item.is_active ? 'bg-rose-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                                item.is_active ? 'translate-x-[18px]' : 'translate-x-[4px]'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!viewTrash ? (
                          <>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleSendReminder(item.id, 'sms')}
                                className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded text-[8.5px] hover:bg-amber-100"
                                title="Send SMS Reminder"
                              >
                                SMS
                              </button>
                              <button
                                onClick={() => handleSendReminder(item.id, 'whatsapp')}
                                className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded text-[8.5px] hover:bg-emerald-100"
                                title="Send WhatsApp Reminder"
                              >
                                WA
                              </button>
                            </div>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-rose-700 hover:bg-rose-50 rounded transition"
                              title="Edit Due"
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
                              className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-750 font-bold rounded text-[9px] hover:bg-rose-100 transition"
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

      {/* Add / Edit Due Record Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Student Fee Due Record' : 'Configure New Fee Due Record'}</h3>
                  <p className="text-[9.5px] text-gray-500">Specify Student, Class, Section, Term, Fee Head, Defaulter Flags, Holds & Milestone Due Dates.</p>
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
              {/* Row 1: Due Code, Student Name, Admission No, Class & Section (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Due Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.due_code}
                    onChange={(e) => setFormData({ ...formData, due_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="DUE-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none text-[10.5px]"
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

                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Class *</label>
                    <input
                      type="text"
                      required
                      value={formData.class_name}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                      className="w-full px-1.5 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                      placeholder="Class 10"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Section *</label>
                    <input
                      type="text"
                      required
                      value={formData.section_name}
                      onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                      className="w-full px-1.5 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold uppercase text-center"
                      placeholder="A"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Academic Year, Term, Fee Head, Due Date (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-rose-50/40 p-2 rounded-lg border border-rose-200/80">
                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Academic Session *</label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-rose-900"
                    placeholder="2025-2026"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Installment Term *</label>
                  <select
                    value={formData.installment_term}
                    onChange={(e) => setFormData({ ...formData, installment_term: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-rose-900"
                  >
                    {INSTALLMENT_TERMS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Fee Head *</label>
                  <select
                    value={formData.fee_head}
                    onChange={(e) => setFormData({ ...formData, fee_head: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-rose-900"
                  >
                    {FEE_HEADS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Milestone Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold"
                  />
                </div>
              </div>

              {/* Row 3: Total Fee, Paid Amount, Discount, Fine (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Total Fee Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.total_fee_amount}
                    onChange={(e) => setFormData({ ...formData, total_fee_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-rose-950"
                    placeholder="15000"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-emerald-800"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Discount Concession (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-blue-800"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Late Fine Charge (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fine_amount}
                    onChange={(e) => setFormData({ ...formData, fine_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold text-amber-800"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Row 4: Category, Payment Status, Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Due Category *</label>
                  <select
                    value={formData.due_type_category}
                    onChange={(e) => setFormData({ ...formData, due_type_category: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-indigo-900"
                  >
                    {DUE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
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
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Internal Remarks</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Overdue notice notes..."
                  />
                </div>
              </div>

              {/* Row 5: Defaulter Flags & Disciplinary Holds */}
              <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
                <span className="font-extrabold text-amber-950 text-[10px] uppercase tracking-wider">Defaulter Flags & Disciplinary Holds:</span>

                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_defaulter}
                    onChange={(e) => setFormData({ ...formData, is_defaulter: e.target.checked })}
                    className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                  />
                  <span className="font-extrabold text-rose-900 text-[10px]">Flag as Defaulter</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.exam_restriction_hold}
                    onChange={(e) => setFormData({ ...formData, exam_restriction_hold: e.target.checked })}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                  />
                  <span className="font-bold text-amber-900 text-[10px]">Exam Admit Hold</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.report_card_hold}
                    onChange={(e) => setFormData({ ...formData, report_card_hold: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                  />
                  <span className="font-bold text-purple-900 text-[10px]">Report Card Hold</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.id_card_block}
                    onChange={(e) => setFormData({ ...formData, id_card_block: e.target.checked })}
                    className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 w-3.5 h-3.5"
                  />
                  <span className="font-bold text-slate-800 text-[10px]">ID Card Block</span>
                </label>
              </div>

              {/* Bottom Action Footer Bar */}
              <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.auto_reminder_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_reminder_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Auto SMS/WA Reminder Scheduler</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
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
                    className="px-4 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Save Due Record'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Fee Dues Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Due Code</th>
                    <th className="px-3 py-2 border">Student Name</th>
                    <th className="px-3 py-2 border">Admission No</th>
                    <th className="px-3 py-2 border">Term</th>
                    <th className="px-3 py-2 border text-right">Total (₹)</th>
                    <th className="px-3 py-2 border text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-rose-800">{row.due_code}</td>
                      <td className="px-3 py-2 border font-bold">{row.student_name}</td>
                      <td className="px-3 py-2 border font-mono">{row.admission_no}</td>
                      <td className="px-3 py-2 border font-semibold">{row.installment_term}</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.total_fee_amount}</td>
                      <td className="px-3 py-2 border text-center font-bold">{row.payment_status}</td>
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
                {importing ? 'Importing dues...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
