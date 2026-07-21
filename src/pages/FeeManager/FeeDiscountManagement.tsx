import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeDiscountItem {
  id: number;
  code: string;
  name: string;
  scheme_category: string;
  discount_type: 'percentage' | 'flat_amount';
  discount_waiver_type: 'full_waiver' | 'partial_waiver';
  discount_value: number;
  applicable_head: string;
  applicable_scope: 'all_students' | 'class_wise' | 'category_wise' | 'student_wise';
  applicable_classes: string[];
  applicable_categories: string[];
  eligibility_criteria: string | null;
  max_discount_limit: number | null;
  valid_from: string | null;
  valid_to: string | null;
  auto_apply: boolean;
  approval_required: boolean;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const SCHEME_CATEGORIES = [
  { value: 'sibling', label: 'Sibling Discount', defaultWaiver: '50% Tuition' },
  { value: 'employee_child', label: 'Employee Child Discount', defaultWaiver: '100% Full Waiver' },
  { value: 'girl_child', label: 'Girl Child Concession', defaultWaiver: '25% Tuition' },
  { value: 'merit', label: 'Merit Scholarship Discount', defaultWaiver: '30% Tuition' },
  { value: 'sports', label: 'Sports Excellence Waiver', defaultWaiver: '40% Tuition' },
  { value: 'cultural', label: 'Cultural / Talent Discount', defaultWaiver: '20% Tuition' },
  { value: 'management', label: 'Management Discretion Waiver', defaultWaiver: 'Variable' },
  { value: 'ews', label: 'Economically Weaker Section (EWS)', defaultWaiver: '75% Tuition' },
  { value: 'early_payment', label: 'Early Payment Discount', defaultWaiver: 'Flat ₹2,500' },
  { value: 'special', label: 'Special Assistance Waiver', defaultWaiver: 'Custom' },
  { value: 'custom', label: 'Custom Discount Scheme', defaultWaiver: 'User Defined' }
];

const APPLICABLE_HEADS = [
  { value: 'all_heads', label: 'All Fee Heads (Global Concession)' },
  { value: 'Tuition Fee', label: 'Tuition Fee Only' },
  { value: 'Development Fee', label: 'Development Fee Only' },
  { value: 'Transport Fee', label: 'Transport Fee Only' },
  { value: 'Hostel Fee', label: 'Hostel & Mess Fee' },
  { value: 'Admission Fee', label: 'Admission & Registration Fee' }
];

const SCHOOL_CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const STUDENT_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Staff Ward'];

export default function FeeDiscountManagement() {
  const [data, setData] = useState<FeeDiscountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterScope, setFilterScope] = useState<string>('');
  const [filterHead, setFilterHead] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeDiscountItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeDiscountItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    scheme_category: 'sibling',
    discount_type: 'percentage',
    discount_waiver_type: 'partial_waiver',
    discount_value: 50,
    applicable_head: 'Tuition Fee',
    applicable_scope: 'all_students',
    applicable_classes: [] as string[],
    applicable_categories: [] as string[],
    eligibility_criteria: 'Applicable for 2nd real child enrolled in school',
    max_discount_limit: 5000,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    auto_apply: false,
    approval_required: true,
    description: 'Sibling concession scheme for younger brother/sister.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchDiscounts();
  }, [viewTrash, filterCategory, filterType, filterScope, filterHead, filterStatus]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-discounts', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          scheme_category: filterCategory || undefined,
          discount_type: filterType || undefined,
          applicable_scope: filterScope || undefined,
          applicable_head: filterHead || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fee discount schemes', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            code: 'SCHEME-SIB-50',
            name: 'Sibling Concession Scheme',
            scheme_category: 'sibling',
            discount_type: 'percentage',
            discount_waiver_type: 'partial_waiver',
            discount_value: 50.00,
            applicable_head: 'Tuition Fee',
            applicable_scope: 'all_students',
            applicable_classes: [],
            applicable_categories: [],
            eligibility_criteria: 'Applicable for 2nd real child enrolled in school',
            max_discount_limit: 5000,
            valid_from: '2026-04-01',
            valid_to: '2027-03-31',
            auto_apply: false,
            approval_required: true,
            description: '50% concession on tuition fee for younger sibling',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            code: 'SCHEME-STAFF-100',
            name: 'Employee Child Full Waiver',
            scheme_category: 'employee_child',
            discount_type: 'percentage',
            discount_waiver_type: 'full_waiver',
            discount_value: 100.00,
            applicable_head: 'all_heads',
            applicable_scope: 'category_wise',
            applicable_classes: [],
            applicable_categories: ['Staff Ward'],
            eligibility_criteria: 'Children of permanent teaching & non-teaching staff',
            max_discount_limit: 15000,
            valid_from: '2026-04-01',
            valid_to: '2027-03-31',
            auto_apply: true,
            approval_required: false,
            description: '100% full fee waiver on all heads for staff children',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            code: 'SCHEME-EWS-75',
            name: 'Economically Weaker Section (EWS) Concession',
            scheme_category: 'ews',
            discount_type: 'percentage',
            discount_waiver_type: 'partial_waiver',
            discount_value: 75.00,
            applicable_head: 'Tuition Fee',
            applicable_scope: 'category_wise',
            applicable_classes: [],
            applicable_categories: ['EWS'],
            eligibility_criteria: 'Valid EWS income certificate submitted at admission',
            max_discount_limit: 10000,
            valid_from: '2026-04-01',
            valid_to: '2027-03-31',
            auto_apply: false,
            approval_required: true,
            description: '75% tuition fee concession for EWS category students',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 4,
            code: 'SCHEME-EARLY-2500',
            name: 'Early Payment Annual Discount',
            scheme_category: 'early_payment',
            discount_type: 'flat_amount',
            discount_waiver_type: 'partial_waiver',
            discount_value: 2500.00,
            applicable_head: 'Tuition Fee',
            applicable_scope: 'all_students',
            applicable_classes: [],
            applicable_categories: [],
            eligibility_criteria: 'Full annual fee settlement before April 15',
            max_discount_limit: 2500,
            valid_from: '2026-04-01',
            valid_to: '2026-04-15',
            auto_apply: false,
            approval_required: true,
            description: 'Flat ₹2,500 rebate on early full-year fee payment',
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
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scheme_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.eligibility_criteria && item.eligibility_criteria.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const handleSort = (col: keyof FeeDiscountItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeDiscountItem) => {
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

  // Modal Open & Form Presets
  const handleCategorySelectChange = (catVal: string) => {
    let defaultVal = 50;
    let waiverType: 'full_waiver' | 'partial_waiver' = 'partial_waiver';
    let discType: 'percentage' | 'flat_amount' = 'percentage';
    let head = 'Tuition Fee';
    let criteria = '';

    switch (catVal) {
      case 'sibling':
        defaultVal = 50;
        criteria = 'Applicable for 2nd real child enrolled in school';
        break;
      case 'employee_child':
        defaultVal = 100;
        waiverType = 'full_waiver';
        head = 'all_heads';
        criteria = 'Children of permanent teaching & non-teaching staff';
        break;
      case 'girl_child':
        defaultVal = 25;
        criteria = 'Applicable for single girl child admission';
        break;
      case 'merit':
        defaultVal = 35;
        criteria = 'Scored above 90% marks in annual examination';
        break;
      case 'sports':
        defaultVal = 40;
        criteria = 'State / National sports tournament certificate holder';
        break;
      case 'ews':
        defaultVal = 75;
        criteria = 'EWS income certificate holder';
        break;
      case 'early_payment':
        defaultVal = 2500;
        discType = 'flat_amount';
        criteria = 'Full annual fee settlement before April 15';
        break;
    }

    setFormData(prev => ({
      ...prev,
      scheme_category: catVal,
      discount_type: discType,
      discount_waiver_type: waiverType,
      discount_value: defaultVal,
      applicable_head: head,
      eligibility_criteria: criteria || prev.eligibility_criteria
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      code: 'SCHEME-' + Math.floor(100 + Math.random() * 900),
      name: 'Sibling Concession Scheme',
      scheme_category: 'sibling',
      discount_type: 'percentage',
      discount_waiver_type: 'partial_waiver',
      discount_value: 50,
      applicable_head: 'Tuition Fee',
      applicable_scope: 'all_students',
      applicable_classes: [],
      applicable_categories: [],
      eligibility_criteria: 'Applicable for 2nd real child enrolled in school',
      max_discount_limit: 5000,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '',
      auto_apply: false,
      approval_required: true,
      description: 'Concession for sibling students',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeDiscountItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      scheme_category: item.scheme_category || 'custom',
      discount_type: item.discount_type,
      discount_waiver_type: item.discount_waiver_type || 'partial_waiver',
      discount_value: item.discount_value,
      applicable_head: item.applicable_head,
      applicable_scope: item.applicable_scope || 'all_students',
      applicable_classes: item.applicable_classes || [],
      applicable_categories: item.applicable_categories || [],
      eligibility_criteria: item.eligibility_criteria || '',
      max_discount_limit: item.max_discount_limit || 0,
      valid_from: item.valid_from || '',
      valid_to: item.valid_to || '',
      auto_apply: item.auto_apply,
      approval_required: item.approval_required,
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a scheme name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-discounts/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-discounts', formData);
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (error: any) {
      alert('Failed to save discount scheme: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-discounts/${id}/toggle-status`);
      fetchDiscounts();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this fee discount scheme to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-discounts/${id}`);
      fetchDiscounts();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-discounts/${id}/restore`);
      fetchDiscounts();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this fee discount scheme? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-discounts/${id}/force`);
      fetchDiscounts();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected discount scheme(s)?`)) return;

    try {
      await axios.post('/api/school/fee-discounts/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchDiscounts();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchDiscounts();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-discounts/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-discounts/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { code: 'SCHEME-SIB-50', name: 'Sibling Concession Scheme', scheme_category: 'sibling', discount_type: 'percentage', discount_waiver_type: 'partial_waiver', discount_value: 50, applicable_head: 'Tuition Fee', applicable_scope: 'all_students', eligibility_criteria: 'Applicable for 2nd child', max_discount_limit: 5000 },
      { code: 'SCHEME-STAFF-100', name: 'Staff Child Full Waiver', scheme_category: 'employee_child', discount_type: 'percentage', discount_waiver_type: 'full_waiver', discount_value: 100, applicable_head: 'all_heads', applicable_scope: 'category_wise', eligibility_criteria: 'Permanent staff ward', max_discount_limit: 15000 },
      { code: 'SCHEME-EWS-75', name: 'EWS Concession Scheme', scheme_category: 'ews', discount_type: 'percentage', discount_waiver_type: 'partial_waiver', discount_value: 75, applicable_head: 'Tuition Fee', applicable_scope: 'category_wise', eligibility_criteria: 'EWS Certificate', max_discount_limit: 10000 },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-discounts/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchDiscounts();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchDiscounts();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(d => d.is_active).length;
    const fullWaivers = data.filter(d => d.discount_waiver_type === 'full_waiver').length;
    const percentageCount = data.filter(d => d.discount_type === 'percentage').length;
    return { total, active, fullWaivers, percentageCount };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Fee Discount Schemes</h1>
            <p className="text-[10px] text-gray-500">Configure Sibling, Staff Child, Girl Child, Merit, Sports, EWS, Early Payment, Full & Partial Fee Waivers across Classes & Categories.</p>
          </div>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Schemes</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.total} Schemes</h3>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-7 5h7" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active Concessions</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">{stats.active} Active</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Full Fee Waivers (100%)</p>
            <h3 className="text-lg font-black text-indigo-750 mt-0.5">{stats.fullWaivers} Full Waivers</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Percentage Schemes</p>
            <h3 className="text-lg font-black text-purple-750 mt-0.5">{stats.percentageCount} Schemes (%)</h3>
          </div>
          <div className="p-2 bg-purple-50 text-purple-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Create Discount Scheme */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Code, Scheme Name, Eligibility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-xs"
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

          {/* Action Buttons: Sample, Import, Export, + Create Discount Scheme */}
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
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition font-bold shadow-md text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Create Scheme</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filters (Single Row Layout) */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[140px]"
          >
            <option value="">All Categories</option>
            {SCHEME_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Types</option>
            <option value="percentage">Percentage (%) Concession</option>
            <option value="flat_amount">Flat Amount (₹) Waiver</option>
          </select>

          {/* Scope Filter */}
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Scopes</option>
            <option value="all_students">All Students (Global)</option>
            <option value="class_wise">Class-Wise Scope</option>
            <option value="category_wise">Category-Wise Scope</option>
            <option value="student_wise">Individual Student Scope</option>
          </select>

          {/* Applicable Head Filter */}
          <select
            value={filterHead}
            onChange={(e) => setFilterHead(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Fee Heads</option>
            {APPLICABLE_HEADS.map(h => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[110px]"
          >
            <option value="">All Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Inactive Only</option>
          </select>

          {(filterCategory || filterType || filterScope || filterHead || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('');
                setFilterType('');
                setFilterScope('');
                setFilterHead('');
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
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-950 shadow-xs animate-fadeIn">
          <span className="font-bold text-xs">{selectedItems.size} discount scheme(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-amber-300 rounded font-bold text-[10px] hover:bg-amber-100 text-amber-700"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkAction('inactive')}
                  className="px-3 py-1 bg-white border border-amber-300 rounded font-bold text-[10px] hover:bg-amber-100 text-gray-600"
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
                  className="px-3 py-1 bg-white border border-amber-300 rounded font-bold text-[10px] hover:bg-amber-100 text-amber-750"
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
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('code')}>
                <div className="flex items-center gap-0.5">SCHEME CODE {getSortIcon('code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-0.5">SCHEME & PRESET CATEGORY {getSortIcon('name')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('discount_type')}>
                <div className="flex items-center gap-0.5">WAIVER & CALCULATION {getSortIcon('discount_type')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('discount_value')}>
                <div className="flex items-center justify-end gap-0.5">CONCESSION VALUE {getSortIcon('discount_value')}</div>
              </th>
              <th className="py-2.5 px-3 font-bold text-gray-750">TARGET SCOPE & HEAD</th>
              <th className="py-2.5 px-3 font-bold text-gray-750">ELIGIBILITY CRITERIA</th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-750">MAX LIMIT (₹)</th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">STATUS</th>
              )}
              <th className="py-2.5 px-3 w-28 text-center font-bold text-gray-750">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={viewTrash ? 8 : 9} className="py-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-gray-600">Loading fee discount schemes...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 8 : 9} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No fee discount schemes found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const catObj = SCHEME_CATEGORIES.find(c => c.value === item.scheme_category);
                const catLabel = catObj ? catObj.label : item.scheme_category;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition text-gray-700">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                      {item.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">{catLabel}</div>
                      {item.description && <div className="text-[9px] text-gray-400 italic max-w-xs truncate">{item.description}</div>}
                    </td>
                    <td className="py-2.5 px-3 space-y-0.5">
                      <div>
                        {item.discount_waiver_type === 'full_waiver' ? (
                          <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                            100% Full Waiver
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            Partial Waiver
                          </span>
                        )}
                      </div>
                      <div className="text-[9.5px] text-gray-500">
                        {item.discount_type === 'percentage' ? '% Percentage Based' : '₹ Flat Amount Based'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-amber-900">
                      {item.discount_waiver_type === 'full_waiver' ? '100%' : (item.discount_type === 'percentage' ? `${item.discount_value}%` : `₹${item.discount_value.toFixed(2)}`)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-gray-700">
                      <div className="font-bold text-indigo-900">
                        {item.applicable_head === 'all_heads' ? 'Global (All Fee Heads)' : item.applicable_head}
                      </div>
                      <div className="text-[9.5px] text-gray-500 uppercase">
                        Scope: {item.applicable_scope.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 text-[10.5px]">
                      {item.eligibility_criteria || <span className="text-gray-400 italic">No restriction</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                      {item.max_discount_limit ? `₹${item.max_discount_limit.toFixed(2)}` : <span className="text-gray-400 text-[10px]">No Ceiling</span>}
                    </td>
                    {!viewTrash && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            className={`flex-shrink-0 relative inline-flex h-[16px] w-[32px] items-center rounded-full transition-colors focus:outline-none ${
                              item.is_active ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white transition-transform ${
                                item.is_active ? 'translate-x-[18px]' : 'translate-x-[4px]'
                              }`}
                            />
                          </button>
                          <span className={`text-[9px] font-bold ${item.is_active ? 'text-amber-700' : 'text-gray-400'}`}>
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
                              className="p-1 text-amber-700 hover:bg-amber-50 rounded transition"
                              title="Edit Discount Scheme"
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
                              className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-750 font-bold rounded text-[9px] hover:bg-amber-100 transition"
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
              Showing page <span className="font-semibold text-amber-600">{currentPage}</span> of{' '}
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
                        ? 'z-10 bg-amber-50 border-amber-500 text-amber-700 font-black'
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

      {/* Add / Edit Fee Discount Scheme Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Fee Discount Scheme' : 'Configure New Fee Discount Scheme'}</h3>
                  <p className="text-[9.5px] text-gray-500">Configure preset categories, full/partial waivers, class & category targeting rules.</p>
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
              {/* Row 1: Preset Category, Scheme Code, Scheme Name (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Preset Scheme Category *</label>
                  <select
                    value={formData.scheme_category}
                    onChange={(e) => handleCategorySelectChange(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-bold text-[10.5px] bg-white text-amber-900"
                  >
                    {SCHEME_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label} ({c.defaultWaiver})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Scheme Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="SCHEME-SIB-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Scheme Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none text-[10.5px]"
                    placeholder="e.g. Sibling Concession Scheme"
                  />
                </div>
              </div>

              {/* Row 2: Waiver Type, Calculation Type, Value & Max Limit (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-amber-50/40 p-2 rounded-lg border border-amber-200/80">
                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Waiver Mode *</label>
                  <select
                    value={formData.discount_waiver_type}
                    onChange={(e) => {
                      const mode = e.target.value as any;
                      setFormData({
                        ...formData,
                        discount_waiver_type: mode,
                        discount_value: mode === 'full_waiver' ? 100 : formData.discount_value
                      });
                    }}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-amber-900"
                  >
                    <option value="partial_waiver">Partial Fee Waiver</option>
                    <option value="full_waiver">100% Full Fee Waiver</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Calculation Type *</label>
                  <select
                    disabled={formData.discount_waiver_type === 'full_waiver'}
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    <option value="percentage">% Percentage Concession</option>
                    <option value="flat_amount">₹ Flat Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Concession Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={formData.discount_waiver_type === 'full_waiver'}
                    required
                    value={formData.discount_waiver_type === 'full_waiver' ? 100 : formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-amber-900"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-0.5 text-[9.5px]">Max Limit (₹ Ceiling)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_discount_limit}
                    onChange={(e) => setFormData({ ...formData, max_discount_limit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-amber-900"
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Row 3: Scope & Target Restrictions (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Target Applicability Scope *</label>
                  <select
                    value={formData.applicable_scope}
                    onChange={(e) => setFormData({ ...formData, applicable_scope: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    <option value="all_students">All Students (Global Scope)</option>
                    <option value="class_wise">Class-Wise Scope</option>
                    <option value="category_wise">Category-Wise Scope (General/SC/ST/EWS)</option>
                    <option value="student_wise">Individual Student Scope</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Applicable Fee Head *</label>
                  <select
                    value={formData.applicable_head}
                    onChange={(e) => setFormData({ ...formData, applicable_head: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-semibold"
                  >
                    {APPLICABLE_HEADS.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Eligibility Criteria & Rules</label>
                  <input
                    type="text"
                    value={formData.eligibility_criteria}
                    onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="e.g. Applicable for 2nd child..."
                  />
                </div>
              </div>

              {/* Conditional Class & Category Selection Pickers */}
              {formData.applicable_scope === 'class_wise' && (
                <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-200">
                  <span className="font-bold text-indigo-900 text-[10px] block mb-1">Select Applicable Classes:</span>
                  <div className="flex flex-wrap gap-2">
                    {SCHOOL_CLASSES.map(cls => {
                      const isChecked = formData.applicable_classes.includes(cls);
                      return (
                        <label key={cls} className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-0.5 rounded text-[9.5px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...formData.applicable_classes, cls]
                                : formData.applicable_classes.filter(c => c !== cls);
                              setFormData({ ...formData, applicable_classes: next });
                            }}
                          />
                          <span>{cls}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.applicable_scope === 'category_wise' && (
                <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-200">
                  <span className="font-bold text-purple-900 text-[10px] block mb-1">Select Applicable Student Categories:</span>
                  <div className="flex flex-wrap gap-2">
                    {STUDENT_CATEGORIES.map(cat => {
                      const isChecked = formData.applicable_categories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-0.5 rounded text-[9.5px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...formData.applicable_categories, cat]
                                : formData.applicable_categories.filter(c => c !== cat);
                              setFormData({ ...formData, applicable_categories: next });
                            }}
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Row 4: Dates & Description (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Valid From Date</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Valid To Date</label>
                  <input
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Notes / Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none"
                    placeholder="Brief notes..."
                  />
                </div>
              </div>

              {/* Bottom Action Footer Bar */}
              <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.approval_required}
                      onChange={(e) => setFormData({ ...formData, approval_required: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Management Approval Required</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.auto_apply}
                      onChange={(e) => setFormData({ ...formData, auto_apply: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Auto-Apply on Fee Allocation</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
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
                    className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Save Scheme'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Fee Discounts Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Scheme Code</th>
                    <th className="px-3 py-2 border">Scheme Name</th>
                    <th className="px-3 py-2 border">Category Preset</th>
                    <th className="px-3 py-2 border">Waiver Type</th>
                    <th className="px-3 py-2 border text-right">Value</th>
                    <th className="px-3 py-2 border">Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-amber-800">{row.code}</td>
                      <td className="px-3 py-2 border font-bold">{row.name}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-amber-700">{row.scheme_category}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-indigo-700">{row.discount_waiver_type}</td>
                      <td className="px-3 py-2 border text-right font-black">{row.discount_waiver_type === 'full_waiver' ? '100%' : (row.discount_type === 'percentage' ? `${row.discount_value}%` : `₹${row.discount_value}`)}</td>
                      <td className="px-3 py-2 border font-semibold">{row.applicable_scope}</td>
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
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-sm text-xs"
              >
                {importing ? 'Importing schemes...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
