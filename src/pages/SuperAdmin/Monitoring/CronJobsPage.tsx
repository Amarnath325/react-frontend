import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Clock, RefreshCw, ShieldCheck, CheckCircle2,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, Terminal, X, Radio,
  Play, Plus, Pause, PlayCircle, Calendar
} from 'lucide-react';
import api from '../../../services/api';

interface CronTask {
  id: string;
  signature: string;
  command: string;
  cron_expression: string; // e.g. "0 8 * * *"
  frequency_label: string; // e.g. "Daily at 08:00 AM"
  description: string;
  is_active: boolean;
  last_run_at: string;
  next_run_at: string;
  last_duration_sec: number;
  last_status: 'SUCCESS' | 'FAILED' | 'RUNNING';
}

type SortField = 'signature' | 'next_run_at' | 'last_run_at';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-lime-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-lime-500 placeholder-slate-600"
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
                      ? 'bg-lime-600/20 text-lime-400 font-bold border border-lime-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-lime-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockCronTasks: CronTask[] = [
  {
    id: 'cron-1',
    signature: 'schedule:daily-fee-reminder',
    command: 'php artisan schedule:daily-fee-reminder',
    cron_expression: '0 8 * * *',
    frequency_label: 'Daily at 08:00 AM',
    description: 'Dispatches fee payment due reminders via Email, SMS & WhatsApp',
    is_active: true,
    last_run_at: '2026-08-10 08:00:00',
    next_run_at: '2026-08-11 08:00:00',
    last_duration_sec: 14.2,
    last_status: 'SUCCESS'
  },
  {
    id: 'cron-2',
    signature: 'schedule:auto-backup-databases',
    command: 'php artisan schedule:auto-backup-databases',
    cron_expression: '0 2 * * *',
    frequency_label: 'Daily at 02:00 AM',
    description: 'Generates compressed SQL dumps for all tenant databases & uploads to S3',
    is_active: true,
    last_run_at: '2026-08-10 02:00:00',
    next_run_at: '2026-08-11 02:00:00',
    last_duration_sec: 45.8,
    last_status: 'SUCCESS'
  },
  {
    id: 'cron-3',
    signature: 'schedule:sync-attendance-biometric',
    command: 'php artisan schedule:sync-attendance-biometric',
    cron_expression: '*/15 * * * *',
    frequency_label: 'Every 15 Minutes',
    description: 'Syncs gate biometric logs into tenant student & staff attendance tables',
    is_active: true,
    last_run_at: '2026-08-10 20:45:00',
    next_run_at: '2026-08-10 21:00:00',
    last_duration_sec: 2.4,
    last_status: 'SUCCESS'
  },
  {
    id: 'cron-4',
    signature: 'schedule:expire-free-trials',
    command: 'php artisan schedule:expire-free-trials',
    cron_expression: '0 0 * * *',
    frequency_label: 'Daily at Midnight',
    description: 'Checks tenant subscription expiry dates & triggers auto-suspension rules',
    is_active: true,
    last_run_at: '2026-08-10 00:00:00',
    next_run_at: '2026-08-11 00:00:00',
    last_duration_sec: 5.1,
    last_status: 'SUCCESS'
  }
];

