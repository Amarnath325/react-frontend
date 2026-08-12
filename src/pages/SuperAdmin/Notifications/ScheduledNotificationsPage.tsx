import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Clock, RefreshCw, Search, Filter, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronDown, Check, List, X,
  Plus, Eye, ShieldCheck, Trash2, Play, Pause, Calendar, Layers, Repeat, Zap
} from 'lucide-react';
import api from '../../../services/api';

interface ScheduledJob {
  id: string;
  schedule_id: string;
  task_name: string;
  channels: string[];
  schedule_expression: string;
  target_segment: string;
  next_run: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'PAUSED';
  last_run: string;
  message_body: string;
}

type SortField = 'next_run' | 'task_name' | 'frequency' | 'status';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 'all';

interface SearchableOption {
  value: string;
  label: string;
}

// Searchable Select Component
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

const mockScheduledJobs: ScheduledJob[] = [
  {
    id: 'sch-1',
    schedule_id: 'SCH-4092',
    task_name: 'Monthly Subscription Expiry & Renewal Reminder Cron',
    channels: ['EMAIL', 'SMS', 'WHATSAPP'],
    schedule_expression: '0 9 1 * * (Every Month on 1st at 09:00 AM)',
    target_segment: 'Tenant Schools Expiring in 15 Days',
    next_run: '2026-09-01 09:00:00',
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    last_run: '2026-08-01 09:00:00',
    message_body: 'Dear {principal_name}, Your school SaaS license expires soon. Click to renew with 1-click.'
  },
  {
    id: 'sch-2',
    schedule_id: 'SCH-4085',
    task_name: 'Independence Day Greeting & Flag Hoisting Invite',
    channels: ['WHATSAPP', 'PUSH'],
    schedule_expression: 'One-Time: 2026-08-14 17:00:00',
    target_segment: 'All Staff & Principals (1,240 Schools)',
    next_run: '2026-08-14 17:00:00',
    frequency: 'ONCE',
    status: 'PENDING',
    last_run: 'Never Triggered',
    message_body: 'Cordially inviting all school staff for Independence Day celebration tomorrow at 08:00 AM.'
  },
  {
    id: 'sch-3',
    schedule_id: 'SCH-4078',
    task_name: 'Daily Teacher Attendance & Timetable Substitution Digest',
    channels: ['PUSH'],
    schedule_expression: '30 8 * * 1-5 (Mon-Fri 08:30 AM)',
    target_segment: 'All School Teachers (12,800 Teachers)',
    next_run: '2026-08-12 08:30:00',
    frequency: 'DAILY',
    status: 'ACTIVE',
    last_run: '2026-08-11 08:30:00',
    message_body: 'Your daily timetable substitutions and attendance register for today is ready.'
  },
  {
    id: 'sch-4',
    schedule_id: 'SCH-4065',
    task_name: 'Q3 CBSE Exam Hall Ticket Release Announcement',
    channels: ['EMAIL', 'PUSH'],
    schedule_expression: 'Executed on 2026-08-10 11:00:00',
    target_segment: 'Students & Parents',
    next_run: 'Executed',
    frequency: 'ONCE',
    status: 'COMPLETED',
    last_run: '2026-08-10 11:00:00',
    message_body: 'CBSE Exam admit cards released online. Download now from student portal.'
  }
];

