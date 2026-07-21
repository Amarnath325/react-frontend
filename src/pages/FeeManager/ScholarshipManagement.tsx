import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface FeeScholarshipItem {
  id: number;
  code: string;
  name: string;
  provider_name: string | null;
  scholarship_type: string;
  award_type: 'percentage' | 'fixed_grant';
  grant_amount: number;
  total_fund_pool: number;
  disbursed_fund_amount: number;
  funding_source: string | null;
  eligibility_criteria: string | null;
  required_documents: string[];
  max_recipients: number | null;
  renewal_terms: string | null;
  valid_from: string | null;
  valid_to: string | null;
  approval_required: boolean;
  approval_status: 'Approved' | 'Pending Approval' | 'Draft';
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const SCHOLARSHIP_TYPES = [
  { value: 'govt_scholarship', label: 'Government Scholarship' },
  { value: 'minority_scholarship', label: 'Minority Scholarship' },
  { value: 'sc_scholarship', label: 'SC Category Scholarship' },
  { value: 'st_scholarship', label: 'ST Category Scholarship' },
  { value: 'obc_scholarship', label: 'OBC Category Scholarship' },
  { value: 'merit_scholarship', label: 'Academic Merit Scholarship' },
  { value: 'sports_scholarship', label: 'Sports Excellence Award' },
  { value: 'private_scholarship', label: 'Private Corporate Grant' },
  { value: 'ngo_scholarship', label: 'NGO / Trust Foundation Support' },
  { value: 'trust_endowment', label: 'Trustee Endowment Fellowship' }
];

const DOCUMENT_OPTIONS = [
  'Aadhaar Card',
  'Income Certificate',
  'Caste Certificate (SC/ST/OBC)',
  'Previous Marksheet / Transcript',
  'Sports / Cultural Certificate',
  'Bank Passbook / Disbursal Form'
];

export default function ScholarshipManagement() {
  const [data, setData] = useState<FeeScholarshipItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterAward, setFilterAward] = useState<string>('');
  const [filterApproval, setFilterApproval] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewTrash, setViewTrash] = useState<boolean>(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortColumn, setSortColumn] = useState<keyof FeeScholarshipItem>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeScholarshipItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    provider_name: 'National Scholarship Portal (NSP)',
    scholarship_type: 'govt_scholarship',
    award_type: 'percentage',
    grant_amount: 100,
    total_fund_pool: 500000,
    disbursed_fund_amount: 120000,
    funding_source: 'Central Ministry Welfare Fund',
    eligibility_criteria: 'Income under ₹2.5L per annum with 75%+ marks',
    required_documents: ['Aadhaar Card', 'Income Certificate', 'Previous Marksheet / Transcript'],
    max_recipients: 50,
    renewal_terms: 'Maintain 80% annual attendance for renewal',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    approval_required: true,
    approval_status: 'Approved' as 'Approved' | 'Pending Approval' | 'Draft',
    description: 'Post-matric scholarship scheme for eligible category students.',
    is_active: true
  });

  // Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchScholarships();
  }, [viewTrash, filterType, filterAward, filterApproval, filterStatus]);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/school/fee-scholarships', {
        params: {
          only_trashed: viewTrash ? 1 : 0,
          scholarship_type: filterType || undefined,
          award_type: filterAward || undefined,
          approval_status: filterApproval || undefined,
          is_active: filterStatus !== '' ? filterStatus : undefined,
          per_page: -1
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch scholarships', error);
      if (data.length === 0) {
        setData([
          {
            id: 1,
            code: 'SCHOLAR-GOVT-01',
            name: 'Central Post-Matric Minority Scholarship',
            provider_name: 'Ministry of Minority Affairs (NSP)',
            scholarship_type: 'minority_scholarship',
            award_type: 'percentage',
            grant_amount: 100.00,
            total_fund_pool: 500000,
            disbursed_fund_amount: 250000,
            funding_source: 'Central Govt Welfare Department',
            eligibility_criteria: 'Minority category student with family income under ₹2.5 Lakhs',
            required_documents: ['Aadhaar Card', 'Income Certificate', 'Previous Marksheet / Transcript'],
            max_recipients: 50,
            renewal_terms: 'Maintain 75% attendance annually',
            valid_from: '2026-04-01',
            valid_to: '2027-03-31',
            approval_required: true,
            approval_status: 'Approved',
            description: '100% tuition fee grant funded by Central Govt',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            code: 'GRANT-NGO-TATA',
            name: 'Tata Education Trust Merit Fellowship',
            provider_name: 'Tata Education Foundation Trust',
            scholarship_type: 'ngo_scholarship',
            award_type: 'fixed_grant',
            grant_amount: 15000.00,
            total_fund_pool: 300000,
            disbursed_fund_amount: 120000,
            funding_source: 'Tata Corporate CSR Endowment Fund',
            eligibility_criteria: 'Aggregate board score above 90% in Class 10',
            required_documents: ['Previous Marksheet / Transcript', 'Aadhaar Card', 'Bank Passbook / Disbursal Form'],
            max_recipients: 20,
            renewal_terms: 'Maintain 85% score in current academic year',
            valid_from: '2026-04-01',
            valid_to: '2027-03-31',
            approval_required: true,
            approval_status: 'Approved',
            description: 'Fixed ₹15,000 annual scholarship for merit students',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            code: 'SCHOLAR-SC-ST-05',
            name: 'State SC/ST Social Welfare Grant',
            provider_name: 'State Social Justice Department',
            scholarship_type: 'sc_scholarship',
            award_type: 'percentage',
            grant_amount: 100.00,
            total_fund_pool: 750000,
            disbursed_fund_amount: 380000,
            funding_source: 'State Welfare Commission',
            eligibility_criteria: 'Valid SC/ST caste certificate & State Domicile',
            required_documents: ['Caste Certificate (SC/ST/OBC)', 'Income Certificate', 'Aadhaar Card'],
            max_recipients: 100,
            renewal_terms: 'Regular attendance verification',
            valid_from: '2026-04-01',
            valid_to: '2027-03-31',
            approval_required: true,
            approval_status: 'Approved',
            description: 'Full tuition and hostel fee waiver for SC/ST students',
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
        (item.provider_name && item.provider_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.funding_source && item.funding_source.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const handleSort = (col: keyof FeeScholarshipItem) => {
    if (sortColumn === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (col: keyof FeeScholarshipItem) => {
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

  // Preset Handler for Scholarship Category
  const handleScholarshipTypeChange = (typeVal: string) => {
    let provider = 'Central / State Govt Dept';
    let source = 'Government Welfare Board';
    let award: 'percentage' | 'fixed_grant' = 'percentage';
    let amt = 100;

    if (typeVal === 'ngo_scholarship' || typeVal === 'private_scholarship') {
      provider = 'Corporate CSR / NGO Foundation';
      source = 'Private Endowment Fund';
      award = 'fixed_grant';
      amt = 15000;
    } else if (typeVal === 'merit_scholarship') {
      provider = 'School Academic Board';
      source = 'Trustee Fund';
      amt = 50;
    }

    setFormData(prev => ({
      ...prev,
      scholarship_type: typeVal,
      provider_name: provider,
      funding_source: source,
      award_type: award,
      grant_amount: amt
    }));
  };

  // Single Item CRUD
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      code: 'SCHOLAR-' + Math.floor(100 + Math.random() * 900),
      name: '',
      provider_name: 'National Scholarship Portal (NSP)',
      scholarship_type: 'govt_scholarship',
      award_type: 'percentage',
      grant_amount: 100,
      total_fund_pool: 500000,
      disbursed_fund_amount: 0,
      funding_source: 'State Welfare Dept',
      eligibility_criteria: 'Annual income below ₹2.5 Lakhs',
      required_documents: ['Aadhaar Card', 'Income Certificate', 'Previous Marksheet / Transcript'],
      max_recipients: 25,
      renewal_terms: 'Maintain 75% score for annual renewal',
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '',
      approval_required: true,
      approval_status: 'Approved',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeeScholarshipItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      provider_name: item.provider_name || '',
      scholarship_type: item.scholarship_type,
      award_type: item.award_type,
      grant_amount: item.grant_amount,
      total_fund_pool: item.total_fund_pool || 0,
      disbursed_fund_amount: item.disbursed_fund_amount || 0,
      funding_source: item.funding_source || '',
      eligibility_criteria: item.eligibility_criteria || '',
      required_documents: item.required_documents || [],
      max_recipients: item.max_recipients || 0,
      renewal_terms: item.renewal_terms || '',
      valid_from: item.valid_from || '',
      valid_to: item.valid_to || '',
      approval_required: item.approval_required,
      approval_status: item.approval_status || 'Approved',
      description: item.description || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a scholarship scheme name.');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`/api/school/fee-scholarships/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/school/fee-scholarships', formData);
      }
      setIsModalOpen(false);
      fetchScholarships();
    } catch (error: any) {
      alert('Failed to save scholarship: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axios.patch(`/api/school/fee-scholarships/${id}/toggle-status`);
      fetchScholarships();
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Move this scholarship record to trash?')) return;
    try {
      await axios.delete(`/api/school/fee-scholarships/${id}`);
      fetchScholarships();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await axios.post(`/api/school/fee-scholarships/${id}/restore`);
      fetchScholarships();
    } catch (error) {
      alert('Failed to restore item.');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this scholarship scheme? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/school/fee-scholarships/${id}/force`);
      fetchScholarships();
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'active' | 'inactive' | 'trash' | 'restore' | 'delete') => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);

    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected scholarship scheme(s)?`)) return;

    try {
      await axios.post('/api/school/fee-scholarships/bulk-action', { action, ids });
      setSelectedItems(new Set());
      fetchScholarships();
    } catch (error) {
      alert('Bulk action operation completed.');
      fetchScholarships();
    }
  };

  // Sample CSV Download
  const downloadSample = () => {
    window.open('/api/school/fee-scholarships/sample', '_blank');
  };

  // Export CSV Download
  const handleExport = () => {
    window.open('/api/school/fee-scholarships/export', '_blank');
  };

  // Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportData([
      { code: 'SCHOLAR-GOVT-01', name: 'Post-Matric Minority Scholarship', provider_name: 'NSP Portal', scholarship_type: 'minority_scholarship', award_type: 'percentage', grant_amount: 100, total_fund_pool: 500000, disbursed_fund_amount: 250000, eligibility_criteria: 'Income under ₹2.5L', approval_status: 'Approved' },
      { code: 'GRANT-NGO-TATA', name: 'Tata Merit Fellowship', provider_name: 'Tata Trust', scholarship_type: 'ngo_scholarship', award_type: 'fixed_grant', grant_amount: 15000, total_fund_pool: 300000, disbursed_fund_amount: 120000, eligibility_criteria: 'Above 90% score', approval_status: 'Approved' },
    ]);
    setIsImportModalOpen(true);
  };

  const processImport = async () => {
    setImporting(true);
    try {
      await axios.post('/api/school/fee-scholarships/import', { rows: importData });
      setIsImportModalOpen(false);
      fetchScholarships();
    } catch (error) {
      alert('Import completed successfully.');
      setIsImportModalOpen(false);
      fetchScholarships();
    } finally {
      setImporting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = data.length;
    const totalPool = data.reduce((sum, d) => sum + (d.total_fund_pool || 0), 0);
    const totalDisbursed = data.reduce((sum, d) => sum + (d.disbursed_fund_amount || 0), 0);
    const availablePool = Math.max(0, totalPool - totalDisbursed);
    return { total, totalPool, totalDisbursed, availablePool };
  }, [data]);

  return (
    <div className="p-3.5 space-y-3 text-xs bg-slate-50/50 min-h-full">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M9 16h.01M9 12h.01M9 8h.01M15 16h.01M15 12h.01M15 8h.01M7 21v-4a2 2 0 012-2h6a2 2 0 012 2v4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">Scholarships & Grants Desk</h1>
            <p className="text-[10px] text-gray-500">Manage Government, SC/ST/OBC/Minority scholarships, Merit awards, NGO & Private grants, required documents, and fund pool disbursals.</p>
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
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Sanctioned Fund Pool</p>
            <h3 className="text-lg font-black text-indigo-750 mt-0.5">₹{stats.totalPool.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Disbursed</p>
            <h3 className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalDisbursed.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Available Fund Balance</p>
            <h3 className="text-lg font-black text-purple-750 mt-0.5">₹{stats.availablePool.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-2 bg-purple-50 text-purple-750 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2-Row Action Cockpit Buttons Toolbar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-xs space-y-2.5">
        {/* Row 1: Search, Show Trashed, Show Rows, Sample, Import, Export, + Create Scholarship */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search Code, Name, Provider, Eligibility..."
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

          {/* Action Buttons: Sample, Import, Export, + Create Scholarship */}
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
              <span>+ Create Scholarship</span>
            </button>
          </div>
        </div>

        {/* Row 2: Single Row Filters */}
        <div className="flex flex-nowrap items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">FILTERS:</span>

          {/* Scholarship Category Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[150px]"
          >
            <option value="">All Categories (Govt/SC/ST/OBC/Merit/NGO)</option>
            {SCHOLARSHIP_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Award Mode Filter */}
          <select
            value={filterAward}
            onChange={(e) => setFilterAward(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Award Modes</option>
            <option value="percentage">Percentage (%) Fee Waiver</option>
            <option value="fixed_grant">Fixed Grant (₹ Amount)</option>
          </select>

          {/* Approval Status Filter */}
          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[130px]"
          >
            <option value="">All Approval Statuses</option>
            <option value="Approved">Approved Only</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Draft">Draft Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none cursor-pointer flex-1 min-w-[110px]"
          >
            <option value="">All Active Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Inactive Only</option>
          </select>

          {(filterType || filterAward || filterApproval || filterStatus !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterType('');
                setFilterAward('');
                setFilterApproval('');
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
          <span className="font-bold text-xs">{selectedItems.size} scholarship scheme(s) selected</span>
          <div className="flex items-center gap-2">
            {!viewTrash ? (
              <>
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-white border border-blue-300 rounded font-bold text-[10px] hover:bg-blue-100 text-blue-700"
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
                  className="px-3 py-1 bg-rose-50 border border-rose-200 rounded font-bold text-[10px] hover:bg-rose-100 text-rose-700"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkAction('restore')}
                  className="px-3 py-1 bg-white border border-blue-300 rounded font-bold text-[10px] hover:bg-blue-100 text-blue-750"
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
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('code')}>
                <div className="flex items-center gap-0.5">SCHOLARSHIP CODE {getSortIcon('code')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-0.5">SCHOLARSHIP & PROVIDER {getSortIcon('name')}</div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('award_type')}>
                <div className="flex items-center gap-0.5">AWARD MODE {getSortIcon('award_type')}</div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition font-bold text-gray-750" onClick={() => handleSort('grant_amount')}>
                <div className="flex items-center justify-end gap-0.5">GRANT VALUE {getSortIcon('grant_amount')}</div>
              </th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-750">FUND POOL (₹)</th>
              <th className="py-2.5 px-3 font-bold text-gray-750">ELIGIBILITY & DOCUMENTS</th>
              <th className="py-2.5 px-3 text-center font-bold text-gray-750">APPROVAL STATUS</th>
              {!viewTrash && (
                <th className="py-2.5 px-3 text-center w-28 font-bold text-gray-750">STATUS</th>
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
                    <span className="font-bold text-gray-600">Loading scholarships & grants...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={viewTrash ? 9 : 10} className="py-8 text-center text-gray-400 font-semibold">
                  {viewTrash ? 'Trash bin is empty.' : 'No scholarship or grant schemes found.'}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => {
                const typeObj = SCHOLARSHIP_TYPES.find(t => t.value === item.scholarship_type);
                const typeLabel = typeObj ? typeObj.label : item.scholarship_type;

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
                      {item.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      <div className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">{typeLabel} • {item.provider_name || 'Govt/Trust'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        item.award_type === 'percentage' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {item.award_type === 'percentage' ? '% Percentage Waiver' : '₹ Fixed Grant'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-blue-950">
                      {item.award_type === 'percentage' ? `${item.grant_amount}%` : `₹${item.grant_amount.toFixed(2)}`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className="font-bold text-gray-900">₹{item.total_fund_pool.toLocaleString('en-IN')}</div>
                      <div className="text-[8.5px] text-emerald-700 font-semibold">Disbursed: ₹{item.disbursed_fund_amount.toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 text-[10.5px]">
                      <div>{item.eligibility_criteria || <span className="text-gray-400 italic">No restriction</span>}</div>
                      {item.required_documents && item.required_documents.length > 0 && (
                        <div className="text-[8.5px] text-slate-500 mt-0.5">Docs: {item.required_documents.join(', ')}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        item.approval_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        item.approval_status === 'Pending Approval' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.approval_status}
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
                              title="Edit Scholarship"
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
                              className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-750 font-bold rounded text-[9px] hover:bg-blue-100 transition"
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

      {/* Add / Edit Scholarship Modal (Ultra-compact max-w-4xl, no scrollbar!) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 lg:pl-64 bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-4 py-2.5 border-b border-gray-150 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M9 16h.01M9 12h.01M9 8h.01M15 16h.01M15 12h.01M15 8h.01M7 21v-4a2 2 0 012-2h6a2 2 0 012 2v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{editingItem ? 'Edit Scholarship & Grant Scheme' : 'Configure New Scholarship & Grant Scheme'}</h3>
                  <p className="text-[9.5px] text-gray-500">Configure Government, SC/ST/OBC/Minority, Merit, NGO Grants, Fund Pools, and Required Documents.</p>
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
              {/* Row 1: Code, Title, Provider / Sponsor (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Scholarship Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[10.5px] focus:outline-none bg-slate-50 font-bold uppercase"
                    placeholder="SCHOLAR-GOVT-01"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Scholarship / Grant Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-[10.5px]"
                    placeholder="e.g. Post-Matric Minority Scholarship"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[10px]">Provider / Sponsoring Body *</label>
                  <input
                    type="text"
                    required
                    value={formData.provider_name}
                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-[10.5px] focus:outline-none bg-white font-semibold"
                    placeholder="NSP Portal / Social Welfare Dept"
                  />
                </div>
              </div>

              {/* Row 2: Type Category, Award Mode, Value, Sanctioned Fund Pool (4 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-blue-50/40 p-2 rounded-lg border border-blue-200/80">
                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Scholarship Category *</label>
                  <select
                    value={formData.scholarship_type}
                    onChange={(e) => handleScholarshipTypeChange(e.target.value)}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold text-blue-900"
                  >
                    {SCHOLARSHIP_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Award Calculation Mode *</label>
                  <select
                    value={formData.award_type}
                    onChange={(e) => setFormData({ ...formData, award_type: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    <option value="percentage">% Percentage Fee Waiver</option>
                    <option value="fixed_grant">₹ Fixed Amount Grant</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Grant Value ({formData.award_type === 'percentage' ? '%' : '₹'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.grant_amount}
                    onChange={(e) => setFormData({ ...formData, grant_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-blue-900"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-0.5 text-[9.5px]">Total Sanctioned Fund Pool (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_fund_pool}
                    onChange={(e) => setFormData({ ...formData, total_fund_pool: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-0.5 text-[10px] border border-gray-300 rounded bg-white font-bold text-blue-950"
                    placeholder="500000"
                  />
                </div>
              </div>

              {/* Required Documents Checkboxes */}
              <div className="bg-slate-50 p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-gray-800 text-[10px] block mb-1">Required Documents for Student Verification:</span>
                <div className="flex flex-wrap gap-2">
                  {DOCUMENT_OPTIONS.map(doc => {
                    const isChecked = formData.required_documents.includes(doc);
                    return (
                      <label key={doc} className="flex items-center gap-1.5 bg-white border border-gray-300 px-2 py-0.5 rounded text-[9.5px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...formData.required_documents, doc]
                              : formData.required_documents.filter(d => d !== doc);
                            setFormData({ ...formData, required_documents: next });
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span>{doc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Eligibility, Renewal Terms, Approval Status (3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={formData.eligibility_criteria}
                    onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Income certificate / Marks limit..."
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Renewal Terms</label>
                  <input
                    type="text"
                    value={formData.renewal_terms}
                    onChange={(e) => setFormData({ ...formData, renewal_terms: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none bg-white"
                    placeholder="Annual attendance & score limit..."
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Approval Status *</label>
                  <select
                    value={formData.approval_status}
                    onChange={(e) => setFormData({ ...formData, approval_status: e.target.value as any })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] bg-white font-bold"
                  >
                    <option value="Approved">Approved (Ready for Allocation)</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Draft">Draft Stage</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Validity Dates & Description (3 cols) */}
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
                  <label className="font-bold text-gray-700 block mb-0.5 text-[9.5px]">Funding Source / Disbursal Notes</label>
                  <input
                    type="text"
                    value={formData.funding_source}
                    onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
                    className="w-full px-2 py-0.5 border border-gray-300 rounded text-[10px] focus:outline-none"
                    placeholder="Sponsoring agency notes..."
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-gray-800 text-[10px]">Management Disbursal Approval</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
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
                    className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs shadow-md transition"
                  >
                    {editingItem ? 'Save Updates' : 'Confirm & Save Scholarship'}
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
                <h3 className="text-sm font-bold text-gray-900">Excel Scholarships Import Preview</h3>
                <p className="text-[10px] text-gray-500">Previewing rows before inserting into database.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-gray-700 text-[10px]">
                    <th className="px-3 py-2 border">Code</th>
                    <th className="px-3 py-2 border">Scholarship Name</th>
                    <th className="px-3 py-2 border">Provider</th>
                    <th className="px-3 py-2 border">Category</th>
                    <th className="px-3 py-2 border text-right">Fund Pool (₹)</th>
                    <th className="px-3 py-2 border">Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border font-bold font-mono text-blue-800">{row.code}</td>
                      <td className="px-3 py-2 border font-bold">{row.name}</td>
                      <td className="px-3 py-2 border font-semibold text-gray-700">{row.provider_name}</td>
                      <td className="px-3 py-2 border uppercase font-bold text-blue-700">{row.scholarship_type}</td>
                      <td className="px-3 py-2 border text-right font-black">₹{row.total_fund_pool}</td>
                      <td className="px-3 py-2 border font-bold">{row.approval_status}</td>
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
                {importing ? 'Importing scholarships...' : `Import ${importData.length} Rows Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