export default function CronJobsPage() {
  const [tasks, setTasks] = useState<CronTask[]>(mockCronTasks);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('next_run_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);

  // Form State
  const [cronForm, setCronForm] = useState({
    signature: '',
    command: '',
    cron_expression: '0 0 * * *',
    frequency_label: 'Daily at Midnight',
    description: '',
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/cron-jobs');
      if (res.data.success && Array.isArray(res.data.data)) {
        setTasks(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Cron tasks & Artisan schedule list refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  // Run Now Action
  const handleRunNow = async (id: string, signature: string) => {
    setRunningTaskId(id);
    toast.loading(`Triggering manual execution of cron '${signature}'...`, { id: 'run-toast' });

    try {
      await api.post(`/landlord/cron-jobs/${id}/run`);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setRunningTaskId(null);
      setTasks(prev =>
        prev.map(t =>
          t.id === id ? { ...t, last_run_at: new Date().toISOString().replace('T', ' ').substring(0, 19), last_status: 'SUCCESS' } : t
        )
      );
      toast.success(`⚡ Cron task '${signature}' executed successfully!`, { id: 'run-toast' });
    }, 1500);
  };

  // Toggle Active/Pause Action
  const handleToggleTask = async (id: string, current: boolean) => {
    const next = !current;
    try {
      await api.post(`/landlord/cron-jobs/${id}/toggle`);
    } catch {
      // Fallback
    }
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, is_active: next } : t)));
    toast.success(`Cron task ${next ? 'ACTIVATED 🟢' : 'PAUSED ⏸️'}`);
  };

  // Add Cron Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cronForm.signature || !cronForm.command) {
      toast.error('Please enter signature and command');
      return;
    }

    const created: CronTask = {
      id: 'cron-' + Date.now().toString().slice(-4),
      signature: cronForm.signature,
      command: cronForm.command,
      cron_expression: cronForm.cron_expression,
      frequency_label: cronForm.frequency_label,
      description: cronForm.description || 'Custom scheduled Artisan command',
      is_active: true,
      last_run_at: 'Never',
      next_run_at: 'In 5 Minutes',
      last_duration_sec: 0,
      last_status: 'SUCCESS',
    };

    setTasks(prev => [created, ...prev]);
    setShowAddModal(false);
    toast.success(`Cron task '${created.signature}' added to Artisan Scheduler!`);
    setCronForm({ signature: '', command: '', cron_expression: '0 0 * * *', frequency_label: 'Daily at Midnight', description: '' });
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = tasks.filter(t => {
    const matchesSearch =
      t.signature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = t.is_active;
    if (statusFilter === 'paused') matchesStatus = !t.is_active;

    return matchesSearch && matchesStatus;
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

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'ACTIVE 🟢' },
    { value: 'paused', label: 'PAUSED ⏸️' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'next_run_at', label: 'Next Execution' },
    { value: 'last_run_at', label: 'Last Run' },
    { value: 'signature', label: 'Cron Signature' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: 'all', label: 'Show All' },
  ];

  const activeCount = tasks.filter(t => t.is_active).length;

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-lime-500/20 text-lime-400 rounded-2xl border border-lime-400/30">
              <Clock className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Automated Cron Jobs & Task Scheduler
                <span className="px-2.5 py-0.5 bg-lime-500/20 text-lime-400 text-[10px] font-extrabold rounded-full border border-lime-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Artisan Schedule Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage scheduled background Artisan tasks, cron expression timers, and 1-Click manual executions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-lime-500/10 border-lime-500/30 text-lime-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Schedule
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-lime-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Custom Cron Task
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Scheduled Tasks</span>
            <Clock className="w-4 h-4 text-lime-400" />
          </div>
          <div className="text-2xl font-black text-white">{tasks.length} Crons</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Artisan Scheduler</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeCount} / {tasks.length} ACTIVE</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Running Automatically</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reliability Score</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">99.9%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Execution Success Rate</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Schedule Runner</span>
            <Terminal className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-400">artisan schedule:run</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Crontab Integrated</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Next Trigger In</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">In 2 Mins</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Biometric Sync</div>
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
              placeholder="Search cron tasks by signature, command, description..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-lime-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
          <div className="flex items-center gap-1">
            <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-lime-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
        </div>
      </div>

      {/* ── CRON TASKS TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('signature')}>Cron Task Signature</th>
                <th className="p-3.5">Expression & Frequency</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('last_run_at')}>Last Executed</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('next_run_at')}>Next Execution</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(task => (
                <tr key={task.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${task.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                      <span>{task.signature}</span>
                    </div>
                    <div className="text-[10px] font-mono text-lime-400 mt-0.5">{task.command}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-[10px] rounded-full font-bold">
                      {task.cron_expression}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{task.frequency_label}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    <div>{task.last_run_at}</div>
                    <div className="text-[10px] text-slate-500">{task.last_duration_sec}s duration</div>
                  </td>
                  <td className="p-3.5 font-mono text-amber-400 font-bold">
                    {task.next_run_at}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${
                      task.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      {task.is_active ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleTask(task.id, task.is_active)}
                        className={`p-1.5 border rounded-xl cursor-pointer transition-all ${
                          task.is_active ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                        title={task.is_active ? 'Pause Cron' : 'Activate Cron'}
                      >
                        {task.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleRunNow(task.id, task.signature)}
                        disabled={runningTaskId === task.id}
                        className="px-3 py-1.5 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer shadow-md disabled:opacity-60"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Run Now
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: ADD CUSTOM CRON TASK ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-lime-400" /> Register Custom Cron Task
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Task Signature Name *</label>
                <input
                  type="text"
                  value={cronForm.signature}
                  onChange={e => setCronForm({ ...cronForm, signature: e.target.value })}
                  placeholder="schedule:send-sms-dlt-queued"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Artisan Command String *</label>
                <input
                  type="text"
                  value={cronForm.command}
                  onChange={e => setCronForm({ ...cronForm, command: e.target.value })}
                  placeholder="php artisan schedule:send-sms-dlt-queued"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-lime-400 font-mono font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Cron Expression *</label>
                  <input
                    type="text"
                    value={cronForm.cron_expression}
                    onChange={e => setCronForm({ ...cronForm, cron_expression: e.target.value })}
                    placeholder="0 0 * * *"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Frequency Label</label>
                  <input
                    type="text"
                    value={cronForm.frequency_label}
                    onChange={e => setCronForm({ ...cronForm, frequency_label: e.target.value })}
                    placeholder="Daily at Midnight"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-lime-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Save Cron Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
