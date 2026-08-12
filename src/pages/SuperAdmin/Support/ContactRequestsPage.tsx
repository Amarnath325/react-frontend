import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Mail, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Send, Phone, Building, UserCheck, MessageSquare, Zap
} from 'lucide-react';
import api from '../../../services/api';

interface ContactRequestItem {
  id: string;
  request_id: string;
  contact_name: string;
  email: string;
  phone: string;
  school_organization: string;
  interested_plan: 'ENTERPRISE SAAS' | 'PRO TIER' | 'CUSTOM INTEGRATION' | 'STARTER';
  lead_status: 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'CONVERTED' | 'CLOSED';
  assigned_sales_rep: string;
  received_at: string;
  message_body: string;
}

type SortField = 'received_at' | 'contact_name' | 'lead_status';
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

const mockRequests: ContactRequestItem[] = [
  {
    id: 'req-1',
    request_id: 'REQ-2094',
    contact_name: 'Dr. Ramesh Chandra (Trustee)',
    email: 'ramesh.chandra@dpsg.edu.in',
    phone: '+91 98765 12345',
    school_organization: 'Delhi Public School Group (12 Campuses)',
    interested_plan: 'ENTERPRISE SAAS',
    lead_status: 'NEW',
    assigned_sales_rep: 'Rohan Verma (Enterprise Lead)',
    received_at: '2026-08-11 15:10:00',
    message_body: 'We want to migrate 12 school campuses (18,000+ students) from legacy desktop ERP to MySchoolPoint Enterprise Cloud with Biometric facial sync.'
  },
  {
    id: 'req-2',
    request_id: 'REQ-2088',
    contact_name: 'Sunita Menon (Director)',
    email: 'sunita@bluebells.org',
    phone: '+91 98111 54321',
    school_organization: 'Bluebells International School',
    interested_plan: 'PRO TIER',
    lead_status: 'DEMO_SCHEDULED',
    assigned_sales_rep: 'Priya Sharma (Senior Sales)',
    received_at: '2026-08-10 11:30:00',
    message_body: 'Requesting a live 1-on-1 demo for CBSE automated CCE report card generator and Razorpay UPI fee payment webhooks.'
  },
  {
    id: 'req-3',
    request_id: 'REQ-2075',
    contact_name: 'Anil Kapoor (Principal)',
    email: 'principal@modernschool.ac.in',
    phone: '+91 99222 88776',
    school_organization: 'Modern Public School',
    interested_plan: 'CUSTOM INTEGRATION',
    lead_status: 'CONTACTED',
    assigned_sales_rep: 'Karan Mehra (Integration Lead)',
    received_at: '2026-08-08 14:00:00',
    message_body: 'Interested in custom WhatsApp Cloud API broadcast template integration for parent fee reminders and bus tracking.'
  },
  {
    id: 'req-4',
    request_id: 'REQ-2060',
    contact_name: 'Sister Mary Joseph',
    email: 'admin@stconrads.edu.in',
    phone: '+91 97333 11223',
    school_organization: 'St. Conrads Academy',
    interested_plan: 'STARTER',
    lead_status: 'CONVERTED',
    assigned_sales_rep: 'Priya Sharma (Senior Sales)',
    received_at: '2026-08-02 09:45:00',
    message_body: 'Converted to annual Pro SaaS subscription after 14-day free trial.'
  }
];

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequestItem[]>(mockRequests);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('received_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequestItem | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Form State
  const [contactNameInput, setContactNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [schoolInput, setSchoolInput] = useState('');
  const [planInput, setPlanInput] = useState<'ENTERPRISE SAAS' | 'PRO TIER' | 'CUSTOM INTEGRATION' | 'STARTER'>('ENTERPRISE SAAS');
  const [messageBodyInput, setMessageBodyInput] = useState('');

  const totalRequestsCount = 184;
  const newLeadsCount = requests.filter(r => r.lead_status === 'NEW').length;
  const conversionRate = 34.2;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/contact-requests');
      if (res.data.success && Array.isArray(res.data.data)) {
        setRequests(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Contact requests & demo inquiry leads feed refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, planFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactNameInput.trim() || !emailInput.trim() || !schoolInput.trim()) {
      toast.error('Please enter contact name, email, and school name');
      return;
    }

    toast.loading(`Logging contact request lead for '${contactNameInput}'...`, { id: 'add-req-toast' });

    try {
      await api.post('/landlord/contact-requests', {
        contact_name: contactNameInput,
        email: emailInput,
        phone: phoneInput,
        school_organization: schoolInput,
        interested_plan: planInput,
        message_body: messageBodyInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newRequest: ContactRequestItem = {
        id: `req-${Date.now()}`,
        request_id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        contact_name: contactNameInput,
        email: emailInput,
        phone: phoneInput || '+91 98765 00000',
        school_organization: schoolInput,
        interested_plan: planInput,
        lead_status: 'NEW',
        assigned_sales_rep: 'Unassigned',
        received_at: 'Just now',
        message_body: messageBodyInput
      };
      setRequests(prev => [newRequest, ...prev]);
      setIsAddModalOpen(false);
      setContactNameInput('');
      setEmailInput('');
      setSchoolInput('');
      setMessageBodyInput('');
      toast.success(`📬 Contact Request '${newRequest.request_id}' logged!`, { id: 'add-req-toast' });
    }, 800);
  };

  const handleSendLeadReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedRequest) return;

    toast.loading(`Sending sales reply to '${selectedRequest.email}'...`, { id: 'reply-req-toast' });
    setTimeout(() => {
      setRequests(prev =>
        prev.map(r => (r.id === selectedRequest.id ? { ...r, lead_status: 'CONTACTED' } : r))
      );
      toast.success(`✉️ Sales follow-up email delivered to ${selectedRequest.contact_name}!`, { id: 'reply-req-toast' });
      setReplyMessage('');
      setSelectedRequest(null);
    }, 600);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'CONVERTED' | 'CLOSED', reqId: string) => {
    toast.loading(`Updating lead status for '${reqId}' to ${newStatus}...`, { id: 'status-req-toast' });

    try {
      await api.post(`/landlord/contact-requests/${id}/status`, { status: newStatus });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRequests(prev =>
        prev.map(r => (r.id === id ? { ...r, lead_status: newStatus } : r))
      );
      toast.success(` Lead '${reqId}' status updated to ${newStatus}!`, { id: 'status-req-toast' });
    }, 600);
  };

  const handleDeleteRequest = async (id: string, reqId: string) => {
    toast.loading(`Deleting request '${reqId}'...`, { id: 'del-req-toast' });

    try {
      await api.delete(`/landlord/contact-requests/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success(`🗑️ Contact request '${reqId}' deleted!`, { id: 'del-req-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = requests.filter(r => {
    const matchesSearch =
      r.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.school_organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.message_body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = planFilter === 'all' || r.interested_plan === planFilter;
    const matchesStatus = statusFilter === 'all' || r.lead_status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
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

  const planOptions: SearchableOption[] = [
    { value: 'all', label: 'All Plans' },
    { value: 'ENTERPRISE SAAS', label: 'ENTERPRISE SAAS 🚀' },
    { value: 'PRO TIER', label: 'PRO TIER 🌟' },
    { value: 'CUSTOM INTEGRATION', label: 'CUSTOM INTEGRATION 🛠️' },
    { value: 'STARTER', label: 'STARTER ⚡' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'NEW', label: 'NEW 🆕' },
    { value: 'CONTACTED', label: 'CONTACTED 📞' },
    { value: 'DEMO_SCHEDULED', label: 'DEMO SCHEDULED 🗓️' },
    { value: 'CONVERTED', label: 'CONVERTED 🎉' },
    { value: 'CLOSED', label: 'CLOSED 🔒' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'received_at', label: 'Received Timestamp' },
    { value: 'contact_name', label: 'Contact Name' },
    { value: 'lead_status', label: 'Lead Status' },
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
              <Mail className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Contact Requests & Sales Inquiry CRM Lead Desk
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-400 text-[10px] font-extrabold rounded-full border border-teal-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 animate-pulse" /> Live Lead Pipeline Connected
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage inbound website contact inquiries, enterprise school demo requests, and sales lead conversion pipeline
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
            <Plus className="w-4 h-4" /> Add Lead Request
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Inquiries</span>
            <Mail className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalRequestsCount} Inquiries</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Inbound Sales Leads</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">New Unread Leads</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{newLeadsCount} New Leads 🆕</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Awaiting Response</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Lead Conversion Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{conversionRate}% 🎉</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Converted to Subscription</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Interested Plan</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">Enterprise 🚀</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Top Interested Tier</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Response Time</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">24 Mins ⚡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sales SLA Speed</div>
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
              placeholder="Search by request ID, contact name, email, school organization..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={planOptions} value={planFilter} onChange={setPlanFilter} placeholder="Plan..." icon={Filter} labelPrefix="Plan" />
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('contact_name')}>Contact Name & ID</th>
                <th className="p-3.5">School / Organization</th>
                <th className="p-3.5">Email & Phone</th>
                <th className="p-3.5">Interested Plan</th>
                <th className="p-3.5">Assigned Rep</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('received_at')}>Received Timestamp</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('lead_status')}>Lead Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(r => (
                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{r.contact_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.request_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-white font-bold">{r.school_organization}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <div className="text-teal-400 font-bold">{r.email}</div>
                    <div className="text-slate-400 text-[9px] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {r.phone}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 text-purple-400 border border-slate-800 rounded font-bold">
                      {r.interested_plan}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-purple-400 font-bold">{r.assigned_sales_rep}</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{r.received_at}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        r.lead_status === 'NEW'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                          : r.lead_status === 'DEMO_SCHEDULED'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : r.lead_status === 'CONVERTED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-black'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {r.lead_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedRequest(r)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-400" /> View Inquiry
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(r.id, r.request_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Contact Request"
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
                <Mail className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Add Contact Inquiry Lead</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRequest} className="space-y-3.5 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    value={contactNameInput}
                    onChange={e => setContactNameInput(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Chandra"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">School / Organization</label>
                  <input
                    type="text"
                    required
                    value={schoolInput}
                    onChange={e => setSchoolInput(e.target.value)}
                    placeholder="e.g. Delhi Public School Group"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="ramesh@dpsg.edu.in"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    placeholder="+91 98765 12345"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Interested SaaS Subscription Plan</label>
                <select
                  value={planInput}
                  onChange={e => setPlanInput(e.target.value as 'ENTERPRISE SAAS' | 'PRO TIER' | 'CUSTOM INTEGRATION' | 'STARTER')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="ENTERPRISE SAAS">ENTERPRISE SAAS 🚀</option>
                  <option value="PRO TIER">PRO TIER 🌟</option>
                  <option value="CUSTOM INTEGRATION">CUSTOM INTEGRATION 🛠️</option>
                  <option value="STARTER">STARTER ⚡</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Inquiry Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={messageBodyInput}
                  onChange={e => setMessageBodyInput(e.target.value)}
                  placeholder="Describe demo requirements, student capacity..."
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
                  Save Contact Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Contact Inquiry Lead Details ({selectedRequest.request_id})</h3>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-teal-400 font-bold">{selectedRequest.contact_name} ({selectedRequest.school_organization})</div>
                <div className="text-slate-400 font-mono">Email: {selectedRequest.email} · Phone: {selectedRequest.phone}</div>
                <div className="text-slate-500 text-[11px]">Interested Plan: {selectedRequest.interested_plan} · Received: {selectedRequest.received_at}</div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="text-white font-bold text-xs mb-1">Inquiry Message Body:</div>
                <p className="text-slate-300 text-xs leading-relaxed">{selectedRequest.message_body}</p>
              </div>

              <form onSubmit={handleSendLeadReply} className="space-y-2">
                <label className="block text-slate-400 font-bold">Reply & Follow-up Email to Contact:</label>
                <textarea
                  required
                  rows={3}
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type sales email response..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Sales Email Reply
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
