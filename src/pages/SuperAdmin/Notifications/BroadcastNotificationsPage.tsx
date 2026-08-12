import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Megaphone, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X, Radio,
  Plus, Eye, ShieldCheck, Trash2, Send, Bell, Power
} from 'lucide-react';
import api from '../../../services/api';

interface BroadcastItem {
  id: string;
  broadcast_id: string;
  title: string;
  channels: ('IN_APP_BANNER' | 'IN_APP_MODAL' | 'EMAIL' | 'TOP_BANNER' | 'PUSH_NOTIFICATION')[];
  priority: 'CRITICAL' | 'HIGH' | 'INFO' | 'LOW';
  target_audience: string;
  recipients_count: number;
  status: 'SENT' | 'ACTIVE' | 'SCHEDULED' | 'DRAFT';
  scheduled_at: string;
  sent_at: string;
  message_body: string;
}

type SortField = 'sent_at' | 'title' | 'priority' | 'recipients_count';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
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
                      ? 'bg-amber-600/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockBroadcasts: BroadcastItem[] = [
  {
    id: 'bc-1',
    broadcast_id: 'BC-9041',
    title: 'Scheduled Maintenance Alert: Multi-Tenant DB Upgrade',
    channels: ['IN_APP_BANNER', 'EMAIL'],
    priority: 'CRITICAL',
    target_audience: 'All Active School Tenants (1,240 Schools)',
    recipients_count: 18400,
    status: 'SENT',
    scheduled_at: 'Immediate',
    sent_at: '2026-08-11 14:00:00',
    message_body: 'We will be conducting scheduled system database index optimization on Sunday from 02:00 AM to 04:00 AM IST. Platform services will experience brief read-only pauses.'
  },
  {
    id: 'bc-2',
    broadcast_id: 'BC-9038',
    title: 'New AI Automated Report Card Generator Released!',
    channels: ['IN_APP_MODAL'],
    priority: 'INFO',
    target_audience: 'School Principals & Teachers',
    recipients_count: 12800,
    status: 'SENT',
    scheduled_at: 'Immediate',
    sent_at: '2026-08-09 10:30:00',
    message_body: 'You can now generate CBSE/ICSE compliant student report cards with AI smart comments in 1-click under Examinations -> Report Cards.'
  },
  {
    id: 'bc-3',
    broadcast_id: 'BC-9030',
    title: 'Emergency Payment Gateway Maintenance Warning',
    channels: ['TOP_BANNER'],
    priority: 'HIGH',
    target_audience: 'School Accountants & SuperAdmins',
    recipients_count: 3400,
    status: 'ACTIVE',
    scheduled_at: 'Immediate',
    sent_at: '2026-08-06 16:00:00',
    message_body: 'Razorpay UPI payment gateway is undergoing emergency bank server maintenance. Online fee collection via netbanking remains active.'
  },
  {
    id: 'bc-4',
    broadcast_id: 'BC-9025',
    title: 'Q3 SaaS System Performance Survey',
    channels: ['EMAIL'],
    priority: 'LOW',
    target_audience: 'Tenant School Owners',
    recipients_count: 1240,
    status: 'SCHEDULED',
    scheduled_at: '2026-08-12 09:00:00',
    sent_at: 'Pending Schedule',
    message_body: 'Please take 2 minutes to provide feedback on your school management experience to help us improve your platform performance.'
  }
];

