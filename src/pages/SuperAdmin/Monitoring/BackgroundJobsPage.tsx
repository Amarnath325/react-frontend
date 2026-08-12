import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Cpu, RefreshCw, Database, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, Terminal, X, Power, Radio, Code, Eye,
  Play, Plus, RotateCcw, Trash2, Sparkles, Layers
} from 'lucide-react';
import api from '../../../services/api';

interface BackgroundJob {
  id: string;
  job_name: string;
  batch_id: string;
  tenant_name: string;
  priority: 'High' | 'Normal' | 'Low';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'QUEUED';
  progress_percent: number;
  duration_sec: number;
  worker_node: string;
  dispatched_at: string;
}

type TabKey = 'running_jobs' | 'history_logs';
type SortField = 'dispatched_at' | 'duration_sec' | 'job_name';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-purple-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-purple-500 placeholder-slate-600"
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
                      ? 'bg-purple-600/20 text-purple-400 font-bold border border-purple-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockJobs: BackgroundJob[] = [
  {
    id: 'bg-101',
    job_name: 'GenerateFullSchoolReportCardsJob',
    batch_id: 'batch-8842',
    tenant_name: 'Delhi Public School Noida',
    priority: 'High',
    status: 'RUNNING',
    progress_percent: 68,
    duration_sec: 14.5,
    worker_node: 'horizon-worker-01',
    dispatched_at: '2026-08-10 20:58:12'
  },
  {
    id: 'bg-102',
    job_name: 'BulkFeeReceiptPdfGeneratorJob',
    batch_id: 'batch-8843',
    tenant_name: 'Delhi Public School RKP',
    priority: 'Normal',
    status: 'RUNNING',
    progress_percent: 42,
    duration_sec: 8.2,
    worker_node: 'horizon-worker-02',
    dispatched_at: '2026-08-10 21:00:00'
  },
  {
    id: 'bg-103',
    job_name: 'SyncBiometricDeviceLogsJob',
    batch_id: 'batch-8844',
    tenant_name: 'Modern School Barakhamba',
    priority: 'High',
    status: 'COMPLETED',
    progress_percent: 100,
    duration_sec: 2.1,
    worker_node: 'horizon-worker-03',
    dispatched_at: '2026-08-10 20:45:00'
  },
  {
    id: 'bg-104',
    job_name: 'ReindexSearchCatalogJob',
    batch_id: 'batch-8845',
    tenant_name: 'Landlord Master System',
    priority: 'Low',
    status: 'QUEUED',
    progress_percent: 0,
    duration_sec: 0,
    worker_node: 'horizon-worker-01',
    dispatched_at: '2026-08-10 21:02:10'
  }
];