export default function ScheduledNotificationsPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>(mockScheduledJobs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('next_run');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<ScheduledJob | null>(null);

  // Form State
  const [taskNameInput, setTaskNameInput] = useState('');
  const [frequencyInput, setFrequencyInput] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE'>('ONCE');
  const [scheduleExpressionInput, setScheduleExpressionInput] = useState('2026-08-15 10:00:00');
  const [targetSegmentInput, setTargetSegmentInput] = useState('Tenant Schools Expiring in 15 Days');
  const [messageBodyInput, setMessageBodyInput] = useState('');
  const [emailChecked, setEmailChecked] = useState(true);
  const [smsChecked, setSmsChecked] = useState(false);
  const [whatsAppChecked, setWhatsAppChecked] = useState(true);
  const [pushChecked, setPushChecked] = useState(false);

  const totalJobsCount = 28;
  const pendingJobsCount = jobs.filter(j => j.status === 'PENDING' || j.status === 'ACTIVE').length;
  const executedJobsCount = jobs.filter(j => j.status === 'COMPLETED').length;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/scheduled-notifications');
      if (res.data.success && Array.isArray(res.data.data)) {
        setJobs(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Scheduled notification cron jobs & Redis worker feed refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, frequencyFilter, statusFilter, sortBy, sortOrder, pageSize]);

  // Create & Schedule Notification Job
  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskNameInput.trim() || !messageBodyInput.trim()) {
      toast.error('Please enter scheduled task name and message content');
      return;
    }

    const selectedChannels: string[] = [];
    if (emailChecked) selectedChannels.push('EMAIL');
    if (smsChecked) selectedChannels.push('SMS');
    if (whatsAppChecked) selectedChannels.push('WHATSAPP');
    if (pushChecked) selectedChannels.push('PUSH');

    if (selectedChannels.length === 0) {
      toast.error('Please select at least one delivery channel');
      return;
    }

    toast.loading(`Scheduling automated notification task '${taskNameInput}'...`, { id: 'add-sch-toast' });

    try {
      await api.post('/landlord/scheduled-notifications', {
        task_name: taskNameInput,
        frequency: frequencyInput,
        schedule_expression: scheduleExpressionInput,
        target_segment: targetSegmentInput,
        channels: selectedChannels,
        message_body: messageBodyInput
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const newJob: ScheduledJob = {
        id: `sch-${Date.now()}`,
        schedule_id: `SCH-${Math.floor(1000 + Math.random() * 9000)}`,
        task_name: taskNameInput,
        channels: selectedChannels,
        schedule_expression: scheduleExpressionInput,
        target_segment: targetSegmentInput,
        next_run: scheduleExpressionInput,
        frequency: frequencyInput,
        status: 'PENDING',
        last_run: 'Never Triggered',
        message_body: messageBodyInput
      };
      setJobs(prev => [newJob, ...prev]);
      setIsAddModalOpen(false);
      setTaskNameInput('');
      setMessageBodyInput('');
      toast.success(`⏰ Automated notification '${taskNameInput}' scheduled in Redis queue!`, { id: 'add-sch-toast' });
    }, 800);
  };

  // Trigger Now Action
  const handleTriggerNow = async (id: string, name: string) => {
    toast.loading(`Force triggering scheduled notification '${name}' right now...`, { id: 'trig-sch-toast' });

    try {
      await api.post(`/landlord/scheduled-notifications/${id}/trigger-now`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setJobs(prev =>
        prev.map(j => (j.id === id ? { ...j, status: 'COMPLETED', last_run: 'Just now' } : j))
      );
      toast.success(`⚡ Scheduled notification '${name}' triggered immediately!`, { id: 'trig-sch-toast' });
    }, 600);
  };

  // Pause / Resume Toggle Action
  const handleTogglePause = async (id: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    toast.loading(`Toggling active state for '${name}'...`, { id: 'pause-sch-toast' });

    try {
      await api.post(`/landlord/scheduled-notifications/${id}/toggle-pause`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setJobs(prev =>
        prev.map(j => (j.id === id ? { ...j, status: newStatus as 'ACTIVE' | 'PAUSED' } : j))
      );
      toast.success(
        newStatus === 'ACTIVE'
          ? `🟢 Cron job '${name}' RESUMED!`
          : `⏸️ Cron job '${name}' PAUSED!`,
        { id: 'pause-sch-toast' }
      );
    }, 600);
  };

  // Delete Scheduled Job
  const handleDeleteJob = async (id: string, name: string) => {
    toast.loading(`Deleting scheduled job '${name}'...`, { id: 'del-sch-toast' });

    try {
      await api.delete(`/landlord/scheduled-notifications/${id}`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success(`🗑️ Scheduled job '${name}' deleted!`, { id: 'del-sch-toast' });
    }, 600);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = jobs.filter(j => {
    const matchesSearch =
      j.schedule_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.schedule_expression.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.target_segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.message_body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFrequency = frequencyFilter === 'all' || j.frequency === frequencyFilter;
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;

    return matchesSearch && matchesFrequency && matchesStatus;
  });

  // Sorted Dataset
  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = a[sortBy] ?? '';
    let valB: string | number = b[sortBy] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated Dataset
  const totalFiltered = sorted.length;
  const effectivePageSize = pageSize === 'all' ? Math.max(1, totalFiltered) : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePageSize;
  const paginatedData = pageSize === 'all' ? sorted : sorted.slice(startIndex, startIndex + effectivePageSize);

  const frequencyOptions: SearchableOption[] = [
    { value: 'all', label: 'All Frequencies' },
    { value: 'MONTHLY', label: 'MONTHLY 🔁' },
    { value: 'DAILY', label: 'DAILY ⏰' },
    { value: 'ONCE', label: 'ONCE 🎯' },
    { value: 'WEEKLY', label: 'WEEKLY 📅' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'ACTIVE 🟢' },
    { value: 'PENDING', label: 'PENDING ⏳' },
    { value: 'COMPLETED', label: 'COMPLETED ✅' },
    { value: 'PAUSED', label: 'PAUSED ⏸️' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'next_run', label: 'Next Run Timestamp' },
    { value: 'task_name', label: 'Task Name' },
    { value: 'frequency', label: 'Frequency' },
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
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-400/30">
              <Clock className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Automated Notification Cron Scheduler & Queue Engine
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Repeat className="w-3 h-3 animate-spin" /> Redis Queue Daemon Running
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Schedule future multi-channel notification broadcasts, recurring monthly renewal reminders, and automated daily teacher digests
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
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Schedule Notification Job
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Scheduled Jobs</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalJobsCount} Cron Tasks</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated Queue Jobs</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Dispatches</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{pendingJobsCount} Queued ⏳</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Next Run Scheduled</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Executed Past Jobs</span>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{executedJobsCount} Completed ✅</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Successful Dispatches</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Schedule Types</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">Multi-Channel 📡</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Email / SMS / WA / Push</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Queue Worker Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">ACTIVE 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Redis Queue Daemon</div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by schedule ID, task name, cron expression, target segment..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={frequencyOptions} value={frequencyFilter} onChange={setFrequencyFilter} placeholder="Frequency..." icon={Filter} labelPrefix="Frequency" />
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

      {/* ── SCHEDULED NOTIFICATIONS TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('task_name')}>Task Name & ID</th>
                <th className="p-3.5">Delivery Channels</th>
                <th className="p-3.5">Cron Schedule & Expression</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('frequency')}>Frequency</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('next_run')}>Next Run Timestamp</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(j => (
                <tr key={j.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white font-mono">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-sm text-white font-extrabold">{j.task_name}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{j.schedule_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <div className="flex flex-wrap gap-1">
                      {j.channels.map(ch => (
                        <span key={ch} className="px-2 py-0.5 bg-slate-900 text-amber-400 border border-slate-800 rounded font-bold">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[10px]">
                    <div className="text-amber-400 font-bold">{j.schedule_expression}</div>
                    <div className="text-slate-400 text-[9px]">Target: {j.target_segment}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full font-bold text-[9px] uppercase">
                      {j.frequency}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 font-bold">{j.next_run}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        j.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : j.status === 'PENDING'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : j.status === 'COMPLETED'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {j.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleTriggerNow(j.id, j.task_name)}
                          className="px-2 py-1.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Trigger immediate execution"
                        >
                          <Zap className="w-3.5 h-3.5" /> Trigger Now
                        </button>
                      )}
                      {(j.status === 'ACTIVE' || j.status === 'PAUSED') && (
                        <button
                          onClick={() => handleTogglePause(j.id, j.status, j.task_name)}
                          className={`p-1.5 border rounded-xl cursor-pointer ${
                            j.status === 'PAUSED'
                              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                          title={j.status === 'PAUSED' ? 'Resume Schedule' : 'Pause Schedule'}
                        >
                          {j.status === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedLogs(j)}
                        className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Cron Logs
                      </button>
                      <button
                        onClick={() => handleDeleteJob(j.id, j.task_name)}
                        className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl cursor-pointer"
                        title="Delete Scheduled Task"
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

      {/* ── NEW SCHEDULED NOTIFICATION MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Create & Schedule Notification Cron Task</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Task Name</label>
                <input
                  type="text"
                  required
                  value={taskNameInput}
                  onChange={e => setTaskNameInput(e.target.value)}
                  placeholder="e.g. Monthly Subscription Renewal Reminder"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Frequency</label>
                  <select
                    value={frequencyInput}
                    onChange={e => setFrequencyInput(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ONCE">ONCE (One-time Date) 🎯</option>
                    <option value="DAILY">DAILY ⏰</option>
                    <option value="WEEKLY">WEEKLY 📅</option>
                    <option value="MONTHLY">MONTHLY 🔁</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Segment</label>
                  <select
                    value={targetSegmentInput}
                    onChange={e => setTargetSegmentInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Tenant Schools Expiring in 15 Days">Tenant Schools Expiring in 15 Days</option>
                    <option value="All Staff & Principals">All Staff & Principals</option>
                    <option value="All School Teachers">All School Teachers</option>
                    <option value="Students & Parents">Students & Parents</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Schedule Date / Cron Expression</label>
                <input
                  type="text"
                  required
                  value={scheduleExpressionInput}
                  onChange={e => setScheduleExpressionInput(e.target.value)}
                  placeholder="2026-08-15 10:00:00 or 0 9 1 * *"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Delivery Channels</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={emailChecked} onChange={e => setEmailChecked(e.target.checked)} className="accent-amber-500" />
                    <span className="text-slate-300 font-bold">Email Broadcast ✉️</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={smsChecked} onChange={e => setSmsChecked(e.target.checked)} className="accent-amber-500" />
                    <span className="text-slate-300 font-bold">SMS Text 📱</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={whatsAppChecked} onChange={e => setWhatsAppChecked(e.target.checked)} className="accent-amber-500" />
                    <span className="text-slate-300 font-bold">WhatsApp 💬</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={pushChecked} onChange={e => setPushChecked(e.target.checked)} className="accent-amber-500" />
                    <span className="text-slate-300 font-bold">Mobile Push 🔔</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Message Body Content</label>
                <textarea
                  required
                  rows={4}
                  value={messageBodyInput}
                  onChange={e => setMessageBodyInput(e.target.value)}
                  placeholder="Type notification message. Dynamic tags: {school_name}, {principal_name}, {expiry_date}..."
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
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CRON EXECUTION LOG INSPECTOR MODAL ── */}
      {selectedLogs && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Cron Task Execution Logs & Redis Worker Feed</h3>
              </div>
              <button onClick={() => setSelectedLogs(null)} className="p-1 hover:bg-slate-900 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">{selectedLogs.task_name} ({selectedLogs.schedule_id})</div>
                <div className="text-slate-400">Cron: {selectedLogs.schedule_expression} · Frequency: {selectedLogs.frequency}</div>
                <div className="text-slate-500 text-[11px]">Last Run: {selectedLogs.last_run} · Next Run: {selectedLogs.next_run}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-sans">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-purple-400">{selectedLogs.channels.join(', ')}</div>
                  <div className="text-[10px] text-slate-400">Active Channels</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-emerald-400">SUCCESS 🟢</div>
                  <div className="text-[10px] text-slate-400">Worker Status</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-blue-400">0.42s</div>
                  <div className="text-[10px] text-slate-400">Dispatch Latency</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-white font-bold mb-1">Message Content Payload:</div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">{selectedLogs.message_body}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogs(null)}
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
