import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Clock, RefreshCw, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, CheckCircle2, MessageSquare, PhoneCall, AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';

interface FollowUpItem {
  id: string;
  followup_id: string;
  lead_or_deal_name: string;
  task_action: string;
  due_date_time: string;
  channel: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: string;
}

type SortField = 'due_date_time' | 'priority' | 'lead_or_deal_name';
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

const mockFollowups: FollowUpItem[] = [
  {
    id: 'flp-1',
    followup_id: 'FLP-4042',
    lead_or_deal_name: 'Dr. Rajesh Kumar (DPS 45)',
    task_action: 'Send Custom CBSE Examination & Biometric Demo Deck',
    due_date_time: '2026-08-12 15:00',
    channel: 'WHATSAPP & CALL',
    priority: 'HIGH',
    status: 'PENDING'
  },
  {
    id: 'flp-2',
    followup_id: 'FLP-4038',
    lead_or_deal_name: 'Greenwood High International',
    task_action: 'Share Enterprise SLA Custom Pricing Agreement PDF',
    due_date_time: '2026-08-12 17:30',
    channel: 'EMAIL',
    priority: 'CRITICAL',
    status: 'PENDING'
  },
  {
    id: 'flp-3',
    followup_id: 'FLP-4025',
    lead_or_deal_name: 'St. Xavier International School',
    task_action: 'Schedule Technical Hardware Architecture Call',
    due_date_time: '2026-08-11 11:00',
    channel: 'ZOOM CALL',
    priority: 'MEDIUM',
    status: 'COMPLETED'
  }
];

export default function FollowUpManagementPage() {
  const [followups, setFollowups] = useState<FollowUpItem[]>(mockFollowups);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('due_date_time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedFollowup, setSelectedFollowup] = useState<FollowUpItem | null>(null);

  const totalTasksDue = 42;
  const criticalCount = 14;
  const completedTodayCount = 28;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/follow-up-management');
      if (res.data.success && Array.isArray(res.data.data)) {
        setFollowups(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Sales follow-up tasks & SLA queue refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, sortBy, sortOrder, pageSize]);

  const handleCompleteTask = (id: string, fupId: string) => {
    toast.loading(`Marking follow-up task '${fupId}' as completed...`, { id: 'complete-fup-toast' });
    setTimeout(() => {
      setFollowups(prev =>
        prev.map(f => (f.id === id ? { ...f, status: 'COMPLETED' } : f))
      );
      toast.success(`✅ Follow-up task '${fupId}' completed!`, { id: 'complete-fup-toast' });
    }, 600);
  };

  const handleDeleteFollowup = async (id: string, fupId: string) => {
    toast.loading(`Deleting follow-up '${fupId}'...`, { id: 'del-fup-toast' });

    try {
      await api.delete(`/landlord/follow-up-management/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setFollowups(prev => prev.filter(f => f.id !== id));
      toast.success(`🗑️ Follow-up '${fupId}' deleted!`, { id: 'del-fup-toast' });
    }, 600);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const filtered = followups.filter(f => {
    const matchesSearch =
      f.followup_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.lead_or_deal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.task_action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.channel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || f.priority === priorityFilter;

    return matchesSearch && matchesPriority;
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
    { value: 'CRITICAL', label: 'CRITICAL 🚨' },
    { value: 'HIGH', label: 'HIGH 🔥' },
    { value: 'MEDIUM', label: 'MEDIUM 🟡' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'due_date_time', label: 'Due Date/Time' },
    { value: 'priority', label: 'Priority' },
    { value: 'lead_or_deal_name', label: 'Lead/Deal Name' },
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
              <Clock className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Sales Lead & Deal Follow-Up Task Management Queue
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" /> 14 Critical Follow-Ups Due
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Schedule and execute automated follow-up reminders via WhatsApp, Phone Calls, and Email decks for pending sales leads
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
            <Clock className="w-3.5 h-3.5" /> Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
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
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Due Tasks</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTasksDue} Tasks</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Scheduled Queue</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical Priority</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{criticalCount} Critical 🚨</div>
          <div className="text-[10px] text-slate-500 mt-0.5">High SLA Urgency</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedTodayCount} Executed ✅</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Resolved Tasks</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Response SLA Rate</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">98.4% On-Time</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sales SLA Compliance</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Channel</span>
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-sm font-black text-blue-400 truncate">WhatsApp & Call 💬</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Direct Messaging</div>
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
              placeholder="Search by followup ID, lead/deal name, task action, channel..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={priorityOptions} value={priorityFilter} onChange={setPriorityFilter} placeholder="Priority..." icon={Filter} labelPrefix="Priority" />
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
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('lead_or_deal_name')}>Lead / Deal Name & ID</th>
                <th className="p-3.5">Task Action Description</th>
                <th className="p-3.5 cursor-pointer hover:text-white font-mono" onClick={() => handleSort('due_date_time')}>Due Date & Time</th>
                <th className="p-3.5">Channel Mode</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('priority')}>Priority Level</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(f => (
                <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{f.lead_or_deal_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{f.followup_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-purple-400">{f.task_action}</td>
                  <td className="p-3.5 font-mono text-[11px] text-emerald-400 font-bold">{f.due_date_time}</td>
                  <td className="p-3.5 font-mono text-[10px] text-blue-400 font-bold">{f.channel}</td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <span
                      className={`px-2 py-0.5 border rounded font-bold ${
                        f.priority === 'CRITICAL'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : f.priority === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {f.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border ${
                        f.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {f.status === 'PENDING' && (
                        <button
                          onClick={() => handleCompleteTask(f.id, f.followup_id)}
                          className="px-2 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete Task
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedFollowup(f)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Task Spec
                      </button>
                      <button
                        onClick={() => handleDeleteFollowup(f.id, f.followup_id)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Task"
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

      {selectedFollowup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Follow-Up Task Details ({selectedFollowup.followup_id})</h3>
              </div>
              <button onClick={() => setSelectedFollowup(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">{selectedFollowup.lead_or_deal_name}</div>
                <div className="text-slate-400">Action: {selectedFollowup.task_action}</div>
                <div className="text-slate-500 text-[11px]">Due: {selectedFollowup.due_date_time} · Channel: {selectedFollowup.channel} · Priority: {selectedFollowup.priority}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFollowup(null)}
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
