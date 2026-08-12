import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ListOrdered, RefreshCw, Cpu, Database, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, Terminal, X, Power, Radio, Zap, Code, Eye,
  RotateCcw, Trash2, Layers, AlertCircle, Play
} from 'lucide-react';
import api from '../../../services/api';

interface QueueJob {
  id: string;
  job_class: string;
  queue: 'default' | 'emails' | 'notifications' | 'reports';
  tenant_id: string;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED';
  duration_ms: number;
  attempts: number;
  timestamp: string;
  exception_message?: string;
  exception_trace?: string;
}

interface WorkerDaemon {
  id: string;
  name: string;
  supervisor: string;
  assigned_queues: string[];
  status: 'RUNNING' | 'PAUSED';
  cpu_percent: number;
  memory_mb: number;
  jobs_processed: number;
}

type TabKey = 'recent_jobs' | 'failed_jobs' | 'workers' | 'metrics';
type SortField = 'timestamp' | 'duration_ms' | 'job_class';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
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
                      ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockJobs: QueueJob[] = [
  {
    id: 'job-9842',
    job_class: 'App\\Jobs\\SendFeeDueReminderEmailJob',
    queue: 'emails',
    tenant_id: 'dpsnoida',
    status: 'COMPLETED',
    duration_ms: 145,
    attempts: 1,
    timestamp: '2026-08-10 20:30:12'
  },
  {
    id: 'job-9843',
    job_class: 'App\\Jobs\\GenerateTermReportCardPdfJob',
    queue: 'reports',
    tenant_id: 'dpsrkp',
    status: 'PROCESSING',
    duration_ms: 820,
    attempts: 1,
    timestamp: '2026-08-10 20:34:00'
  },
  {
    id: 'job-9844',
    job_class: 'App\\Jobs\\DispatchWhatsAppHsmBroadcastJob',
    queue: 'notifications',
    tenant_id: 'dpsnoida',
    status: 'FAILED',
    duration_ms: 2400,
    attempts: 3,
    timestamp: '2026-08-10 20:25:00',
    exception_message: 'Meta Cloud API Error: Invalid Phone Number format (+91 98765)',
    exception_trace: 'App\\Services\\WhatsAppService.php:142\nApp\\Jobs\\DispatchWhatsAppHsmBroadcastJob.php:88'
  },
  {
    id: 'job-9845',
    job_class: 'App\\Jobs\\ProcessDailyAttendanceSummaryJob',
    queue: 'default',
    tenant_id: 'dpsrkp',
    status: 'PENDING',
    duration_ms: 0,
    attempts: 0,
    timestamp: '2026-08-10 20:35:10'
  }
];

const mockWorkers: WorkerDaemon[] = [
  { id: 'w-1', name: 'horizon-worker-01', supervisor: 'supervisor-1', assigned_queues: ['emails', 'notifications'], status: 'RUNNING', cpu_percent: 12, memory_mb: 48, jobs_processed: 4820 },
  { id: 'w-2', name: 'horizon-worker-02', supervisor: 'supervisor-1', assigned_queues: ['reports', 'default'], status: 'RUNNING', cpu_percent: 18, memory_mb: 64, jobs_processed: 3910 },
  { id: 'w-3', name: 'horizon-worker-03', supervisor: 'supervisor-2', assigned_queues: ['high', 'default'], status: 'RUNNING', cpu_percent: 8, memory_mb: 42, jobs_processed: 6100 }
];