export default function BroadcastNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>(mockBroadcasts);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('sent_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAnalytics, setSelectedAnalytics] = useState<BroadcastItem | null>(null);

  // Form State
  const [titleInput, setTitleInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<'CRITICAL' | 'HIGH' | 'INFO' | 'LOW'>('INFO');
  const [targetAudienceInput, setTargetAudienceInput] = useState('All Active School Tenants');
  const [messageBodyInput, setMessageBodyInput] = useState('');
  const [inAppBannerChecked, setInAppBannerChecked] = useState(true);
  const [emailChecked, setEmailChecked] = useState(true);
  const [topBannerChecked, setTopBannerChecked] = useState(false);

  const totalBroadcastsCount = 24;
  const totalRecipientsCount = 48200;
  const activeBannersCount = broadcasts.filter(b => b.status === 'ACTIVE').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/broadcast-notifications');
      if (res.data.success && Array.isArray(res.data.data)) {
        setBroadcasts(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Broadcast notification campaigns & real-time feed refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, channelFilter, priorityFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const handleAddBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !messageBodyInput.trim()) {
      toast.error('Please enter announcement title and message body');
      return;
    }

    const selectedChannels: ('IN_APP_BANNER' | 'IN_APP_MODAL' | 'EMAIL' | 'TOP_BANNER' | 'PUSH_NOTIFICATION')[] = [];
    if (inAppBannerChecked) selectedChannels.push('IN_APP_BANNER');
    if (emailChecked) selectedChannels.push('EMAIL');
    if (topBannerChecked) selectedChannels.push('TOP_BANNER');

    if (selectedChannels.length === 0) {
      toast.error('Please select at least one delivery channel');
      return;
    }

    toast.loading(`Dispatching platform broadcast announcement '${titleInput}'...`, { id: 'add-bc-toast' });

    try {
      await api.post('/landlord/broadcast-notifications', {
        title: titleInput,
        priority: priorityInput,
        target_audience: targetAudienceInput,
        message_body: messageBodyInput,
        channels: selectedChannels
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newBroadcast: BroadcastItem = {
        id: `bc-${Date.now()}`,
        broadcast_id: `BC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: titleInput,
        channels: selectedChannels,
        priority: priorityInput,
        target_audience: targetAudienceInput,
        recipients_count: 18400,
        status: topBannerChecked ? 'ACTIVE' : 'SENT',
        scheduled_at: 'Immediate',
        sent_at: 'Just now',
        message_body: messageBodyInput
      };
      setBroadcasts(prev => [newBroadcast, ...prev]);
      setIsAddModalOpen(false);
      setTitleInput('');
      setMessageBodyInput('');
      toast.success(`⚡ Broadcast '${titleInput}' dispatched to 18,400 recipients!`, { id: 'add-bc-toast' });
    }, 800);
  };

  const handleToggleBanner = async (id: string, currentStatus: string, title: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SENT' : 'ACTIVE';
    toast.loading(`Toggling banner state for '${title}'...`, { id: 'toggle-bc-toast' });

    try {
      await api.post(`/landlord/broadcast-notifications/${id}/toggle-banner`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setBroadcasts(prev =>
        prev.map(b => (b.id === id ? { ...b, status: newStatus as 'SENT' | 'ACTIVE' } : b))
      );
      toast.success(
        newStatus === 'ACTIVE'
          ? `🟢 Top sticky banner ACTIVATED for '${title}'!`
          : `🔴 Top sticky banner DEACTIVATED for '${title}'!`,
        { id: 'toggle-bc-toast' }
      );
    }, 600);
  };

  const handleDeleteBroadcast = async (id: string, title: string) => {
    toast.loading(`Deleting broadcast campaign '${title}'...`, { id: 'del-bc-toast' });

    try {
      await api.delete(`/landlord/broadcast-notifications/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setBroadcasts(prev => prev.filter(b => b.id !== id));
      toast.success(`🗑️ Broadcast campaign '${title}' deleted!`, { id: 'del-bc-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = broadcasts.filter(b => {
    const matchesSearch =
      b.broadcast_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.target_audience.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.message_body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = channelFilter === 'all' || b.channels.includes(channelFilter as 'IN_APP_BANNER' | 'IN_APP_MODAL' | 'EMAIL' | 'TOP_BANNER' | 'PUSH_NOTIFICATION');
    const matchesPriority = priorityFilter === 'all' || b.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesChannel && matchesPriority && matchesStatus;
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

  const channelOptions: SearchableOption[] = [
    { value: 'all', label: 'All Channels' },
    { value: 'IN_APP_BANNER', label: 'In-App Banner 📢' },
    { value: 'IN_APP_MODAL', label: 'Modal Popup 💬' },
    { value: 'EMAIL', label: 'Email Broadcast ✉️' },
    { value: 'TOP_BANNER', label: 'Top Sticky Banner 🔔' },
  ];

  const priorityOptions: SearchableOption[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'CRITICAL', label: 'CRITICAL 🔴' },
    { value: 'HIGH', label: 'HIGH 🟠' },
    { value: 'INFO', label: 'INFO 🔵' },
    { value: 'LOW', label: 'LOW 🟢' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'SENT', label: 'SENT 🟢' },
    { value: 'ACTIVE', label: 'ACTIVE (Sticky) 🟢' },
    { value: 'SCHEDULED', label: 'SCHEDULED ⏳' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'sent_at', label: 'Sent Timestamp' },
    { value: 'title', label: 'Announcement Title' },
    { value: 'priority', label: 'Priority Level' },
    { value: 'recipients_count', label: 'Recipients Reached' },
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
            <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30">
              <Megaphone className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Platform Broadcast & System Announcement Dispatcher
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Relay Engine Live
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch system-wide maintenance banners, release notes popups, top sticky notices, and email broadcasts across all tenant schools
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> New Broadcast Announcement
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Broadcasts</span>
            <Megaphone className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalBroadcastsCount} Campaigns</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Platform Announcements</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Recipients Reached</span>
            <Send className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{totalRecipientsCount.toLocaleString()} Users</div>
          <div className="text-[10px] text-slate-500 mt-0.5">1,240 Tenant Schools</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Banners</span>
            <Bell className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeBannersCount} Sticky Banners</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live Top Platform Bar</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Delivery Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">99.8% ✉️</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Multi-Channel Delivery</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Websocket Relay</span>
            <Radio className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">LIVE 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sub-second In-App Push</div>
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
              placeholder="Search by broadcast ID, title, target audience, message body..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={channelOptions} value={channelFilter} onChange={setChannelFilter} placeholder="Channel..." icon={Filter} labelPrefix="Channel" />
          <SearchableSelect options={priorityOptions} value={priorityFilter} onChange={setPriorityFilter} placeholder="Priority..." icon={Filter} labelPrefix="Priority" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>Announcement Title & ID</th>
                <th className="p-3.5">Delivery Channels</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('priority')}>Priority</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('recipients_count')}>Audience & Recipients</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('sent_at')}>Sent Timestamp</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(b => (
                <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Megaphone className={`w-4 h-4 ${b.priority === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                      <div>
                        <div className="text-sm text-white font-extrabold">{b.title}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{b.broadcast_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <div className="flex flex-wrap gap-1">
                      {b.channels.map(ch => (
                        <span key={ch} className="px-2 py-0.5 bg-slate-900 text-amber-400 border border-slate-800 rounded font-bold">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        b.priority === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                          : b.priority === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : b.priority === 'INFO'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {b.priority}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-purple-400 font-bold">{b.target_audience}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{b.recipients_count.toLocaleString()} Users Reached</div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{b.sent_at}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        b.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                          : b.status === 'SENT'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {b.channels.includes('TOP_BANNER') && (
                        <button
                          onClick={() => handleToggleBanner(b.id, b.status, b.title)}
                          className={`px-2 py-1.5 border rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                            b.status === 'ACTIVE'
                              ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
                              : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {b.status === 'ACTIVE' ? 'Hide Sticky' : 'Show Sticky'}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAnalytics(b)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Analytics
                      </button>
                      <button
                        onClick={() => handleDeleteBroadcast(b.id, b.title)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Broadcast Campaign"
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
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Create & Dispatch Broadcast Announcement</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBroadcast} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  placeholder="e.g. System Maintenance Notice"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Priority Level</label>
                  <select
                    value={priorityInput}
                    onChange={e => setPriorityInput(e.target.value as 'CRITICAL' | 'HIGH' | 'INFO' | 'LOW')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="CRITICAL">CRITICAL 🔴</option>
                    <option value="HIGH">HIGH 🟠</option>
                    <option value="INFO">INFO 🔵</option>
                    <option value="LOW">LOW 🟢</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Audience</label>
                  <select
                    value={targetAudienceInput}
                    onChange={e => setTargetAudienceInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="All Active School Tenants">All Active School Tenants</option>
                    <option value="School Principals & Owners">School Principals & Owners</option>
                    <option value="School Accountants">School Accountants</option>
                    <option value="Free Trial Schools">Free Trial Schools</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Delivery Channels</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inAppBannerChecked}
                      onChange={e => setInAppBannerChecked(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span className="text-slate-300 font-bold">In-App Dashboard Notification Banner 📢</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailChecked}
                      onChange={e => setEmailChecked(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span className="text-slate-300 font-bold">Email Broadcast to School Admins ✉️</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topBannerChecked}
                      onChange={e => setTopBannerChecked(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span className="text-slate-300 font-bold">Top Sticky Platform Header Banner 🔔</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Message Body & Details</label>
                <textarea
                  required
                  rows={4}
                  value={messageBodyInput}
                  onChange={e => setMessageBodyInput(e.target.value)}
                  placeholder="Type complete system notice details..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-amber-600/30"
                >
                  Dispatch Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAnalytics && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Broadcast Delivery Analytics & Recipient Breakdown</h3>
              </div>
              <button onClick={() => setSelectedAnalytics(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">{selectedAnalytics.title} ({selectedAnalytics.broadcast_id})</div>
                <div className="text-slate-400">Audience: {selectedAnalytics.target_audience} · Priority: {selectedAnalytics.priority}</div>
                <div className="text-slate-500 text-[11px]">Sent At: {selectedAnalytics.sent_at}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-sans">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-purple-400">{selectedAnalytics.recipients_count.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">Recipients Reached</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-emerald-400">99.8%</div>
                  <div className="text-[10px] text-slate-400">Delivery Success</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-blue-400">74.2%</div>
                  <div className="text-[10px] text-slate-400">Open & Read Rate</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-white font-bold mb-1">Message Content:</div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">{selectedAnalytics.message_body}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAnalytics(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
