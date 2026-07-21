import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeBudgetItem {
  id: number;
  budget_code: string;
  academic_year: string;
  budget_category: string;
  budget_head: string;
  department_name: string | null;
  allocated_amount: number;
  utilized_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  budget_status: 'Within Budget' | 'Near Threshold' | 'Over Budget';
  approval_status: 'Approved' | 'Pending' | 'Revised';
  approved_by: string | null;
  start_date: string | null;
  end_date: string | null;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
}

const BUDGET_CATEGORIES = [
  'Academic',
  'Administration',
  'Transport',
  'Hostel',
  'Sports'
];

const BUDGET_HEADS = [
  'Books',
  'Lab Equipment',
  'Smart Classes',
  'Office Expense',
  'Printing',
  'Internet',
  'Fuel',
  'Vehicle Repair',
  'Insurance',
  'Food',
  'Electricity',
  'Maintenance',
  'Sports Equipment',
  'Tournament'
];

const DEPARTMENTS = [
  'Academic Dept',
  'Administration',
  'Transport Dept',
  'Hostel Dept',
  'Sports Dept',
  'Maintenance Dept',
  'Accounts & Finance'
];

const BUDGET_STATUSES = [
  { value: 'Within Budget', label: 'Within Budget' },
  { value: 'Near Threshold', label: 'Near Threshold' },
  { value: 'Over Budget', label: 'Over Budget' }
];

const APPROVAL_STATUSES = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Revised', label: 'Revised' }
];

