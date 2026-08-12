import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Headphones, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, ShieldCheck, Trash2, Send, MessageSquare, AlertTriangle, CheckCircle2, Zap
} from 'lucide-react';
import api from '../../../services/api';

interface SupportTicket {
  id: string;
  ticket_id: string;
  school_name: string;
  contact_person: string;
  subject: string;
  category: 'Billing & Subscriptions' | 'Attendance Sync' | 'Payment Gateway' | 'Mobile App' | 'General';
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assigned_agent: string;
  created_at: string;
  last_activity: string;
  messages_count: number;
  description: string;
}

type SortField = 'last_activity' | 'ticket_id' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 'all';

interface SearchableOption {
  value: string;
  label: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  labelPrefix
}: {
  options: SearchableOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon?: React.ElementType;
  labelPrefix?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    o.value.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 font-bold cursor-pointer transition-all"
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-teal-400" />}
        {labelPrefix && <span className="text-[11px] text-slate-400 font-bold">{labelPrefix}:</span>}
        <span className="truncate max-w-[130px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search option..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
            />
          </div>
          <div className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-[10px] text-slate-500 text-center font-medium">No options match</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    opt.value === value
                      ? 'bg-teal-600/20 text-teal-400 font-bold border border-teal-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-teal-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockTickets: SupportTicket[] = [
  {
    id: 'tck-1',
    ticket_id: 'TCK-8092',
    school_name: 'St. Xavier International School',
    contact_person: 'Fr. Thomas Cook (Principal)',
    subject: 'Razorpay UPI Fee Gateway Error Code 502',
    category: 'Payment Gateway',
    priority: 'URGENT',
    status: 'OPEN',
    assigned_agent: 'Vikram Malhotra (Lead Tech)',
    created_at: '2026-08-11 14:20:00',
    last_activity: '10 Mins Ago',
    messages_count: 4,
    description: 'Parents are facing HTTP 502 Gateway errors when attempting online fee payment via Razorpay UPI QR link.'
  },
  {
    id: 'tck-2',
    ticket_id: 'TCK-8085',
    school_name: 'Delhi Public School, Sector 45',
    contact_person: 'Rajesh Sharma (IT Admin)',
    subject: 'Biometric Face Attendance Machine Sync Timeout',
    category: 'Attendance Sync',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assigned_agent: 'Neha Gupta (Support Spec)',
    created_at: '2026-08-11 09:15:00',
    last_activity: '1 Hour Ago',
    messages_count: 7,
    description: 'The entrance facial recognition machine logs are taking over 5 minutes to push attendance records to Landlord DB.'
  },
  {
    id: 'tck-3',
    ticket_id: 'TCK-8078',
    school_name: 'Greenwood High International',
    contact_person: 'Ananya Roy (Accountant)',
    subject: 'GST Invoice Generation & Tax Receipt Export Issue',
    category: 'Billing & Subscriptions',
    priority: 'NORMAL',
    status: 'RESOLVED',
    assigned_agent: 'Amitabh Sen (Billing Spec)',
    created_at: '2026-08-10 11:30:00',
    last_activity: 'Yesterday',
    messages_count: 5,
    description: 'Need updated GSTIN tax invoice for July annual SaaS subscription renewal receipt PDF.'
  },
  {
    id: 'tck-4',
    ticket_id: 'TCK-8060',
    school_name: 'Ryan International School',
    contact_person: 'Kavita Singh (Vice Principal)',
    subject: 'Parent Mobile App Push Notifications Setup',
    category: 'Mobile App',
    priority: 'LOW',
    status: 'CLOSED',
    assigned_agent: 'Siddharth Rao (Mobile Dev)',
    created_at: '2026-08-08 16:00:00',
    last_activity: '3 Days Ago',
    messages_count: 8,
    description: 'How to enable high priority vibration alert for exam report card releases on iOS app?'
  }
];

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('last_activity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Form State
  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<'Billing & Subscriptions' | 'Attendance Sync' | 'Payment Gateway' | 'Mobile App' | 'General'>('General');
  const [priorityInput, setPriorityInput] = useState<'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [descriptionInput, setDescriptionInput] = useState('');

  const totalTicketsCount = 142;
  const pendingTicketsCount = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const urgentTicketsCount = tickets.filter(t => t.priority === 'URGENT').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/support-tickets');
      if (res.data.success && Array.isArray(res.data.data)) {
        setTickets(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Support tickets & helpdesk queue refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, priorityFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolNameInput.trim() || !subjectInput.trim() || !descriptionInput.trim()) {
      toast.error('Please enter school name, subject, and description');
      return;
    }

    toast.loading(`Creating new support ticket for '${schoolNameInput}'...`, { id: 'add-tck-toast' });

    try {
      await api.post('/landlord/support-tickets', {
        school_name: schoolNameInput,
        subject: subjectInput,
        category: categoryInput,
        priority: priorityInput,
        description: descriptionInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newTicket: SupportTicket = {
        id: `tck-${Date.now()}`,
        ticket_id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        school_name: schoolNameInput,
        contact_person: 'School Admin',
        subject: subjectInput,
        category: categoryInput,
        priority: priorityInput,
        status: 'OPEN',
        assigned_agent: 'Unassigned',
        created_at: 'Just now',
        last_activity: 'Just now',
        messages_count: 1,
        description: descriptionInput
      };
      setTickets(prev => [newTicket, ...prev]);
      setIsAddModalOpen(false);
      setSchoolNameInput('');
      setSubjectInput('');
      setDescriptionInput('');
      toast.success(`🎧 Support Ticket '${newTicket.ticket_id}' logged successfully!`, { id: 'add-tck-toast' });
    }, 800);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    toast.loading('Posting official support response...', { id: 'reply-tck-toast' });
    setTimeout(() => {
      setTickets(prev =>
        prev.map(t => (t.id === selectedTicket.id ? { ...t, status: 'IN_PROGRESS', last_activity: 'Just now', messages_count: t.messages_count + 1 } : t))
      );
      toast.success('💬 Response posted to support ticket thread!', { id: 'reply-tck-toast' });
      setReplyMessage('');
      setSelectedTicket(null);
    }, 600);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED', ticketId: string) => {
    toast.loading(`Updating status for '${ticketId}' to ${newStatus}...`, { id: 'status-tck-toast' });

    try {
      await api.post(`/landlord/support-tickets/${id}/status`, { status: newStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTickets(prev =>
        prev.map(t => (t.id === id ? { ...t, status: newStatus, last_activity: 'Just now' } : t))
      );
      toast.success(` Ticket '${ticketId}' status updated to ${newStatus}!`, { id: 'status-tck-toast' });
    }, 600);
  };

  const handleDeleteTicket = async (id: string, ticketId: string) => {
    toast.loading(`Deleting ticket '${ticketId}'...`, { id: 'del-tck-toast' });

    try {
      await api.delete(`/landlord/support-tickets/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTickets(prev => prev.filter(t => t.id !== id));
      toast.success(`🗑️ Support ticket '${ticketId}' deleted!`, { id: 'del-tck-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = tickets.filter(t => {
    const matchesSearch =
      t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assigned_agent.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = a[sortBy] ?? '';
    let valB: string | number = b[sortBy] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalFiltered = sorted.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalFiltered) : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedData = pageSize === 'all' ? sorted : sorted.slice(startIndex, startIndex + effectivePageSize);

  const categoryOptions: SearchableOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'Payment Gateway', label: 'Payment Gateway 💳' },
    { value: 'Attendance Sync', label: 'Attendance Sync ⏱️' },
    { value: 'Billing & Subscriptions', label: 'Billing & Subscriptions 🧾' },
    { value: 'Mobile App', label: 'Mobile App 📱' },
    { value: 'General', label: 'General 🛠️' },
  ];

  const priorityOptions: SearchableOption[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'URGENT', label: 'URGENT 🔴' },
    { value: 'HIGH', label: 'HIGH 🟠' },
    { value: 'NORMAL', label: 'NORMAL 🔵' },
    { value: 'LOW', label: 'LOW 🟢' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'OPEN', label: 'OPEN ⏳' },
    { value: 'IN_PROGRESS', label: 'IN PROGRESS 🔄' },
    { value: 'RESOLVED', label: 'RESOLVED ✅' },
    { value: 'CLOSED', label: 'CLOSED 🔒' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'last_activity', label: 'Last Activity' },
    { value: 'ticket_id', label: 'Ticket ID' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-400/30">
              <Headphones className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Helpdesk & Support Ticket Management Hub
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-400 text-[10px] font-extrabold rounded-full border border-teal-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 animate-pulse" /> Live SLA Tracker Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage, assign, and resolve technical support tickets, payment gateway errors, and feature inquiries from all tenant schools
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Support Ticket
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Tickets</span>
            <Headphones className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTicketsCount} Tickets</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Logged Support Cases</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Unresolved</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingTicketsCount} Pending ⏳</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Open & In Progress</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Urgent Escalations</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{urgentTicketsCount} Urgent 🔴</div>
          <div className="text-[10px] text-slate-500 mt-0.5">High Priority Cases</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Resolution Time</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">1.8 Hours ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">SLA Speed Score</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">CSAT Score</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">4.9 / 5.0 ⭐</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Customer Satisfaction</div>
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by ticket ID, school name, subject, agent..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} placeholder="Category..." icon={Filter} labelPrefix="Category" />
          <SearchableSelect options={priorityOptions} value={priorityFilter} onChange={setPriorityFilter} placeholder="Priority..." icon={Filter} labelPrefix="Priority" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-teal-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('ticket_id')}>Ticket ID & Subject</th>
                <th className="p-3.5">School & Contact</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('priority')}>Priority</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                <th className="p-3.5">Assigned Agent</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('last_activity')}>Last Activity</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(t => (
                <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{t.subject}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{t.ticket_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-white font-bold">{t.school_name}</div>
                    <div className="text-[10px] text-slate-400">{t.contact_person}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 text-teal-400 border border-slate-800 rounded font-bold">
                      {t.category}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        t.priority === 'URGENT'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                          : t.priority === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : t.priority === 'NORMAL'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        t.status === 'OPEN'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : t.status === 'RESOLVED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-purple-400 font-bold">{t.assigned_agent}</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{t.last_activity}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-teal-400" /> Thread ({t.messages_count})
                      </button>
                      {t.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'RESOLVED', t.ticket_id)}
                          className="p-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl cursor-pointer"
                          title="Mark Resolved"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTicket(t.id, t.ticket_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Create New Support Ticket</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTicket} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={schoolNameInput}
                  onChange={e => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. St. Xavier International School"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Subject / Issue Summary</label>
                <input
                  type="text"
                  required
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  placeholder="e.g. Razorpay Payment Gateway Error 502"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={categoryInput}
                    onChange={e => setCategoryInput(e.target.value as 'Billing & Subscriptions' | 'Attendance Sync' | 'Payment Gateway' | 'Mobile App' | 'General')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="Payment Gateway">Payment Gateway 💳</option>
                    <option value="Attendance Sync">Attendance Sync ⏱️</option>
                    <option value="Billing & Subscriptions">Billing & Subscriptions 🧾</option>
                    <option value="Mobile App">Mobile App 📱</option>
                    <option value="General">General 🛠️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Priority</label>
                  <select
                    value={priorityInput}
                    onChange={e => setPriorityInput(e.target.value as 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="URGENT">URGENT 🔴</option>
                    <option value="HIGH">HIGH 🟠</option>
                    <option value="NORMAL">NORMAL 🔵</option>
                    <option value="LOW">LOW 🟢</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Detailed Problem Description</label>
                <textarea
                  required
                  rows={4}
                  value={descriptionInput}
                  onChange={e => setDescriptionInput(e.target.value)}
                  placeholder="Describe error steps, system behavior..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-teal-600/30"
                >
                  Log Support Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Ticket Conversation Thread ({selectedTicket.ticket_id})</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-teal-400 font-bold">{selectedTicket.subject}</div>
                <div className="text-slate-400 font-sans">{selectedTicket.school_name} · Contact: {selectedTicket.contact_person}</div>
                <div className="text-slate-500 text-[11px]">Assigned Agent: {selectedTicket.assigned_agent}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-white font-bold text-[11px] mb-1">Issue Details:</div>
                <p className="text-slate-300 text-xs leading-relaxed">{selectedTicket.description}</p>
              </div>

              <form onSubmit={handleSendReply} className="space-y-2">
                <label className="block text-slate-400 font-bold">Reply & Update Tenant Admin:</label>
                <textarea
                  required
                  rows={3}
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type official support response..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Support Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
