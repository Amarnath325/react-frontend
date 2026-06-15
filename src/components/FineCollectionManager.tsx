import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// Premium SVG Icons Matching Lucide Style
const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const schoolName = 'School Library';


const ClipboardIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const HourglassIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SparklesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ShieldAlertIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const EmptyBoxIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

// Styles matching current layout's dropdowns
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
    minHeight: '34px',
    height: '34px',
    backgroundColor: '#ffffff',
    transition: 'all 150ms ease-in-out',
    '&:hover': {
      borderColor: state.isFocused ? '#6366f1' : '#cbd5e1',
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 12px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '12px',
    color: '#0f172a',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#94a3b8',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#0f172a',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '32px',
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '4px 8px',
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: '4px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontSize: '12px',
    padding: '8px 12px',
    backgroundColor: state.isSelected 
      ? '#6366f1' 
      : state.isFocused 
        ? '#f1f5f9' 
        : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#334155',
    cursor: 'pointer',
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    zIndex: 9999,
  })
};

interface Fine {
  id: number;
  library_member_id: number;
  member_code: string;
  member_type: string;
  member_name: string;
  book_title: string;
  book_code: string;
  book_issue_id: number | null;
  fine_type: 'late_return' | 'lost_book' | 'damaged_book' | 'other';
  amount: number;
  paid_amount: number;
  waived_amount: number;
  status: 'pending' | 'paid' | 'waived' | 'partial';
  remarks: string | null;
  created_at: string;
}

interface PaymentLog {
  id: number;
  library_fine_id: number;
  amount_paid: number;
  payment_mode: 'cash' | 'card' | 'upi' | 'net_banking';
  payment_date: string;
  collected_by_name: string;
  remarks: string | null;
  member_name: string;
  member_code: string;
  member_type: string;
  book_title: string;
  fine_type: string;
}

