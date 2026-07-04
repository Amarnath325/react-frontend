import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// Icons Matching Lucide / SVG Style
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

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const PinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

interface Reservation {
  id: number;
  book_id: number;
  book_title: string;
  book_code: string;
  library_member_id: number;
  member_code: string;
  member_type: string;
  member_name: string;
  reservation_date: string;
  valid_till_days: number;
  expiry_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'ready' | 'fulfilled' | 'cancelled' | 'expired';
  notes: string | null;
  created_at: string;
}

const BookReservationManager: React.FC = () => {
  type TabType = 'queues' | 'active' | 'history';
  const [activeTab, setActiveTab] = useState<TabType>('queues');
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Badge counts
  const [stats, setStats] = useState({
    queues: 0,
    active: 0,
    history: 0
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
  const [eligibleBooks, setEligibleBooks] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    library_member_id: '',
    book_id: '',
    reservation_date: new Date().toISOString().split('T')[0],
    valid_till_days: 5,
    priority: 'medium',
    notes: ''
  });

  useEffect(() => {
    fetchReservations();
    fetchStats();
  }, [activeTab]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/school/book-reservations', {
        params: { 
          tab: activeTab,
          search: searchTerm 
        }
      });
      if (response.data.success) {
        setReservations(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/school/book-reservations/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const loadResources = async () => {
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
      console.error('Error loading form options:', err);
      toast.error('Failed to load eligible books/members');
    } finally {
      setLoadingMembers(false);
      setLoadingBooks(false);
    }
  };

  const handleOpenModal = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setFormData({
      library_member_id: '',
      book_id: '',
      reservation_date: formattedDate,
      valid_till_days: 5,
      priority: 'medium',
      notes: ''
    });
    
    setIsModalOpen(true);
    loadResources();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.library_member_id) {
      toast.error('Please select a member');
      return;
    }
    if (!formData.book_id) {
      toast.error('Please select a book');
      return;
    }

    try {
      const response = await api.post('/school/book-reservations', {
        library_member_id: parseInt(formData.library_member_id),
        book_id: parseInt(formData.book_id),
        reservation_date: formData.reservation_date,
        valid_till_days: formData.valid_till_days,
        priority: formData.priority,
        notes: formData.notes
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Reservation created successfully!');
        setIsModalOpen(false);
        fetchReservations();
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      const msg = err.response?.data?.message || 'Failed to create reservation';
      toast.error(msg);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const response = await api.put(`/school/book-reservations/${id}/cancel`);
      if (response.data.success) {
        toast.success('Reservation cancelled successfully.');
        fetchReservations();
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error cancelling reservation:', err);
      const msg = err.response?.data?.message || 'Failed to cancel reservation';
      toast.error(msg);
    }
  };

  const handleFulfill = async (id: number) => {
    if (!window.confirm('Fulfill reservation and checkout/issue this book copy?')) return;
    try {
      const response = await api.put(`/school/book-reservations/${id}/fulfill`);
      if (response.data.success) {
        toast.success('Book checkout issued successfully!');
        fetchReservations();
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error fulfilling reservation:', err);
      const msg = err.response?.data?.message || 'Failed to fulfill reservation';
      toast.error(msg);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchReservations();
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    api.get('/school/book-reservations', {
      params: { 
        tab: activeTab,
        search: '' 
      }
    }).then(response => {
      if (response.data.success) {
        setReservations(response.data.data);
      }
    });
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return { dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'medium':
        return { dot: 'bg-yellow-500', bg: 'bg-yellow-50 text-yellow-700 border-yellow-100' };
      case 'low':
      default:
        return { dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-emerald-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-rose-500' }
  ];

  const formatPriorityLabel = ({ label, color }: any) => (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color}`}></span>
      <span className="text-xs">{label}</span>
    </div>
  );

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert YYYY-MM-DD to DD-MM-YYYY
    }
    return dateStr;
  };

  // Filter history records client-side if statusFilter dropdown is modified
  const getFilteredReservations = () => {
    if (activeTab !== 'history' || statusFilter === 'all') {
      return reservations;
    }
    return reservations.filter(r => r.status === statusFilter);
  };

  const displayReservations = getFilteredReservations();

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* Top Main Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200/80 bg-white px-2 shadow-xs rounded-t-xl">
        
        {/* Tab 1: Reservation Queues */}
        <button
          onClick={() => { setActiveTab('queues'); setStatusFilter('all'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'queues'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📋</span>
          <span>Reservation Queues</span>
          <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            activeTab === 'queues' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {stats.queues}
          </span>
        </button>

        {/* Tab 2: Active Reservations */}
        <button
          onClick={() => { setActiveTab('active'); setStatusFilter('all'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'active'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📌</span>
          <span>Active Reservations</span>
          <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            activeTab === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {stats.active}
          </span>
        </button>

        {/* Tab 3: Reservation History */}
        <button
          onClick={() => { setActiveTab('history'); setStatusFilter('all'); }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📜</span>
          <span>Reservation History</span>
          <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            activeTab === 'history' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {stats.history}
          </span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Search & Status Filters */}
        <div className="flex flex-1 items-center gap-2 max-w-xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search by book title, member name, or card..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none rounded-lg text-[11px] text-slate-700 font-medium transition-all duration-150 placeholder-slate-400"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-32">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition"
            >
              <option value="all">All Status</option>
              {activeTab === 'queues' && <option value="pending">Pending</option>}
              {activeTab === 'active' && <option value="ready">Ready</option>}
              {activeTab === 'history' && (
                <>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </>
              )}
            </select>
          </div>
        </div>
        
        {/* Buttons on Right */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[11px] font-semibold transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" /> New Reservation
          </button>

          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
          >
            Reset Filters
          </button>
          
          <button
            onClick={() => {
              fetchReservations();
              fetchStats();
            }}
            className="flex items-center justify-center p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-[11px] font-semibold text-slate-700 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
            title="Refresh logs"
          >
            <RefreshIcon className="w-3.5 h-3.5 text-slate-500" />
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
                <p className="mt-2 text-slate-400 font-semibold text-[10px]">Loading reservations...</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[9px]">
                  <th className="py-2.5 px-3 w-32 whitespace-nowrap">Member Code</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Member Name</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Book Details</th>
                  <th className="py-2.5 px-3 w-32 text-center whitespace-nowrap">Reservation Date</th>
                  <th className="py-2.5 px-3 w-32 text-center whitespace-nowrap">Expiry Date</th>
                  <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Priority</th>
                  {activeTab === 'history' ? (
                    <th className="py-2.5 px-3 w-32 text-center whitespace-nowrap">Status</th>
                  ) : (
                    <th className="py-2.5 px-3 w-32 text-center whitespace-nowrap">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-2.5 rounded-full bg-slate-50 text-slate-300 border border-slate-100">
                          <EmptyBoxIcon className="w-7 h-7" />
                        </div>
                        <div className="font-semibold text-slate-700 text-xs mt-1">No reservations found</div>
                        <div className="text-slate-400 text-[10px]">No records match the active filters or tab.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayReservations.map((item) => {
                    const priStyle = getPriorityStyle(item.priority);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/20 transition text-slate-700">
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 text-[9px] uppercase tracking-wider">
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
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                            Code: <span className="text-slate-550 font-medium">{item.book_code}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="font-mono text-[10px] text-slate-600">{formatDisplayDate(item.reservation_date)}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="font-mono text-[10px] text-slate-600">{formatDisplayDate(item.expiry_date) || '—'}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold capitalize border ${priStyle.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priStyle.dot}`}></span>
                            {item.priority}
                          </span>
                        </td>
                        {activeTab === 'history' ? (
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider border ${
                              item.status === 'fulfilled'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : item.status === 'cancelled'
                                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        ) : (
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {item.status === 'ready' && (
                                <button
                                  onClick={() => handleFulfill(item.id)}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-semibold tracking-wide shadow-xs transition duration-150 cursor-pointer"
                                >
                                  Fulfill
                                </button>
                              )}
                              <button
                                onClick={() => handleCancel(item.id)}
                                className="px-2 py-0.5 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded text-[9px] font-semibold tracking-wide transition duration-150 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 font-semibold text-xs tracking-wide">
                <PinIcon className="w-4 h-4 text-white" />
                <span>Create New Reservation</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-slate-200 transition-colors text-sm font-bold p-0.5 cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs text-slate-700">
              
              {/* Member Dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Member *</label>
                <Select
                  isLoading={loadingMembers}
                  value={eligibleMembers.find(m => m.value.toString() === formData.library_member_id) || null}
                  onChange={(option) => setFormData(prev => ({ ...prev, library_member_id: option ? option.value.toString() : '' }))}
                  options={eligibleMembers}
                  placeholder="Search by name or member ID..."
                  styles={customSelectStyles}
                  isSearchable={true}
                  noOptionsMessage={() => "No members found"}
                />
              </div>

              {/* Book Dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Book *</label>
                <Select
                  isLoading={loadingBooks}
                  value={eligibleBooks.find(b => b.value.toString() === formData.book_id) || null}
                  onChange={(option) => setFormData(prev => ({ ...prev, book_id: option ? option.value.toString() : '' }))}
                  options={eligibleBooks}
                  placeholder="Search by title, ISBN, or author..."
                  styles={customSelectStyles}
                  isSearchable={true}
                  noOptionsMessage={() => "No books available"}
                />
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reservation Date</label>
                  <input
                    type="text"
                    readOnly
                    value={formatDisplayDate(formData.reservation_date)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-[11px] font-medium text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Valid Till (Days)</label>
                  <select
                    value={formData.valid_till_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_till_days: parseInt(e.target.value) }))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-[11px] bg-white font-medium text-slate-700 transition"
                  >
                    <option value={5}>5 days</option>
                    <option value={10}>10 days</option>
                    <option value={15}>15 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Priority</label>
                <Select
                  value={priorityOptions.find(p => p.value === formData.priority) || null}
                  onChange={(option) => setFormData(prev => ({ ...prev, priority: option ? option.value : 'medium' }))}
                  options={priorityOptions}
                  styles={customSelectStyles}
                  formatOptionLabel={formatPriorityLabel}
                  isSearchable={false}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Notes (Optional)</label>
                <textarea
                  placeholder="Any special requests or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-[11px] h-16 resize-none bg-slate-50/30 hover:bg-white focus:bg-white transition placeholder-slate-400"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-650 font-bold hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Create Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookReservationManager;