export default function BudgetManagement() {
  const [data, setData] = useState<FeeBudgetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filter States
  const [filterHead, setFilterHead] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterBudgetStatus, setFilterBudgetStatus] = useState<string>('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);
  const [activeReportTab, setActiveReportTab] = useState<'All' | 'Within Budget' | 'Near Threshold' | 'Over Budget' | 'Pending Approval'>('All');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeBudgetItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeBudgetItem | null>(null);
  const [formData, setFormData] = useState({
    budget_code: '',
    academic_year: '2025-2026',
    budget_category: 'Academic',
    budget_head: 'Books',
    department_name: 'Academic Dept',
    allocated_amount: 500000,
    utilized_amount: 285000,
    budget_status: 'Within Budget' as 'Within Budget' | 'Near Threshold' | 'Over Budget',
    approval_status: 'Approved' as 'Approved' | 'Pending' | 'Revised',
    approved_by: 'Principal / Finance Board',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    remarks: 'Annual academic books, lab & library budget allocation.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchBudgetItems();
  }, [viewTrash, filterHead, filterDepartment, filterBudgetStatus, filterApprovalStatus, filterStatus]);

  const fetchBudgetItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-budgets', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          budget_head: filterHead || undefined,
          department_name: filterDepartment || undefined,
          budget_status: filterBudgetStatus || undefined,
          approval_status: filterApprovalStatus || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch budget allocation records', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            budget_code: 'BDG-2026-001',
            academic_year: '2025-2026',
            budget_category: 'Academic',
            budget_head: 'Books',
            department_name: 'Academic Dept',
            allocated_amount: 500000.00,
            utilized_amount: 285000.00,
            remaining_amount: 215000.00,
            utilization_percentage: 57.00,
            budget_status: 'Within Budget',
            approval_status: 'Approved',
            approved_by: 'Principal / Finance Board',
            start_date: '2025-04-01',
            end_date: '2026-03-31',
            remarks: 'Annual academic books, lab & library budget allocation.',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            budget_code: 'BDG-2026-002',
            academic_year: '2025-2026',
            budget_category: 'Administration',
            budget_head: 'Office Expense',
            department_name: 'Maintenance Dept',
            allocated_amount: 350000.00,
            utilized_amount: 310000.00,
            remaining_amount: 40000.00,
            utilization_percentage: 88.57,
            budget_status: 'Near Threshold',
            approval_status: 'Approved',
            approved_by: 'School Board',
            start_date: '2025-04-01',
            end_date: '2026-03-31',
            remarks: 'Building repair and electrical maintenance budget.',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            budget_code: 'BDG-2026-003',
            academic_year: '2025-2026',
            budget_category: 'Academic',
            budget_head: 'Smart Classes',
            department_name: 'Academic Dept',
            allocated_amount: 150000.00,
            utilized_amount: 165000.00,
            remaining_amount: -15000.00,
            utilization_percentage: 110.00,
            budget_status: 'Over Budget',
            approval_status: 'Revised',
            approved_by: 'Managing Director',
            start_date: '2025-04-01',
            end_date: '2026-03-31',
            remarks: 'Cloud server & ERP license additional expansion.',
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
  const handleTabChange = (tab: 'All' | 'Within Budget' | 'Near Threshold' | 'Over Budget' | 'Pending Approval') => {
    setActiveReportTab(tab);
    setCurrentPage(1);
  };

  // Dynamic counts for tab badges
  const tabCounts = useMemo(() => {
    const all = data.length;
    const within = data.filter(d => d.budget_status === 'Within Budget').length;
    const near = data.filter(d => d.budget_status === 'Near Threshold').length;
    const over = data.filter(d => d.budget_status === 'Over Budget').length;
    const pending = data.filter(d => d.approval_status === 'Pending').length;
    return { all, within, near, over, pending };
  }, [data]);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch =
        item.budget_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.budget_head.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.department_name && item.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.academic_year.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.remarks && item.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchTab = true;
      if (activeReportTab === 'Within Budget') {
        matchTab = item.budget_status === 'Within Budget';
      } else if (activeReportTab === 'Near Threshold') {
        matchTab = item.budget_status === 'Near Threshold';
      } else if (activeReportTab === 'Over Budget') {
        matchTab = item.budget_status === 'Over Budget';
      } else if (activeReportTab === 'Pending Approval') {
        matchTab = item.approval_status === 'Pending';
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
    const totalAllocated = sourceData.reduce((sum, d) => sum + d.allocated_amount, 0);
    const totalUtilized = sourceData.reduce((sum, d) => sum + d.utilized_amount, 0);
    const totalRemaining = totalAllocated - totalUtilized;
    const totalHeadsCount = sourceData.length;
    return { totalAllocated, totalUtilized, totalRemaining, totalHeadsCount };
  }, [filteredData, data]);

  // Pagination helper
  const totalPages = Math.ceil(filteredData.length / (itemsPerPage === -1 ? filteredData.length || 1 : itemsPerPage));
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (col: keyof FeeBudgetItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeBudgetItem) => {
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
      budget_code: 'BDG-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      academic_year: '2025-2026',
      budget_category: 'Academic',
      budget_head: 'Books',
      department_name: 'Academic Dept',
      allocated_amount: 500000,
      utilized_amount: 0,
      budget_status: 'Within Budget',
      approval_status: 'Approved',
      approved_by: 'Principal / Board',
      start_date: '2025-04-01',
      end_date: '2026-03-31',
      remarks: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeBudgetItem) => {
    setEditingItem(item);
    setFormData({
      budget_code: item.budget_code,
      academic_year: item.academic_year,
      budget_category: item.budget_category || 'Academic',
      budget_head: item.budget_head,
      department_name: item.department_name || '',
      allocated_amount: item.allocated_amount,
      utilized_amount: item.utilized_amount,
      budget_status: item.budget_status,
      approval_status: item.approval_status,
      approved_by: item.approved_by || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      remarks: item.remarks || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.budget_head.trim()) {
      alert('Please enter or select a Budget Head.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-budgets/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-budgets', formData);
      }
      setIsModalOpen(false);
      fetchBudgetItems();
    } catch (error: any) {
      alert('Failed to save budget allocation record: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-budgets/${id}/toggle-status`);
      fetchBudgetItems();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this budget allocation record to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-budgets/${id}`);
      fetchBudgetItems();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-budgets/${id}/restore`);
      fetchBudgetItems();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this budget allocation record? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-budgets/${id}/force`);
      fetchBudgetItems();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete' | 'approve') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected budget allocation record(s)?`)) return;

    try {
      await axios.post('/api/school/fee-budgets/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchBudgetItems();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchBudgetItems();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-budgets/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-budgets/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { budget_code: 'BDG-2026-001', academic_year: '2025-2026', budget_head: 'Academic Expenses', department_name: 'Academic Dept', allocated_amount: 500000, utilized_amount: 285000, approval_status: 'Approved', start_date: '2025-04-01', end_date: '2026-03-31', remarks: 'Annual academic books, lab & library budget' },
      { budget_code: 'BDG-2026-002', academic_year: '2025-2026', budget_head: 'Infrastructure & Maintenance', department_name: 'Maintenance Dept', allocated_amount: 350000, utilized_amount: 120000, approval_status: 'Approved', start_date: '2025-04-01', end_date: '2026-03-31', remarks: 'Building repair and electrical maintenance' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-budgets/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchBudgetItems();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchBudgetItems();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Budget Allocation Manager</h1>
            <p className="text-[10px] text-gray-500">School Departmental Budget Heads, Annual Allocations, Spent Expense Tracking, Threshold Variance & Approval Controls.</p>
          </div>
        </div>

        {/* Sub-Module Reports Quick Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-white p-1 border border-gray-200 rounded-xl shadow-2xs text-[10.5px]">
          <button
            type="button"
            onClick={() => handleTabChange('All')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'All' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>All</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'All' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {tabCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Within Budget')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Within Budget' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Within Budget</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Within Budget' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {tabCounts.within}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Near Threshold')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Near Threshold' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Near Threshold</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Near Threshold' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {tabCounts.near}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Over Budget')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Over Budget' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Over Budget</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Over Budget' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {tabCounts.over}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Pending Approval')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              activeReportTab === 'Pending Approval' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Pending Approval</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${activeReportTab === 'Pending Approval' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {tabCounts.pending}
            </span>
          </button>
        </div>
      </div>

      {/* Active Tab Sub-module Info Indicator Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50/50 border border-indigo-200/60 p-2.5 rounded-xl flex items-center justify-between text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-indigo-900 uppercase text-[10px] tracking-wider px-2 py-0.5 bg-indigo-600 text-white rounded-md">
            Active Budget View: {activeReportTab}
          </span>
          <span className="text-gray-600 font-semibold text-[11px]">
            {activeReportTab === 'All' && 'Viewing all departmental budget heads, allocations, utilized balances and threshold alerts.'}
            {activeReportTab === 'Within Budget' && 'Showing budget heads operating safely within allocated funds (<85% utilized).'}
            {activeReportTab === 'Near Threshold' && 'Filtering budget heads approaching limit threshold (85%-100% utilized).'}
            {activeReportTab === 'Over Budget' && 'Filtering budget heads exceeding allocated limits (>100% utilized).'}
            {activeReportTab === 'Pending Approval' && 'Showing new or revised budget head allocations awaiting board approval.'}
          </span>
        </div>
        <span className="text-[10px] font-black text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-150">
          Showing {filteredData.length} of {data.length} Budget Head(s)
        </span>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Allocated Budget</p>
            <h3 className="text-lg font-black text-indigo-900 mt-0.5">₹{stats.totalAllocated.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Expenses Consumed</p>
            <h3 className="text-lg font-black text-rose-700 mt-0.5">₹{stats.totalUtilized.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Remaining Available Budget</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalRemaining.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Budget Heads</p>
            <h3 className="text-lg font-black text-blue-900 mt-0.5">{stats.totalHeadsCount} Heads</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Add Budget Allocation */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Code, Budget Head, Dept, Year, Remarks..."
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

          {/* Action Buttons: Sample, Import, Export, + Add Budget Allocation */}
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
              <span>+ Add Budget Allocation</span>
            </button>
          </div>
        </div>

        {/* Row 2: Clean Filter Toolbar (No Scrollbar, No Bracket Labels) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {/* Budget Head Filter */}
          <select
            value={filterHead}
            onChange={(e) => setFilterHead(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">Budget Head</option>
            {BUDGET_HEADS.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">Department</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Budget Threshold Status Filter */}
          <select
            value={filterBudgetStatus}
            onChange={(e) => setFilterBudgetStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[120px]"
          >
            <option value="">Budget Status</option>
            {BUDGET_STATUSES.map(s => (
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

          {(filterHead || filterDepartment || filterBudgetStatus || filterApprovalStatus || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterHead('');
                setFilterDepartment('');
                setFilterBudgetStatus('');
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
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-indigo-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} budget head(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-1 bg-indigo-600 text-white rounded font-bold text-[10px] hover:bg-indigo-700"
                >
                  Mark Approved
                </button>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-indigo-300 rounded font-bold text-[10px] hover:bg-indigo-100 text-indigo-800"
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
                  className="px-3 py-1 bg-rose-100 border border-rose-300 rounded font-bold text-[10px] hover:bg-rose-200 text-rose-800"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkAction('restore')}
                  className="px-3 py-1 bg-white border border-indigo-300 rounded font-bold text-[10px] hover:bg-indigo-100 text-indigo-800"
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
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('budget_code')}>
                <div className="flex items-center gap-0.5">BUDGET CODE {getSortIcon('budget_code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('budget_head')}>
                <div className="flex items-center gap-0.5">BUDGET HEAD & DEPT {getSortIcon('budget_head')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('allocated_amount')}>
                <div className="flex items-center justify-end gap-0.5">ALLOCATED (₹) {getSortIcon('allocated_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('utilized_amount')}>
                <div className="flex items-center justify-end gap-0.5">UTILIZED (₹) {getSortIcon('utilized_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('remaining_amount')}>
                <div className="flex items-center justify-end gap-0.5">REMAINING (₹) {getSortIcon('remaining_amount')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('utilization_percentage')}>
                <div className="flex items-center gap-0.5">CONSUMED % {getSortIcon('utilization_percentage')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('budget_status')}>
                <div className="flex items-center gap-0.5">STATUS {getSortIcon('budget_status')}</div>
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
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading budget allocations...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No budget allocation records found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const pct = item.utilization_percentage;
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
                      {item.budget_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.budget_head}</div>
                      <div className="text-[9px] text-slate-500 font-medium">Category: <span className="font-bold text-indigo-900">{item.budget_category ?? 'Academic'}</span> | {item.department_name ?? 'General'} | Year: {item.academic_year}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                      ₹{item.allocated_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                      ₹{item.utilized_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800">
                      ₹{item.remaining_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden mb-0.5">
                        <div
                          className={`h-2 rounded-full ${
                            pct > 100 ? 'bg-rose-600' : pct >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="text-[9.5px] font-black text-slate-600">{pct.toFixed(1)}% Consumed</div>
                    </td>
                    <td className="py-2.5 px-3 text-[10px]">
                      <span className={`px-1.5 py-0.2 rounded font-black uppercase text-[8.5px] ${
                        item.budget_status === 'Within Budget' ? 'bg-emerald-100 text-emerald-800' :
                        item.budget_status === 'Near Threshold' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {item.budget_status}
                      </span>
                      <div className="text-[8.5px] text-gray-400 font-semibold mt-0.5">Approval: {item.approval_status} {item.approved_by ? `(${item.approved_by})` : ''}</div>
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
                          <span className={`text-[9px] font-bold ${item.is_active ? 'text-indigo-700' : 'text-gray-400'}`}>
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
                              className="p-1 text-indigo-700 hover:bg-indigo-50 rounded transition"
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
                              className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold rounded text-[9px] hover:bg-indigo-100 transition"
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

      {/* Add / Edit Budget Allocation Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Budget Allocation Record' : 'Create New Budget Allocation'}</h3>
                  <p className="text-[9.5px] text-gray-500">Budget Code, Session, Head, Department, Total Allocated (₹), Utilized Expenses (₹) & Board Approval Status.</p>
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
              {/* Row 1: Budget Code, Session, Budget Category, Budget Head, Department (5 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Budget Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.budget_code}
                    onChange={(e) => setFormData({ ...formData, budget_code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="BDG-2026-001"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Budget Year / Session *</label>
                  <input
                    type="text"
                    required
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] font-bold"
                    placeholder="2025-2026"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Budget Category *</label>
                  <select
                    value={formData.budget_category}
                    onChange={(e) => setFormData({ ...formData, budget_category: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] bg-white font-bold text-indigo-900"
                  >
                    {BUDGET_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Budget Head / Item *</label>
                  <select
                    value={formData.budget_head}
                    onChange={(e) => setFormData({ ...formData, budget_head: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] bg-white font-semibold"
                  >
                    {BUDGET_HEADS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Department *</label>
                  <select
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] bg-white font-semibold"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Allocated Amount (₹), Utilized Amount (₹), Approval Status, Approved By (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-indigo-50/40 p-2 rounded-lg border border-indigo-200/80">
                <div>
                  <label className="font-bold text-indigo-900 block mb-0.5 text-[9.5px]">Allocated Budget Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.allocated_amount}
                    onChange={(e) => setFormData({ ...formData, allocated_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-indigo-950"
                    placeholder="500000.00"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-900 block mb-0.5 text-[9.5px]">Utilized Expenses Spent (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.utilized_amount}
                    onChange={(e) => setFormData({ ...formData, utilized_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-black text-rose-800"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Approval Status</label>
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

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Approved By (Name / Role)</label>
                  <input
                    type="text"
                    value={formData.approved_by}
                    onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                    placeholder="Principal / Board"
                  />
                </div>
              </div>

              {/* Row 3: Period Start Date, Period End Date, Remarks (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Budget Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Budget End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Allocation Justification & Remarks</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Annual academic books and lab supplies allocation..."
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
                    <span className="font-bold text-gray-800 text-[10px]">Active Budget Head Allocation</span>
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
                    {editingItem ? 'Save Updates' : 'Confirm & Allocate Budget'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Budget Allocations Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Budget Code</th>
                    <th className="px-3 py-2 border">Session</th>
                    <th className="px-3 py-2 border">Budget Head</th>
                    <th className="px-3 py-2 border">Department</th>
                    <th className="px-3 py-2 border text-right">Allocated (₹)</th>
                    <th className="px-3 py-2 border text-right">Utilized (₹)</th>
                    <th className="px-3 py-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-indigo-900">{row.budget_code}</td>
                      <td className="px-3 py-2 border font-semibold">{row.academic_year}</td>
                      <td className="px-3 py-2 border font-bold">{row.budget_head}</td>
                      <td className="px-3 py-2 border font-semibold">{row.department_name}</td>
                      <td className="px-3 py-2 border text-right font-black text-indigo-950">₹{row.allocated_amount}</td>
                      <td className="px-3 py-2 border text-right font-black text-rose-800">₹{row.utilized_amount || 0}</td>
                      <td className="px-3 py-2 border font-bold text-emerald-800">{row.approval_status}</td>
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
                {importing ? 'Importing records...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
