import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// Modern SVG Icons matching Lucide style
const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ReturnIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const BookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const WarningIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const HistoryIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EmptyBookIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Custom dropdown styles matching system compact styling
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0', // indigo-500 / slate-200
    boxShadow: state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
    minHeight: '38px',
    height: '38px',
    backgroundColor: '#ffffff',
    transition: 'all 150ms ease-in-out',
    '&:hover': {
      borderColor: state.isFocused ? '#6366f1' : '#cbd5e1', // slate-300
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 12px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '13px',
    color: '#0f172a',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '13px',
    color: '#94a3b8',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '13px',
    color: '#0f172a',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '36px',
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '4px',
    color: '#94a3b8',
    '&:hover': {
      color: '#64748b',
    }
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: '4px',
    color: '#94a3b8',
    '&:hover': {
      color: '#64748b',
    }
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#6366f1' // indigo-500
      : state.isFocused
        ? '#f8fafc' // slate-50
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#334155',
    fontSize: '13px',
    padding: '8px 12px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#6366f1' : '#e2e8f0',
    }
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    marginTop: '4px',
    zIndex: 9999,
  }),
};

interface Transaction {
  id: number;
  book_id: number;
  book_title: string;
  book_code: string;
  library_member_id: number;
  member_code: string;
  member_type: string;
  member_name: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: 'issued' | 'returned' | 'lost' | 'damaged';
  fine_amount: number;
  fine_accrued: number;
  days_overdue: number;
  remarks: string | null;
  issued_by_name: string;
}

