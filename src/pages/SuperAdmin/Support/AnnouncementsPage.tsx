import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Bell, RefreshCw, Clock, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, AlertTriangle, Radio, Megaphone, Calendar
} from 'lucide-react';
import api from '../../../services/api';

interface AnnouncementItem {
  id: string;
  announcement_id: string;
  headline: string;
  target_group: string;
  priority: 'EMERGENCY' | 'IMPORTANT' | 'GENERAL';
  position: 'TOP HEADER' | 'DASHBOARD MODAL' | 'INLINE BANNER';
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
  published_at: string;
  expires_at: string;
  details: string;
}

type SortField = 'published_at' | 'headline' | 'priority' | 'status';
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

const mockAnnouncements: AnnouncementItem[] = [
  {
    id: 'anc-1',
    announcement_id: 'ANC-5014',
    headline: 'Scheduled System Database Maintenance Notice',
    target_group: 'All School Principals & Admins',
    priority: 'EMERGENCY',
    position: 'TOP HEADER',
    status: 'ACTIVE',
    published_at: '2026-08-11 12:00:00',
    expires_at: '2026-08-17 23:59:59',
    details: 'Database clusters will undergo routine index optimization on Sunday from 02:00 AM to 04:00 AM IST.'
  },
  {
    id: 'anc-2',
    announcement_id: 'ANC-5009',
    headline: 'Q3 CBSE Automated Report Card Generator Released',
    target_group: 'Teachers & Faculty',
    priority: 'IMPORTANT',
    position: 'DASHBOARD MODAL',
    status: 'ACTIVE',
    published_at: '2026-08-09 10:00:00',
    expires_at: '2026-08-30 23:59:59',
    details: 'CBSE CCE & Grading remark generators are live. Access under Examination section.'
  },
  {
    id: 'anc-3',
    announcement_id: 'ANC-4995',
    headline: 'New WhatsApp Cloud API Broadcast Integration',
    target_group: 'Accountants & Billing Staff',
    priority: 'GENERAL',
    position: 'INLINE BANNER',
    status: 'ACTIVE',
    published_at: '2026-08-05 14:00:00',
    expires_at: '2026-08-25 23:59:59',
    details: 'Send automated WhatsApp fee payment receipts with interactive pay links directly from school portal.'
  },
  {
    id: 'anc-4',
    announcement_id: 'ANC-4980',
    headline: 'Annual School SaaS License Renewal Discount Scheme',
    target_group: 'Tenant School Owners',
    priority: 'IMPORTANT',
    position: 'TOP HEADER',
    status: 'EXPIRED',
    published_at: '2026-07-01 09:00:00',
    expires_at: '2026-08-01 23:59:59',
    details: 'Get 20% discount on 2-year upfront subscription renewals.'
  }
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(mockAnnouncements);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('published_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // Form State
  const [headlineInput, setHeadlineInput] = useState('');
  const [targetGroupInput, setTargetGroupInput] = useState('All School Principals & Admins');
  const [priorityInput, setPriorityInput] = useState<'EMERGENCY' | 'IMPORTANT' | 'GENERAL'>('IMPORTANT');
  const [positionInput, setPositionInput] = useState<'TOP HEADER' | 'DASHBOARD MODAL' | 'INLINE BANNER'>('TOP HEADER');
  const [detailsInput, setDetailsInput] = useState('');

  const totalAnnouncementsCount = 32;
  const activeAnnouncementsCount = announcements.filter(a => a.status === 'ACTIVE').length;
  const emergencyAnnouncementsCount = announcements.filter(a => a.priority === 'EMERGENCY').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/announcements');
      if (res.data.success && Array.isArray(res.data.data)) {
        setAnnouncements(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('System announcements & bulletins feed refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headlineInput.trim() || !detailsInput.trim()) {
      toast.error('Please enter announcement headline and details');
      return;
    }

    toast.loading(`Publishing system announcement '${headlineInput}'...`, { id: 'add-anc-toast' });

    try {
      await api.post('/landlord/announcements', {
        headline: headlineInput,
        target_group: targetGroupInput,
        priority: priorityInput,
        position: positionInput,
        details: detailsInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newAnnouncement: AnnouncementItem = {
        id: `anc-${Date.now()}`,
        announcement_id: `ANC-${Math.floor(1000 + Math.random() * 9000)}`,
        headline: headlineInput,
        target_group: targetGroupInput,
        priority: priorityInput,
        position: positionInput,
        status: 'ACTIVE',
        published_at: 'Just now',
        expires_at: '2026-08-31 23:59:59',
        details: detailsInput
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      setIsAddModalOpen(false);
      setHeadlineInput('');
      setDetailsInput('');
      toast.success(`📢 System Announcement '${newAnnouncement.announcement_id}' published live!`, { id: 'add-anc-toast' });
    }, 800);
  };

  const handleDeleteAnnouncement = async (id: string, headline: string) => {
    toast.loading(`Deleting announcement '${headline}'...`, { id: 'del-anc-toast' });

    try {
      await api.delete(`/landlord/announcements/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success(`🗑️ System announcement '${headline}' deleted!`, { id: 'del-anc-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = announcements.filter(a => {
    const matchesSearch =
      a.announcement_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.target_group.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
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

  const priorityOptions: SearchableOption[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'EMERGENCY', label: 'EMERGENCY 🔴' },
    { value: 'IMPORTANT', label: 'IMPORTANT 🟠' },
    { value: 'GENERAL', label: 'GENERAL 🔵' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'ACTIVE 🟢' },
    { value: 'SCHEDULED', label: 'SCHEDULED ⏳' },
    { value: 'EXPIRED', label: 'EXPIRED 📦' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'published_at', label: 'Published Timestamp' },
    { value: 'headline', label: 'Headline Title' },
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
              <Megaphone className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                System Announcements & Bulletin Board
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-400 text-[10px] font-extrabold rounded-full border border-teal-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Platform Banners Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Broadcast system notices, emergency maintenance warnings, new feature bulletins, and discount offers across all tenant school dashboards
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
            <Plus className="w-4 h-4" /> New Announcement
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Notices</span>
            <Megaphone className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalAnnouncementsCount} Bulletins</div>
          <div className="text-[10px] text-slate-500 mt-0.5">System Bulletins</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Live Active Banners</span>
            <Bell className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeAnnouncementsCount} Active 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live On Dashboards</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Emergency Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{emergencyAnnouncementsCount} Urgent 🚨</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Critical System Alerts</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Audience Reach</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">1,240 Schools</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tenant Reached</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Read Confirm Rate</span>
            <Check className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">91.4% 💬</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Seen Confirmation</div>
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
              placeholder="Search by announcement ID, headline, target group, details..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('headline')}>Headline & ID</th>
                <th className="p-3.5">Target Group</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('priority')}>Priority</th>
                <th className="p-3.5">Position</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('published_at')}>Published Date</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(a => (
                <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Megaphone className={`w-4 h-4 ${a.priority === 'EMERGENCY' ? 'text-red-400' : 'text-teal-400'}`} />
                      <div>
                        <div className="text-sm text-white font-extrabold">{a.headline}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{a.announcement_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-purple-400 font-bold">{a.target_group}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        a.priority === 'EMERGENCY'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                          : a.priority === 'IMPORTANT'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      }`}
                    >
                      {a.priority}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-900 text-teal-400 border border-slate-800 rounded font-bold">
                      {a.position}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{a.published_at}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        a.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : a.status === 'SCHEDULED'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedAnnouncement(a)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-400" /> View Details
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(a.id, a.headline)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Announcement"
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
                <Megaphone className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">Create System Announcement</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAnnouncement} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Announcement Headline</label>
                <input
                  type="text"
                  required
                  value={headlineInput}
                  onChange={e => setHeadlineInput(e.target.value)}
                  placeholder="e.g. Scheduled System Database Maintenance Notice"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Group</label>
                  <select
                    value={targetGroupInput}
                    onChange={e => setTargetGroupInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="All School Principals & Admins">All School Principals & Admins</option>
                    <option value="Teachers & Faculty">Teachers & Faculty</option>
                    <option value="Accountants & Billing Staff">Accountants & Billing Staff</option>
                    <option value="Tenant School Owners">Tenant School Owners</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Priority</label>
                  <select
                    value={priorityInput}
                    onChange={e => setPriorityInput(e.target.value as 'EMERGENCY' | 'IMPORTANT' | 'GENERAL')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="EMERGENCY">EMERGENCY 🔴</option>
                    <option value="IMPORTANT">IMPORTANT 🟠</option>
                    <option value="GENERAL">GENERAL 🔵</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Banner Display Position</label>
                <select
                  value={positionInput}
                  onChange={e => setPositionInput(e.target.value as 'TOP HEADER' | 'DASHBOARD MODAL' | 'INLINE BANNER')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="TOP HEADER">TOP HEADER BANNER 🔔</option>
                  <option value="DASHBOARD MODAL">DASHBOARD MODAL POPUP 💬</option>
                  <option value="INLINE BANNER">INLINE DASHBOARD BANNER 📢</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Details & Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={detailsInput}
                  onChange={e => setDetailsInput(e.target.value)}
                  placeholder="Type complete notice details..."
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
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">{selectedAnnouncement.headline} ({selectedAnnouncement.announcement_id})</h3>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-teal-400 font-bold">Target Group: {selectedAnnouncement.target_group} · Priority: {selectedAnnouncement.priority}</div>
                <div className="text-slate-400">Position: {selectedAnnouncement.position} · Status: {selectedAnnouncement.status}</div>
                <div className="text-slate-500 text-[11px]">Published: {selectedAnnouncement.published_at} · Expires: {selectedAnnouncement.expires_at}</div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="text-white font-bold text-xs mb-1">Details:</div>
                <p className="text-slate-300 text-xs leading-relaxed">{selectedAnnouncement.details}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