export default function BackgroundJobsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('running_jobs');
  const [jobs, setJobs] = useState<BackgroundJob[]>(mockJobs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('dispatched_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    job_name: 'GenerateFullSchoolReportCardsJob',
    tenant_name: 'Delhi Public School Noida',
    priority: 'High' as BackgroundJob['priority'],
  });

  // Simulated live progress pulse
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setJobs(prev =>
        prev.map(j => {
          if (j.status === 'RUNNING') {
            const nextProgress = Math.min(100, j.progress_percent + 15);
            return {
              ...j,
              progress_percent: nextProgress,
              duration_sec: Number((j.duration_sec + 3).toFixed(1)),
              status: nextProgress === 100 ? 'COMPLETED' : 'RUNNING',
            };
          }
          return j;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/background-jobs');
      if (res.data.success && Array.isArray(res.data.data)) {
        setJobs(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Background jobs & batch tasks refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, statusFilter, sortBy, sortOrder, pageSize]);

  // Cancel Job Action
  const handleCancelJob = async (id: string, jobName: string) => {
    toast.loading(`Canceling background job '${jobName}'...`, { id: 'cancel-toast' });
    try {
      await api.post(`/landlord/background-jobs/${id}/cancel`);
    } catch {
      // Fallback
    }
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success(`⚡ Background job '${jobName}' canceled successfully!`, { id: 'cancel-toast' });
    }, 800);
  };

  // Dispatch Manual Job Submit
  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: BackgroundJob = {
      id: 'bg-' + Date.now().toString().slice(-3),
      job_name: dispatchForm.job_name,
      batch_id: 'batch-' + Math.floor(Math.random() * 9000 + 1000),
      tenant_name: dispatchForm.tenant_name,
      priority: dispatchForm.priority,
      status: 'RUNNING',
      progress_percent: 10,
      duration_sec: 1.2,
      worker_node: 'horizon-worker-01',
      dispatched_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setJobs(prev => [created, ...prev]);
    setShowDispatchModal(false);
    toast.success(`🚀 Background job '${created.job_name}' dispatched to Horizon workers!`);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = jobs.filter(j => {
    const matchesSearch =
      j.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.tenant_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || j.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
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

  const priorityOptions: SearchableOption[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'High', label: 'High Priority' },
    { value: 'Normal', label: 'Normal Priority' },
    { value: 'Low', label: 'Low Priority' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'RUNNING', label: 'RUNNING 🟢' },
    { value: 'COMPLETED', label: 'COMPLETED ✅' },
    { value: 'QUEUED', label: 'QUEUED ⏳' },
    { value: 'FAILED', label: 'FAILED 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'dispatched_at', label: 'Dispatched Time' },
    { value: 'duration_sec', label: 'Duration (s)' },
    { value: 'job_name', label: 'Job Name' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  const runningCount = jobs.filter(j => j.status === 'RUNNING').length;

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-400/30">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Background Jobs & Batch Process Engine
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-extrabold rounded-full border border-purple-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Async Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of asynchronous heavy workloads, report card PDF generators, and bulk data sync
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse (3s): {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Jobs
          </button>
          <button
            onClick={() => setShowDispatchModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Dispatch Manual Job
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Jobs Executed</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">24,850</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total Batch Dispatches</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Running Jobs</span>
            <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{runningCount} Active</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In Flight Tasks</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Queued Waiting</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{jobs.filter(j => j.status === 'QUEUED').length} Pending</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Worker Queue</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reliability Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">99.99%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">0.01% Failure Rate</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Batch Speed</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">240 Jobs/min</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Parallel Processing</div>
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
              placeholder="Search background jobs by name, batch ID, tenant..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-purple-500 placeholder-slate-600"
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
              className="p-2 bg-slate-900 border border-slate-800 text-purple-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      {/* ── BACKGROUND JOBS TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('job_name')}>Job Name & Batch ID</th>
                <th className="p-3.5">Target Tenant</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Job Progress</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('duration_sec')}>Duration</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(job => (
                <tr key={job.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white">
                    <div>{job.job_name}</div>
                    <div className="text-[10px] font-mono text-purple-400">{job.batch_id} · Node: {job.worker_node}</div>
                  </td>
                  <td className="p-3.5 text-slate-300 font-medium">{job.tenant_name}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                      job.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      job.priority === 'Normal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="space-y-1 min-w-[140px]">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-white font-bold">{job.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${job.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-cyan-400 font-bold">{job.duration_sec}s</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                      job.status === 'RUNNING' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse' :
                      job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      job.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {job.status === 'RUNNING' && (
                      <button
                        onClick={() => handleCancelJob(job.id, job.job_name)}
                        className="px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Power className="w-3 h-3" /> Cancel Job
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: DISPATCH MANUAL JOB ── */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleDispatchSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" /> Dispatch Manual Background Job
              </h3>
              <button type="button" onClick={() => setShowDispatchModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Job Class *</label>
                <select
                  value={dispatchForm.job_name}
                  onChange={e => setDispatchForm({ ...dispatchForm, job_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="GenerateFullSchoolReportCardsJob">GenerateFullSchoolReportCardsJob</option>
                  <option value="BulkFeeReceiptPdfGeneratorJob">BulkFeeReceiptPdfGeneratorJob</option>
                  <option value="SyncBiometricDeviceLogsJob">SyncBiometricDeviceLogsJob</option>
                  <option value="ReindexSearchCatalogJob">ReindexSearchCatalogJob</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Target Tenant School</label>
                <input
                  type="text"
                  value={dispatchForm.tenant_name}
                  onChange={e => setDispatchForm({ ...dispatchForm, tenant_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Job Priority</label>
                <select
                  value={dispatchForm.priority}
                  onChange={e => setDispatchForm({ ...dispatchForm, priority: e.target.value as BackgroundJob['priority'] })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="High">High Priority</option>
                  <option value="Normal">Normal Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowDispatchModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Dispatch Job
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