const BookIssueReturnManager: React.FC = () => {
  type TabType = 'borrowed' | 'overdue' | 'history';
  const [activeTab, setActiveTab] = useState<TabType>('borrowed');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Badge counts
  const [stats, setStats] = useState({
    borrowed: 0,
    overdue: 0,
    history: 0
  });

  // Modal States
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  
  // Eligible lists for forms
  const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
  const [eligibleBooks, setEligibleBooks] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Form states - Issue Book
  const [issueFormData, setIssueFormData] = useState({
    library_member_id: '',
    book_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days default
    remarks: ''
  });

  // Form states - Return Book
  const [returnFormData, setReturnFormData] = useState({
    checkout_id: '',
    return_date: new Date().toISOString().split('T')[0],
    status: 'returned',
    remarks: '',
    fine_amount: 0,
    override_fine: false
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [activeTab]);

  // Load dropdown resources on modal opens
  useEffect(() => {
    if (isIssueModalOpen) {
      loadIssueResources();
    }
  }, [isIssueModalOpen]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let statusParam = '';
      if (activeTab === 'borrowed') statusParam = 'issued';
      else if (activeTab === 'overdue') statusParam = 'overdue';

      const response = await api.get('/school/book-issues', {
        params: { status: statusParam }
      });
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      toast.error('Failed to load transaction logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/school/book-issues/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const loadIssueResources = async () => {
    setLoadingMembers(true);
    setLoadingBooks(true);
    try {
      const memRes = await api.get('/school/book-issues/eligible-members');
      if (memRes.data.success) {
        setEligibleMembers(memRes.data.data);
      }

      const bookRes = await api.get('/school/book-issues/eligible-books');
      if (bookRes.data.success) {
        setEligibleBooks(bookRes.data.data);
      }
    } catch (err) {
      console.error('Error loading issue form options:', err);
      toast.error('Failed to load eligible books/members');
    } finally {
      setLoadingMembers(false);
      setLoadingBooks(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueFormData.library_member_id) {
      toast.error('Please select a library member');
      return;
    }
    if (!issueFormData.book_id) {
      toast.error('Please select a book');
      return;
    }

    try {
      const response = await api.post('/school/book-issues', {
        library_member_id: parseInt(issueFormData.library_member_id),
        book_id: parseInt(issueFormData.book_id),
        issue_date: issueFormData.issue_date,
        due_date: issueFormData.due_date,
        remarks: issueFormData.remarks
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Book issued successfully!');
        setIsIssueModalOpen(false);
        fetchTransactions();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnFormData.checkout_id) {
      toast.error('Please select a borrowed transaction');
      return;
    }

    try {
      const payload: any = {
        return_date: returnFormData.return_date,
        status: returnFormData.status,
        remarks: returnFormData.remarks
      };

      if (returnFormData.override_fine) {
        payload.fine_amount = returnFormData.fine_amount;
      }

      const response = await api.put(`/school/book-issues/${returnFormData.checkout_id}/return`, payload);

      if (response.data.success) {
        toast.success(response.data.message || 'Book returned successfully!');
        setIsReturnModalOpen(false);
        fetchTransactions();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  const handleQuickReturn = (item: Transaction) => {
    setReturnFormData({
      checkout_id: item.id.toString(),
      return_date: new Date().toISOString().split('T')[0],
      status: 'returned',
      remarks: '',
      fine_amount: item.fine_accrued,
      override_fine: false
    });
    setIsReturnModalOpen(true);
  };

  // Filter transaction records by search query
  const getFilteredTransactions = () => {
    if (!searchTerm) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(t => 
      t.book_title.toLowerCase().includes(term) ||
      t.book_code.toLowerCase().includes(term) ||
      t.member_name.toLowerCase().includes(term) ||
      t.member_code.toLowerCase().includes(term)
    );
  };

  const filteredData = getFilteredTransactions();

  // Fine accrued helper style color
  const getFineColor = (fine: number) => {
    return fine > 0 ? 'text-red-600 font-bold' : 'text-gray-500';
  };

  // Helper calculation for real-time fine calculation in Return Modal
  const getSelectedCheckoutDetails = () => {
    if (!returnFormData.checkout_id) return null;
    
    // Find checkout item from history
    let item = transactions.find(t => t.id.toString() === returnFormData.checkout_id);
    if (!item) {
      // If not in current tab list, fetch from active checkouts
      return null;
    }
    
    const issueDate = new Date(item.issue_date);
    const returnDate = new Date(returnFormData.return_date);
    const dueDate = new Date(item.due_date);
    
    const diffTime = returnDate.getTime() - issueDate.getTime();
    const daysBorrowed = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let daysOverdue = 0;
    let calculatedFine = 0;
    
    if (returnDate > dueDate) {
      const overdueTime = returnDate.getTime() - dueDate.getTime();
      daysOverdue = Math.max(0, Math.ceil(overdueTime / (1000 * 60 * 60 * 24)));
      calculatedFine = daysOverdue * 5; // Default late fine ₹5/day
    }
    
    return {
      daysBorrowed,
      daysOverdue,
      calculatedFine,
      dueDate: item.due_date,
      title: item.book_title,
      code: item.book_code,
      memberName: item.member_name,
      memberCode: item.member_code
    };
  };  const activeCheckoutOptions = transactions
    .filter(t => t.status === 'issued')
    .map(t => ({
      value: t.id.toString(),
      label: `${t.member_name} (${t.member_code}) - ${t.book_title}`
    }));

  const currentCheckoutDetails = getSelectedCheckoutDetails();

  return (
    <div className="space-y-4 font-sans">
      {/* Top Premium Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-250/60 shadow-sm">
        {/* Search Input on Left */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search book, borrower, card number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none rounded-lg text-[11px] text-slate-700 font-medium transition-all duration-155 placeholder-slate-400"
          />
        </div>
        
        {/* Buttons on Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIssueFormData({
                library_member_id: '',
                book_id: '',
                issue_date: new Date().toISOString().split('T')[0],
                due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days default
                remarks: ''
              });
              setIsIssueModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Issue New Book
          </button>
          
          <button
            onClick={() => {
              setReturnFormData({
                checkout_id: '',
                return_date: new Date().toISOString().split('T')[0],
                status: 'returned',
                remarks: '',
                fine_amount: 0,
                override_fine: false
              });
              setIsReturnModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <ReturnIcon className="w-3.5 h-3.5" /> Return Book
          </button>

          <button
            onClick={() => {
              fetchTransactions();
              fetchStats();
            }}
            className="flex items-center justify-center p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-[11px] font-semibold text-slate-700 transition-all duration-155 active:scale-[0.98] cursor-pointer shadow-xs"
            title="Refresh logs"
          >
            <RefreshIcon className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Interactive Stats Dashboard Cards (acting as Tab Switchers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Currently Borrowed */}
        <button
          type="button"
          onClick={() => setActiveTab('borrowed')}
          className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group select-none hover:-translate-y-0.5 ${
            activeTab === 'borrowed'
              ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-500/5 shadow-xs shadow-blue-500/5'
              : 'bg-white hover:bg-slate-50/50 border-slate-200 hover:border-slate-350 shadow-xs'
          }`}
        >
          <div className="space-y-0.5">
            <span className={`text-[9px] uppercase font-bold tracking-wider ${
              activeTab === 'borrowed' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
            }`}>Currently Borrowed</span>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{stats.borrowed}</h3>
            <p className="text-[10px] text-slate-400 font-normal">Active checkouts in circulation</p>
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
            activeTab === 'borrowed' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'
          }`}>
            <BookIcon className="w-4 h-4" />
          </div>
        </button>

        {/* Card 2: Overdue Books */}
        <button
          type="button"
          onClick={() => setActiveTab('overdue')}
          className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group select-none hover:-translate-y-0.5 ${
            activeTab === 'overdue'
              ? 'bg-rose-50/50 border-rose-500 ring-2 ring-rose-500/5 shadow-xs shadow-rose-500/5'
              : 'bg-white hover:bg-slate-50/50 border-slate-200 hover:border-slate-350 shadow-xs'
          }`}
        >
          <div className="space-y-0.5">
            <span className={`text-[9px] uppercase font-bold tracking-wider ${
              activeTab === 'overdue' ? 'text-rose-600' : 'text-slate-400 group-hover:text-slate-500'
            }`}>Overdue Books</span>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{stats.overdue}</h3>
            <p className="text-[10px] text-slate-400 font-normal">Past scheduled return date</p>
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
            activeTab === 'overdue' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-100'
          }`}>
            <WarningIcon className="w-4 h-4" />
          </div>
        </button>

        {/* Card 3: Transaction History */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group select-none hover:-translate-y-0.5 ${
            activeTab === 'history'
              ? 'bg-slate-100/50 border-slate-500 ring-2 ring-slate-500/5 shadow-xs shadow-slate-550/5'
              : 'bg-white hover:bg-slate-50/50 border-slate-200 hover:border-slate-350 shadow-xs'
          }`}
        >
          <div className="space-y-0.5">
            <span className={`text-[9px] uppercase font-bold tracking-wider ${
              activeTab === 'history' ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-500'
            }`}>Transaction History</span>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{stats.history}</h3>
            <p className="text-[10px] text-slate-400 font-normal">Total registered return logs</p>
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
            activeTab === 'history' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
          }`}>
            <HistoryIcon className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Main Grid View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-xs">
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-indigo-600 border-t-transparent"></div>
                <p className="mt-2 text-slate-400 font-semibold text-[10px]">Loading transactions...</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[9px]">
                  <th className="py-2.5 px-3 w-32">Member Code</th>
                  <th className="py-2.5 px-3">Member Details</th>
                  <th className="py-2.5 px-3">Book Details</th>
                  <th className="py-2.5 px-3 w-28 text-center">Issue Date</th>
                  <th className="py-2.5 px-3 w-28 text-center">Due Date</th>
                  {activeTab === 'history' && (
                    <th className="py-2.5 px-3 w-28 text-center">Return Date</th>
                  )}
                  <th className="py-2.5 px-3 w-24 text-center">
                    {activeTab === 'overdue' ? 'Days Overdue' : 'Fine'}
                  </th>
                  {activeTab === 'history' ? (
                    <th className="py-2.5 px-3 w-28 text-center">Status</th>
                  ) : (
                    <th className="py-2.5 px-3 w-24 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'history' ? 8 : 7} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-slate-50 text-slate-300 border border-slate-100">
                          <EmptyBookIcon className="w-8 h-8" />
                        </div>
                        <div className="font-semibold text-slate-700 text-xs mt-2">No transaction records</div>
                        <div className="text-slate-400 text-[10px]">No active checkouts found under this section</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition text-slate-700">
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center font-mono font-semibold text-slate-800 bg-slate-100/85 px-1.5 py-0.5 rounded border border-slate-200/50 text-[9px] uppercase tracking-wider">
                          {item.member_code}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800 text-[11px] leading-tight">{item.member_name}</div>
                        <div className="inline-flex items-center mt-0.5 text-[8px] font-semibold text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                          {item.member_type}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800 text-[11px] leading-tight">{item.book_title}</div>
                        <div className="text-[9px] text-slate-400 font-normal mt-0.5 font-mono">
                          Code: <span className="text-slate-500 font-medium">{item.book_code}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="font-mono text-[10px] text-slate-650 font-normal">{item.issue_date}</div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="font-mono text-[10px] text-slate-650 font-normal">{item.due_date}</div>
                      </td>
                      {activeTab === 'history' && (
                        <td className="py-2 px-3 text-center">
                          <div className="font-mono text-[10px] text-slate-600 font-normal">{item.return_date || '—'}</div>
                        </td>
                      )}
                      <td className="py-2 px-3 text-center">
                        {activeTab === 'overdue' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded font-semibold text-[9px] border border-rose-100">
                            {item.days_overdue} days
                          </span>
                        ) : (
                          <span className={`font-mono text-[10px] ${item.fine_accrued > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                            ₹{parseFloat(item.fine_accrued.toString()).toFixed(2)}
                          </span>
                        )}
                      </td>
                      
                      {activeTab === 'history' ? (
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider border ${
                            item.status === 'returned'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : item.status === 'lost'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : item.status === 'damaged'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      ) : (
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleQuickReturn(item)}
                            className="inline-flex items-center justify-center px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded font-semibold text-[9px] cursor-pointer transition-all duration-150 active:scale-[0.96]"
                          >
                            Return
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Checkout Issue Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-slideUp text-xs">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-200 text-slate-800">
              <h3 className="font-bold text-sm text-slate-800">Issue New Book Checkout</h3>
              <button 
                onClick={() => setIsIssueModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-all duration-150 text-sm p-1.5 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleIssueSubmit} className="p-5 space-y-4">
              
              {/* Member Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Library Member *</label>
                <Select
                  isLoading={loadingMembers}
                  value={eligibleMembers.find(m => m.value === issueFormData.library_member_id) || null}
                  onChange={(option) => setIssueFormData(prev => ({ ...prev, library_member_id: option ? option.value.toString() : '' }))}
                  options={eligibleMembers}
                  placeholder="Search active library members..."
                  styles={customSelectStyles}
                  isSearchable={true}
                  noOptionsMessage={() => "No members found"}
                />
              </div>

              {/* Book Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Book to Issue *</label>
                <Select
                  isLoading={loadingBooks}
                  value={eligibleBooks.find(b => b.value === issueFormData.book_id) || null}
                  onChange={(option) => setIssueFormData(prev => ({ ...prev, book_id: option ? option.value.toString() : '' }))}
                  options={eligibleBooks}
                  placeholder="Search available books..."
                  styles={customSelectStyles}
                  isSearchable={true}
                  noOptionsMessage={() => "No books available"}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueFormData.issue_date}
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all duration-150 text-xs font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    required
                    value={issueFormData.due_date}
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all duration-150 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Remarks / Note</label>
                <textarea
                  placeholder="Add checkout remarks..."
                  value={issueFormData.remarks}
                  onChange={(e) => setIssueFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs h-20 resize-none bg-slate-50/50 hover:bg-white focus:bg-white transition-all duration-150 placeholder-slate-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-100 transition-all duration-150 cursor-pointer"
                >
                  Issue Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkin Return Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-slideUp text-xs">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-200 text-slate-800">
              <h3 className="font-bold text-sm text-slate-800">Register Book Return</h3>
              <button 
                onClick={() => setIsReturnModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-all duration-150 text-sm p-1.5 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleReturnSubmit} className="p-5 space-y-4">
              
              {/* Select Active Borrowed Transaction */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Select Borrowed Book *</label>
                <Select
                  value={activeCheckoutOptions.find(o => o.value === returnFormData.checkout_id) || null}
                  onChange={(option) => {
                    const id = option ? option.value : '';
                    const match = transactions.find(t => t.id.toString() === id);
                    setReturnFormData(prev => ({ 
                      ...prev, 
                      checkout_id: id,
                      fine_amount: match ? match.fine_accrued : 0 
                    }));
                  }}
                  options={activeCheckoutOptions}
                  placeholder="Search active checkout logs..."
                  styles={customSelectStyles}
                  isSearchable={true}
                  noOptionsMessage={() => "No active checkouts found"}
                />
              </div>

              {/* Return Date & Return Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Return Date</label>
                  <input
                    type="date"
                    required
                    value={returnFormData.return_date}
                    onChange={(e) => setReturnFormData(prev => ({ ...prev, return_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all duration-150 text-xs font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Return Condition</label>
                  <select
                    value={returnFormData.status}
                    onChange={(e) => setReturnFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all duration-150 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="returned">Returned (Good)</option>
                    <option value="lost">Lost</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Real-time borrowing duration & fine display */}
              {currentCheckoutDetails && (
                <div className={`p-4 rounded-xl border leading-relaxed transition-all duration-150 text-xs ${
                  currentCheckoutDetails.calculatedFine > 0
                    ? 'bg-rose-50/50 border-rose-200 text-rose-950 shadow-sm shadow-rose-50'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Book Title</span>
                    <span className="font-bold text-right max-w-[200px] truncate">{currentCheckoutDetails.title}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Borrower</span>
                    <span className="font-medium text-right truncate max-w-[200px]">{currentCheckoutDetails.memberName} ({currentCheckoutDetails.memberCode})</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Due Date</span>
                    <span className="font-mono font-semibold">{currentCheckoutDetails.dueDate}</span>
                  </div>
                  <div className="h-px bg-slate-200/60 my-2"></div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Borrowed Duration</span>
                    <span className="font-bold">{currentCheckoutDetails.daysBorrowed} days</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Days Overdue</span>
                    <span className={`font-bold ${currentCheckoutDetails.daysOverdue > 0 ? 'text-rose-600 font-extrabold animate-pulse' : ''}`}>
                      {currentCheckoutDetails.daysOverdue} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Calculated Fine</span>
                    <span className={`font-extrabold text-sm ${currentCheckoutDetails.calculatedFine > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      ₹{parseFloat(currentCheckoutDetails.calculatedFine.toString()).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Fine Manual Override */}
              <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overrideFineCheckbox"
                    checked={returnFormData.override_fine}
                    onChange={(e) => setReturnFormData(prev => ({ ...prev, override_fine: e.target.checked }))}
                    className="rounded text-indigo-600 cursor-pointer h-4 w-4 border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="overrideFineCheckbox" className="font-bold text-slate-700 cursor-pointer text-xs select-none">
                    Override Fine Amount Manually
                  </label>
                </div>

                {returnFormData.override_fine && (
                  <div className="pt-2 animate-fadeIn">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Override Fine (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={returnFormData.fine_amount}
                      onChange={(e) => setReturnFormData(prev => ({ ...prev, fine_amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all duration-150 text-xs font-semibold text-slate-700"
                    />
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">Remarks / Note</label>
                <textarea
                  placeholder="Notes about return condition..."
                  value={returnFormData.remarks}
                  onChange={(e) => setReturnFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs h-20 resize-none bg-slate-50/50 hover:bg-white focus:bg-white transition-all duration-150 placeholder-slate-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-100 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-150 cursor-pointer"
                >
                  Complete Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookIssueReturnManager;