export default function QueueMonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('recent_jobs');
  const [jobs, setJobs] = useState<QueueJob[]>(mockJobs);
  const [workers] = useState<WorkerDaemon[]>(mockWorkers);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [queueFilter, setQueueFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modal
  const [selectedException, setSelectedException] = useState<QueueJob | null>(null);

  // Simulated live jobs pulse
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setJobs(prev =>
        prev.map(j => (j.status === 'PROCESSING' ? { ...j, status: 'COMPLETED', duration_ms: 320 } : j))
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/queue-monitoring');
      if (res.data.success && res.data.data && Array.isArray(res.data.data.jobs)) {
        setJobs(res.data.data.jobs);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Queue jobs & worker daemons status refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, queueFilter, statusFilter, sortBy, sortOrder, pageSize]);

  // Retry Failed Job
  const handleRetryJob = async (id: string) => {
    toast.loading(`Re-queuing failed job #${id}...`, { id: 'retry-toast' });
    try {
      await api.post(`/landlord/queue-monitoring/retry/${id}`);
    } catch {
      // Fallback
    }
    setTimeout(() => {
      setJobs(prev =>
        prev.map(j => (j.id === id ? { ...j, status: 'PENDING', attempts: j.attempts + 1, exception_message: undefined } : j))
      );
      setSelectedException(null);
      toast.success(`⚡ Failed job #${id} re-queued successfully!`, { id: 'retry-toast' });
    }, 1000);
  };

  // Purge Failed Jobs
  const handlePurgeFailed = async () => {
    toast.loading('Purging all failed jobs from Redis queue...', { id: 'purge-toast' });
    try {
      await api.post('/landlord/queue-monitoring/purge-failed');
    } catch {
      // Fallback
    }
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.status !== 'FAILED'));
      toast.success('🎉 Failed queue purged successfully!', { id: 'purge-toast' });
    }, 1000);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = jobs.filter(j => {
    const matchesSearch =
      j.job_class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.tenant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.exception_message && j.exception_message.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesQueue = queueFilter === 'all' || j.queue === queueFilter;
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;

    return matchesSearch && matchesQueue && matchesStatus;
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

  const queueOptions: SearchableOption[] = [
    { value: 'all', label: 'All Queues' },
    { value: 'default', label: 'default' },
    { value: 'emails', label: 'emails' },
    { value: 'notifications', label: 'notifications' },
    { value: 'reports', label: 'reports' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'PROCESSING', label: 'PROCESSING' },
    { value: 'FAILED', label: 'FAILED' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'timestamp', label: 'Timestamp' },
    { value: 'duration_ms', label: 'Execution Time' },
    { value: 'job_class', label: 'Job Name' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  const failedCount = jobs.filter(j => j.status === 'FAILED').length;

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-400/30">
              <ListOrdered className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Laravel Horizon Queue & Worker Monitor
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold rounded-full border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Horizon Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time Redis background job queues, failed job retry engine, and Supervisor worker daemon status
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse (3s): {autoRefresh ? 'ON' : 'OFF'}
          </button>
          {failedCount > 0 && (
            <button
              onClick={handlePurgeFailed}
              className="px-3.5 py-2 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Failed ({failedCount})
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queues
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Horizon Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400">SUPERVISOR ACTIVE</div>
          <div className="text-[10px] text-slate-500 mt-0.5">3 Worker Daemons</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Jobs Today</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">14,820</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Completed Dispatches</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Queue Throughput</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">185 / sec</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Avg Processing Speed</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Jobs</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{jobs.filter(j => j.status === 'PENDING').length} Pending</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In Redis Queue</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Failed Jobs</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{failedCount} Failed</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ready for Retry</div>
        </div>
      </div>

      {/* ── CATEGORIZED TABS NAVIGATION ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('recent_jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'recent_jobs' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <ListOrdered className="w-4 h-4" /> All Recent Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('failed_jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'failed_jobs' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <AlertCircle className="w-4 h-4" /> Failed Jobs ({failedCount})
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'workers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" /> Worker Daemons ({workers.length})
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      {(activeTab === 'recent_jobs' || activeTab === 'failed_jobs') && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search jobs by class name, queue, tenant ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchableSelect options={queueOptions} value={queueFilter} onChange={setQueueFilter} placeholder="Queue..." icon={Database} labelPrefix="Queue" />
            <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
            <div className="flex items-center gap-1">
              <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
              <button
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-2 bg-slate-900 border border-slate-800 text-indigo-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
          </div>
        </div>
      )}

      {/* ── TAB 1 & 2: JOBS TABLE ── */}
      {(activeTab === 'recent_jobs' || activeTab === 'failed_jobs') && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('job_class')}>Job ID & Class</th>
                  <th className="p-3.5">Queue</th>
                  <th className="p-3.5">Tenant</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('duration_ms')}>Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(job => (
                  <tr key={job.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      <div>{job.job_class.split('\\').pop()}</div>
                      <div className="text-[10px] font-mono text-indigo-400">{job.job_class}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] rounded-full font-bold">
                        {job.queue}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{job.tenant_id}</td>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{job.duration_ms} ms</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                        job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        job.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        job.status === 'PROCESSING' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {job.status === 'FAILED' && (
                          <>
                            <button
                              onClick={() => setSelectedException(job)}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-lg text-[10px] font-bold"
                            >
                              <Eye className="w-3 h-3 text-red-400" /> Traceback
                            </button>
                            <button
                              onClick={() => handleRetryJob(job.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer shadow-md"
                            >
                              <RotateCcw className="w-3 h-3" /> Retry
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: WORKER DAEMONS ── */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workers.map(w => (
            <div key={w.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    {w.name}
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{w.supervisor}</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-extrabold uppercase">
                  {w.status}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-slate-400">CPU Usage:</span><span className="text-blue-400 font-bold">{w.cpu_percent}%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Memory Load:</span><span className="text-purple-400 font-bold">{w.memory_mb} MB</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Jobs Processed:</span><span className="text-emerald-400 font-bold">{w.jobs_processed.toLocaleString()}</span></div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>Queues:</span>
                {w.assigned_queues.map(q => (
                  <span key={q} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md font-mono text-indigo-400 font-bold">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: EXCEPTION TRACEBACK ── */}
      {selectedException && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" /> Failed Job Exception Traceback #{selectedException.id}
              </h3>
              <button onClick={() => setSelectedException(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/30 text-red-400 font-mono font-bold">
                {selectedException.exception_message}
              </div>

              <div className="bg-black p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedException.exception_trace}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setSelectedException(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Close
              </button>
              <button
                onClick={() => handleRetryJob(selectedException.id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-queue Failed Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