const FineCollectionManager: React.FC = () => {
  type TabType = 'pending' | 'collected' | 'payments';
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  
  const [fines, setFines] = useState<Fine[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    total_fines: 0,
    pending_amount: 0,
    collected_amount: 0,
    waived_amount: 0,
    pending_cases: 0,
    pending_tab_count: 0,
    collected_tab_count: 0,
    payments_tab_count: 0
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isWaiveModalOpen, setIsWaiveModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentLog | null>(null);

  // Dropdown list options
  const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
  const [memberIssues, setMemberIssues] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Add Fine Form State
  const [addFormData, setAddFormData] = useState({
    library_member_id: '',
    fine_type: 'late_return',
    book_issue_id: '',
    amount: '',
    remarks: ''
  });

  // Collect Fine Form State
  const [collectFormData, setCollectFormData] = useState({
    amount_paid: '',
    payment_mode: 'cash',
    remarks: ''
  });

  // Waive Fine Form State
  const [waiveFormData, setWaiveFormData] = useState({
    amount_waived: '',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/library-fines', {
        params: { 
          tab: activeTab,
          search: searchTerm 
        }
      });
      if (response.data.success) {
        if (activeTab === 'payments') {
          setPayments(response.data.data);
        } else {
          setFines(response.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching fine records:', err);
      toast.error('Failed to load fine records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/school/library-fines/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const memRes = await api.get('/school/book-issues/eligible-members');
      if (memRes.data.success) {
        setEligibleMembers(memRes.data.data);
      }
    } catch (err) {
      console.error('Error loading members:', err);
      toast.error('Failed to load library members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadIssuesForMember = async (memberId: string) => {
    if (!memberId) {
      setMemberIssues([]);
      return;
    }
    setLoadingIssues(true);
    try {
      const issuesRes = await api.get(`/school/library-fines/member-issues/${memberId}`);
      if (issuesRes.data.success) {
        setMemberIssues(issuesRes.data.data);
      }
    } catch (err) {
      console.error('Error loading member issues:', err);
      toast.error('Failed to load transaction history for member');
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleOpenAddModal = () => {
    setAddFormData({
      library_member_id: '',
      fine_type: 'late_return',
      book_issue_id: '',
      amount: '',
      remarks: ''
    });
    setMemberIssues([]);
    setIsAddModalOpen(true);
    loadMembers();
  };

  const handleMemberChange = (option: any) => {
    const memberId = option ? option.value.toString() : '';
    setAddFormData(prev => ({ 
      ...prev, 
      library_member_id: memberId,
      book_issue_id: '' 
    }));
    loadIssuesForMember(memberId);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.library_member_id) {
      toast.error('Please select a library member');
      return;
    }
    if (!addFormData.amount || parseFloat(addFormData.amount) <= 0) {
      toast.error('Please specify a fine amount greater than ₹0');
      return;
    }

    try {
      const response = await api.post('/school/library-fines', {
        library_member_id: parseInt(addFormData.library_member_id),
        fine_type: addFormData.fine_type,
        book_issue_id: addFormData.book_issue_id ? parseInt(addFormData.book_issue_id) : null,
        amount: parseFloat(addFormData.amount),
        remarks: addFormData.remarks
      });

      if (response.data.success) {
        toast.success('Fine recorded successfully!');
        setIsAddModalOpen(false);
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error creating fine:', err);
      toast.error(err.response?.data?.message || 'Failed to record fine');
    }
  };

  const handleOpenCollectModal = (fine: Fine) => {
    setSelectedFine(fine);
    const remaining = maxFineBalance(fine);
    setCollectFormData({
      amount_paid: remaining.toString(),
      payment_mode: 'cash',
      remarks: ''
    });
    setIsCollectModalOpen(true);
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFine) return;
    const amount = parseFloat(collectFormData.amount_paid);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount to collect');
      return;
    }

    try {
      const response = await api.post(`/school/library-fines/${selectedFine.id}/collect`, {
        amount_paid: amount,
        payment_mode: collectFormData.payment_mode,
        remarks: collectFormData.remarks
      });

      if (response.data.success) {
        toast.success('Fine payment collected successfully!');
        setIsCollectModalOpen(false);
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error collecting payment:', err);
      toast.error(err.response?.data?.message || 'Failed to process payment');
    }
  };

  const handleOpenWaiveModal = (fine: Fine) => {
    setSelectedFine(fine);
    const remaining = maxFineBalance(fine);
    setWaiveFormData({
      amount_waived: remaining.toString(),
      remarks: ''
    });
    setIsWaiveModalOpen(true);
  };

  const handleWaiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFine) return;
    const amount = parseFloat(waiveFormData.amount_waived);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount to waive');
      return;
    }

    try {
      const response = await api.post(`/school/library-fines/${selectedFine.id}/waive`, {
        amount_waived: amount,
        remarks: waiveFormData.remarks
      });

      if (response.data.success) {
        toast.success('Fine amount waived successfully!');
        setIsWaiveModalOpen(false);
        fetchData();
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error waiving fine:', err);
      toast.error(err.response?.data?.message || 'Failed to waive fine');
    }
  };

  const maxFineBalance = (fine: Fine) => {
    return Math.max(0, parseFloat(fine.amount.toString()) - parseFloat(fine.paid_amount.toString()) - parseFloat(fine.waived_amount.toString()));
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchData();
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    api.get('/school/library-fines', {
      params: { 
        tab: activeTab,
        search: '' 
      }
    }).then(response => {
      if (response.data.success) {
        if (activeTab === 'payments') {
          setPayments(response.data.data);
        } else {
          setFines(response.data.data);
        }
      }
    });
  };

  const getFineTypeLabel = (type: string) => {
    switch (type) {
      case 'lost_book':
        return '📖 Lost Book';
      case 'damaged_book':
        return '💥 Damaged Book';
      case 'late_return':
        return '⏰ Late Return';
      case 'other':
      default:
        return '⚙️ Other Penalty';
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleViewReceipt = (pay: PaymentLog) => {
    setSelectedPayment(pay);
    setIsReceiptModalOpen(true);
  };

  // Client-side filtering by Fine Type
  const filteredFines = fines.filter(f => typeFilter === 'all' || f.fine_type === typeFilter);
  const filteredPayments = payments.filter(p => typeFilter === 'all' || p.fine_type === typeFilter);

  return (
    <div className="space-y-3 font-sans text-xs">

      {/* Dashboard Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Stat 1: Total Fines */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:-translate-y-0.5 transition duration-150">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Fines</p>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">{stats.total_fines}</h3>
          </div>
          <div className="w-7.5 h-7.5 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500">
            <ClipboardIcon className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Stat 2: Pending Amount */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:-translate-y-0.5 transition duration-150">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Pending Amount</p>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">₹{stats.pending_amount}</h3>
          </div>
          <div className="w-7.5 h-7.5 rounded-lg bg-amber-50/50 border border-amber-100 flex items-center justify-center text-amber-500">
            <HourglassIcon className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Stat 3: Collected Amount */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:-translate-y-0.5 transition duration-150">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Collected Amount</p>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">₹{stats.collected_amount}</h3>
          </div>
          <div className="w-7.5 h-7.5 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CashIcon className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Stat 4: Waived Amount */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:-translate-y-0.5 transition duration-150">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Waived Amount</p>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">₹{stats.waived_amount}</h3>
          </div>
          <div className="w-7.5 h-7.5 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <SparklesIcon className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        {/* Stat 5: Pending Cases */}
        <div className="col-span-2 md:col-span-1 bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:-translate-y-0.5 transition duration-150">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Pending Cases</p>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">{stats.pending_cases}</h3>
          </div>
          <div className="w-7.5 h-7.5 rounded-lg bg-rose-50/50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ShieldAlertIcon className="w-4 h-4 text-rose-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200/80 bg-white px-2 shadow-xs rounded-t-xl">
        <button
          onClick={() => { setActiveTab('pending'); setTypeFilter('all'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>⌛</span>
          <span>Pending Fines</span>
          <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            activeTab === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {stats.pending_tab_count}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('collected'); setTypeFilter('all'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'collected'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>✅</span>
          <span>Collected</span>
          <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            activeTab === 'collected' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {stats.collected_tab_count}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('payments'); setTypeFilter('all'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📋</span>
          <span>Payment Logs</span>
          <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            activeTab === 'payments' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {stats.payments_tab_count}
          </span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
        
        <div className="flex flex-1 items-center gap-2 max-w-xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search by member name, book title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50/45 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none rounded-lg text-[11px] text-slate-700 font-medium transition-all duration-150 placeholder-slate-400"
            />
          </div>

          {/* Type Dropdown */}
          <div className="w-36">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition"
            >
              <option value="all">All Types</option>
              <option value="late_return">⏰ Late Return</option>
              <option value="lost_book">📖 Lost Book</option>
              <option value="damaged_book">💥 Damaged Book</option>
              <option value="other">⚙️ Other Penalty</option>
            </select>
          </div>
        </div>
        
        {/* Buttons on Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <span className="font-bold text-xs">+</span> Add New Fine
          </button>

          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
          >
            Reset Filters
          </button>
          
          <button
            onClick={() => {
              fetchData();
              fetchStats();
            }}
            className="flex items-center justify-center p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-[11px] font-semibold text-slate-700 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
            title="Refresh logs"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-44">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                <p className="mt-2 text-slate-400 font-semibold text-[10px]">Loading fine logs...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'payments' ? (
                /* Payment Logs Tab Table */
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-3 w-28 whitespace-nowrap">Transaction ID</th>
                      <th className="py-2.5 px-3 w-24 whitespace-nowrap">Fine ID</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Member</th>
                      <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Amount (₹)</th>
                      <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Payment Mode</th>
                      <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Payment Date</th>
                      <th className="py-2.5 px-3 w-32 whitespace-nowrap">Collected By</th>
                      <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="p-2.5 rounded-full bg-slate-50 text-slate-300 border border-slate-100">
                              <EmptyBoxIcon className="w-7 h-7" />
                            </div>
                            <div className="font-semibold text-slate-700 text-xs">No payment logs found</div>
                            <div className="text-slate-400 text-[10px]">No fine collections have been registered.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/20 transition text-slate-700">
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 text-[9px] uppercase tracking-wider">
                              TXN-{pay.id}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 text-[9px] uppercase tracking-wider">
                              FINE-{pay.library_fine_id}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-800 text-[11px] leading-tight">{pay.member_name}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">Card: {pay.member_code}</div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="font-mono font-bold text-[11px] text-slate-800">₹{parseFloat(pay.amount_paid.toString()).toFixed(2)}</div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-105 text-slate-700 border border-slate-200 rounded font-semibold text-[9px] uppercase tracking-wide">
                              {pay.payment_mode}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="font-mono text-[10px] text-slate-600">{formatDisplayDate(pay.payment_date)}</div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-750 leading-tight">{pay.collected_by_name}</div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleViewReceipt(pay)}
                              className="px-2 py-0.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded text-[9px] font-semibold tracking-wide transition duration-150 cursor-pointer"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                /* Pending & Collected Fines Tabs Tables */
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-3 w-24 whitespace-nowrap">Fine ID</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Member Details</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Book Details</th>
                      <th className="py-2.5 px-3 w-32 whitespace-nowrap">Fine Type</th>
                      <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Date Accrued</th>
                      <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">
                        {activeTab === 'collected' ? 'Collected / Waived' : 'Amount (₹)'}
                      </th>
                      <th className="py-2.5 px-3 w-32 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredFines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="p-2.5 rounded-full bg-slate-50 text-slate-300 border border-slate-100">
                              <EmptyBoxIcon className="w-7 h-7" />
                            </div>
                            <div className="font-semibold text-slate-700 text-xs mt-1">No records found</div>
                            <div className="text-slate-400 text-[10px]">No fine logs match the active filter criteria.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredFines.map((fine) => {
                        return (
                          <tr key={fine.id} className="hover:bg-slate-50/20 transition text-slate-700">
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 text-[9px] uppercase tracking-wider">
                                FINE-{fine.id}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-800 text-[11px] leading-tight">{fine.member_name}</div>
                              <div className="inline-flex items-center mt-0.5 text-[8px] font-semibold text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                                {fine.member_type} ({fine.member_code})
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-800 text-[11px] leading-tight">{fine.book_title}</div>
                              {fine.book_issue_id && (
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  Txn ID: <span className="text-slate-500 font-medium">TXN-{fine.book_issue_id}</span> | Code: {fine.book_code}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center font-medium text-slate-700">
                                {getFineTypeLabel(fine.fine_type)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="font-mono text-[10px] text-slate-650">{formatDisplayDate(fine.created_at)}</div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {activeTab === 'collected' ? (
                                <div className="space-y-0.5">
                                  <div className="font-mono text-[10px] text-emerald-600 font-bold">Collected: ₹{parseFloat(fine.paid_amount.toString()).toFixed(2)}</div>
                                  {parseFloat(fine.waived_amount.toString()) > 0 && (
                                    <div className="font-mono text-[9px] text-slate-500">Waived: ₹{parseFloat(fine.waived_amount.toString()).toFixed(2)}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-mono text-[11px] text-slate-800 font-bold">₹{parseFloat(fine.amount.toString()).toFixed(2)}</div>
                                  {parseFloat(fine.paid_amount.toString()) > 0 && (
                                    <div className="font-mono text-[8.5px] text-slate-450 font-medium">Paid: ₹{fine.paid_amount}</div>
                                  )}
                                  {parseFloat(fine.waived_amount.toString()) > 0 && (
                                    <div className="font-mono text-[8.5px] text-slate-455 font-medium">Waived: ₹{fine.waived_amount}</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {activeTab === 'collected' ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider border ${
                                  fine.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                  {fine.status}
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenCollectModal(fine)}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-semibold tracking-wide shadow-xs transition duration-150 cursor-pointer"
                                  >
                                    Collect
                                  </button>
                                  <button
                                    onClick={() => handleOpenWaiveModal(fine)}
                                    className="px-2 py-0.5 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded text-[9px] font-semibold tracking-wide transition duration-150 cursor-pointer"
                                  >
                                    Waive
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {/* 1. Add Fine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 font-semibold text-xs tracking-wide">
                <span className="text-sm">➕</span>
                <span>Add New Fine</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-slate-200 transition-colors text-sm font-bold p-0.5 cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5 text-xs text-slate-700">
              
              {/* Member Dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Member *</label>
                <Select
                  isLoading={loadingMembers}
                  value={eligibleMembers.find(m => m.value.toString() === addFormData.library_member_id) || null}
                  onChange={handleMemberChange}
                  options={eligibleMembers}
                  placeholder="Search by name or member ID..."
                  styles={customSelectStyles}
                  isSearchable={true}
                  noOptionsMessage={() => "No members found"}
                />
              </div>

              {/* Fine Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fine Type *</label>
                <select
                  value={addFormData.fine_type}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, fine_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition"
                >
                  <option value="late_return">⏰ Late Return</option>
                  <option value="lost_book">📖 Lost Book</option>
                  <option value="damaged_book">💥 Damaged Book</option>
                  <option value="other">⚙️ Other Penalty</option>
                </select>
              </div>

              {/* Select Transaction */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Transaction</label>
                <Select
                  isLoading={loadingIssues}
                  value={memberIssues.find(i => i.value.toString() === addFormData.book_issue_id) || null}
                  onChange={(option) => setAddFormData(prev => ({ ...prev, book_issue_id: option ? option.value.toString() : '' }))}
                  options={memberIssues}
                  placeholder={addFormData.library_member_id ? "Search by transaction ID or book title..." : "Select member first..."}
                  isDisabled={!addFormData.library_member_id}
                  styles={customSelectStyles}
                  isSearchable={true}
                  noOptionsMessage={() => "No transactions found"}
                />
              </div>

              {/* Fine Amount */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fine Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Auto-calculated based on overdue days"
                  value={addFormData.amount}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition placeholder-slate-400"
                />
              </div>

              {/* Reason / Remarks */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reason / Remarks</label>
                <textarea
                  placeholder="Additional details..."
                  value={addFormData.remarks}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-[11px] h-16 resize-none bg-slate-50/30 hover:bg-white focus:bg-white transition placeholder-slate-400"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-655 font-bold hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Add Fine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Collect Fine Modal */}
      {isCollectModalOpen && selectedFine && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 font-semibold text-xs tracking-wide">
                <span>💳</span>
                <span>Collect Fine Payment</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(false)}
                className="text-white hover:text-slate-200 transition-colors text-sm font-bold p-0.5 cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleCollectSubmit} className="p-4 space-y-3.5 text-xs text-slate-700">
              
              {/* Fine Info */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-normal space-y-0.5">
                <div><span className="font-semibold text-slate-500">Fine Reference:</span> <span className="font-mono font-bold text-slate-800">FINE-{selectedFine.id}</span></div>
                <div><span className="font-semibold text-slate-500">Member:</span> <span className="font-bold text-slate-800">{selectedFine.member_name}</span></div>
                <div><span className="font-semibold text-slate-500">Book:</span> <span className="font-semibold text-slate-800">{selectedFine.book_title}</span></div>
                <div><span className="font-semibold text-slate-500">Remaining Balance:</span> <span className="font-mono font-bold text-rose-600">₹{maxFineBalance(selectedFine)}</span></div>
              </div>

              {/* Amount to Collect */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={maxFineBalance(selectedFine)}
                  value={collectFormData.amount_paid}
                  onChange={(e) => setCollectFormData(prev => ({ ...prev, amount_paid: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Payment Mode *</label>
                <select
                  value={collectFormData.payment_mode}
                  onChange={(e) => setCollectFormData(prev => ({ ...prev, payment_mode: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI / QR Code</option>
                  <option value="card">💳 Card Swipe</option>
                  <option value="net_banking">🏦 Net Banking</option>
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Payment remarks..."
                  value={collectFormData.remarks}
                  onChange={(e) => setCollectFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-650 font-bold hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Waive Fine Modal */}
      {isWaiveModalOpen && selectedFine && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 font-semibold text-xs tracking-wide">
                <span>✨</span>
                <span>Waive Fine Penalty</span>
              </div>
              <button
                type="button"
                onClick={() => setIsWaiveModalOpen(false)}
                className="text-white hover:text-slate-200 transition-colors text-sm font-bold p-0.5 cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleWaiveSubmit} className="p-4 space-y-3.5 text-xs text-slate-700">
              
              {/* Fine Info */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-normal space-y-0.5">
                <div><span className="font-semibold text-slate-500">Fine Reference:</span> <span className="font-mono font-bold text-slate-800">FINE-{selectedFine.id}</span></div>
                <div><span className="font-semibold text-slate-500">Member:</span> <span className="font-bold text-slate-800">{selectedFine.member_name}</span></div>
                <div><span className="font-semibold text-slate-500">Remaining Balance:</span> <span className="font-mono font-bold text-slate-800">₹{maxFineBalance(selectedFine)}</span></div>
              </div>

              {/* Amount to Waive */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Amount to Waive (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={maxFineBalance(selectedFine)}
                  value={waiveFormData.amount_waived}
                  onChange={(e) => setWaiveFormData(prev => ({ ...prev, amount_waived: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks / Waive Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authorized by Principal"
                  value={waiveFormData.remarks}
                  onChange={(e) => setWaiveFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition placeholder-slate-450"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWaiveModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-650 font-bold hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg transition shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Confirm Waive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Payment Receipt Printable Modal */}
      {isReceiptModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 animate-slide-up">
            
            {/* Header */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white">
              <span className="font-semibold text-xs tracking-wide">📄 Fine Payment Receipt</span>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-white hover:text-slate-250 transition-colors text-sm font-bold p-0.5 cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-5 space-y-4" id="printable-receipt">
              <div className="text-center border-b border-slate-100 pb-3 space-y-1">
                <h2 className="text-xs font-bold text-slate-800 tracking-tight uppercase">{schoolName}</h2>
                <p className="text-[9px] text-slate-450 uppercase font-semibold tracking-widest">Library Fine Collection Receipt</p>
              </div>

              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                  <span className="text-slate-450 font-medium">Receipt No:</span>
                  <span className="font-mono font-bold text-slate-800">REC-{selectedPayment.id}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                  <span className="text-slate-450 font-medium">Fine Reference:</span>
                  <span className="font-mono font-bold text-slate-800">FINE-{selectedPayment.library_fine_id}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                  <span className="text-slate-450 font-medium">Payment Date:</span>
                  <span className="font-bold text-slate-700">{formatDisplayDate(selectedPayment.payment_date)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                  <span className="text-slate-450 font-medium">Member Name:</span>
                  <span className="font-bold text-slate-700">{selectedPayment.member_name} ({selectedPayment.member_code})</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                  <span className="text-slate-450 font-medium">Book Details:</span>
                  <span className="font-semibold text-slate-700 text-right max-w-[180px] truncate">{selectedPayment.book_title}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                  <span className="text-slate-450 font-medium">Fine Type:</span>
                  <span className="font-semibold text-slate-700 uppercase">{selectedPayment.fine_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                  <span className="text-slate-450 font-medium">Payment Mode:</span>
                  <span className="font-bold text-slate-700 uppercase">{selectedPayment.payment_mode}</span>
                </div>
                <div className="flex justify-between pt-1 text-xs font-bold text-slate-800">
                  <span>Amount Paid:</span>
                  <span className="font-mono">₹{parseFloat(selectedPayment.amount_paid.toString()).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[9px] text-slate-500 leading-normal italic">
                Collected by: {selectedPayment.collected_by_name}. Remarks: {selectedPayment.remarks || 'None'}
              </div>

              <div className="text-center pt-2 text-[8px] text-slate-400 font-semibold tracking-wider uppercase">
                Thank you for resolving your library dues!
              </div>
            </div>

            {/* Receipt Modal Actions */}
            <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-650 font-bold hover:bg-slate-100 transition cursor-pointer text-[10px]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg transition shadow-sm cursor-pointer text-[10px]"
              >
                Print Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FineCollectionManager;
