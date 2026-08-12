import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft, Server, AlertCircle, CheckCircle, Clock, RefreshCw,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check,
  List, LayoutGrid, Zap, Pause, X, RotateCcw, Activity, Info,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

interface MigrationJob {
  id: number;
  school_name: string;
  school_code: string;
  db_name: string;
  from_server: string;
  to_server: string;
  strategy: 'zero_downtime' | 'cold_dump';
  db_size_mb: number;
  progress_percent: number;
  status: 'completed' | 'in_progress' | 'queued' | 'failed' | 'paused';
  started_at: string;
  completed_at?: string;
  duration: string;
  migration_logs: string[];
  error_message?: string;
}

type SortField = 'started_at' | 'school_name' | 'db_size_mb' | 'status';
type SortOrder = 'asc' | 'desc';
type PageSizeOption = 5 | 10 | 25 | 50 | 'all';

interface SearchableOption {
  value: string;
  label: string;
}

// Custom Searchable Select Dropdown
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
        {Icon && <Icon className="w-3.5 h-3.5 text-sky-400" />}
        {labelPrefix && <span className="text-[11px] text-slate-400 font-bold">{labelPrefix}:</span>}
        <span className="truncate max-w-[130px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
          <div className="relative mb-1">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search option..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
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
                      ? 'bg-sky-600/20 text-sky-400 font-bold border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockMigrations: MigrationJob[] = [
  {
    id: 1,
    school_name: 'Delhi Public School (Noida)',
    school_code: 'dps_noida',
    db_name: 'school_dps_noida',
    from_server: 'server-01 (Shared MySQL)',
    to_server: 'server-03 (AWS Dedicated RDS)',
    strategy: 'zero_downtime',
    db_size_mb: 412,
    progress_percent: 100,
    status: 'completed',
    started_at: '2026-07-20 02:15 PM',
    completed_at: '2026-07-20 02:19 PM',
    duration: '4m 12s',
    migration_logs: [
      '[02:15:01] Pre-flight disk storage headroom verified (320 GB free on target server-03).',
      '[02:15:10] Binary log CDC streaming initialized from server-01.',
      '[02:16:30] Initial snapshot dump & load completed (412 MB in 80 seconds).',
      '[02:18:45] CDC Replication caught up: delta lag is 0ms.',
      '[02:19:12] Router connection swapped to server-03. Migration SUCCESSful.'
    ]
  },
  {
    id: 2,
    school_name: 'St. Mary\'s Convent Senior Sec School',
    school_code: 'st_marys',
    db_name: 'school_st_marys',
    from_server: 'server-01 (Shared MySQL)',
    to_server: 'server-02 (High IOPS SSD)',
    strategy: 'zero_downtime',
    db_size_mb: 285,
    progress_percent: 68,
    status: 'in_progress',
    started_at: '2026-08-05 10:00 PM',
    duration: 'Running (2m 45s)',
    migration_logs: [
      '[22:00:02] Target node server-02 connection handshake OK.',
      '[22:00:15] Streaming table data chunk 4 of 6 (school_st_marys.exam_marks)...',
      '[22:01:40] CDC binlog synchronization active.'
    ]
  },
  {
    id: 3,
    school_name: 'Oxford High International School',
    school_code: 'oxford_high',
    db_name: 'school_oxford_high',
    from_server: 'server-02 (High IOPS SSD)',
    to_server: 'server-04 (Dedicated Cluster)',
    strategy: 'zero_downtime',
    db_size_mb: 198,
    progress_percent: 0,
    status: 'queued',
    started_at: '2026-08-05 11:30 PM',
    duration: 'Scheduled',
    migration_logs: [
      '[Queued] Awaiting completion of active job #2.'
    ]
  },
  {
    id: 4,
    school_name: 'Green Valley Convent',
    school_code: 'green_valley',
    db_name: 'school_green_valley',
    from_server: 'server-01 (Shared MySQL)',
    to_server: 'server-02 (High IOPS SSD)',
    strategy: 'cold_dump',
    db_size_mb: 85,
    progress_percent: 45,
    status: 'failed',
    started_at: '2026-07-31 03:00 PM',
    duration: '1m 05s (Aborted)',
    error_message: 'Target server disk quota exceeded or MySQL port 3306 timeout.',
    migration_logs: [
      '[15:00:01] Cold dump backup file generated: school_green_valley_backup.sql',
      '[15:01:06] ERROR: Remote connection reset by peer during table import. Migration aborted.'
    ]
  }
];

export default function TenantMigrationPage() {
  const [migrations, setMigrations] = useState<MigrationJob[]>(mockMigrations);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('started_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modal States
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeLogModal, setActiveLogModal] = useState<MigrationJob | null>(null);

  // New Migration Form State
  const [newForm, setNewForm] = useState({
    school_name: 'Sunrise Public School',
    school_code: 'sunrise_ps',
    db_name: 'school_sunrise_ps',
    from_server: 'server-01 (Shared MySQL)',
    to_server: 'server-03 (AWS Dedicated RDS)',
    strategy: 'zero_downtime' as MigrationJob['strategy'],
    db_size_mb: 150,
  });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Migration queue & server node status refreshed');
    }, 600);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, serverFilter, sortBy, sortOrder, pageSize]);

  // Schedule Migration
  const handleScheduleMigration = (e: React.FormEvent) => {
    e.preventDefault();
    const created: MigrationJob = {
      id: Date.now(),
      school_name: newForm.school_name,
      school_code: newForm.school_code,
      db_name: newForm.db_name,
      from_server: newForm.from_server,
      to_server: newForm.to_server,
      strategy: newForm.strategy,
      db_size_mb: newForm.db_size_mb,
      progress_percent: 0,
      status: 'queued',
      started_at: new Date().toLocaleString(),
      duration: 'Scheduled',
      migration_logs: [
        `[${new Date().toLocaleTimeString()}] Migration job scheduled. Pre-flight checks pending.`
      ]
    };

    setMigrations(prev => [created, ...prev]);
    setShowScheduleModal(false);
    toast.success(`Migration scheduled for ${created.school_name} ➔ ${created.to_server}`);
  };

  // Retry Migration
  const handleRetryMigration = (job: MigrationJob) => {
    setMigrations(prev =>
      prev.map(m =>
        m.id === job.id
          ? {
              ...m,
              status: 'in_progress',
              progress_percent: 25,
              duration: 'Retrying...',
              error_message: undefined,
              migration_logs: [
                ...m.migration_logs,
                `[${new Date().toLocaleTimeString()}] Retry initiated by admin.`
              ]
            }
          : m
      )
    );
    toast.success(`Retry started for ${job.school_name} migration`);
  };

  // Rollback Migration
  const handleRollbackMigration = (job: MigrationJob) => {
    if (!window.confirm(`Are you sure you want to trigger emergency rollback for "${job.school_name}" back to ${job.from_server}?`)) return;
    setMigrations(prev =>
      prev.map(m =>
        m.id === job.id
          ? {
              ...m,
              status: 'completed',
              progress_percent: 100,
              duration: 'Rolled Back',
              migration_logs: [
                ...m.migration_logs,
                `[${new Date().toLocaleTimeString()}] Emergency rollback executed. Re-pointing DNS back to ${job.from_server}.`
              ]
            }
          : m
      )
    );
    toast.error(`Emergency rollback executed for ${job.school_name}`);
  };

  // Toggle sort field
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered Dataset
  const filtered = migrations.filter(m => {
    const matchesSearch =
      m.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.db_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.from_server.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.to_server.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesServer = serverFilter === 'all' || m.to_server.includes(serverFilter);

    return matchesSearch && matchesStatus && matchesServer;
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

  // Aggregated KPI Stats
  const totalJobs = migrations.length;
  const completedJobs = migrations.filter(m => m.status === 'completed').length;
  const inProgressJobs = migrations.filter(m => m.status === 'in_progress').length;
  const queuedJobs = migrations.filter(m => m.status === 'queued').length;
  const failedJobs = migrations.filter(m => m.status === 'failed').length;

  const statusBadgeConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
    completed: { label: 'Completed (0 Downtime)', style: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: CheckCircle },
    in_progress: { label: 'Migrating Live', style: 'text-sky-400 bg-sky-400/10 border-sky-400/30', icon: RefreshCw },
    queued: { label: 'Queued', style: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: Clock },
    failed: { label: 'Migration Error', style: 'text-red-400 bg-red-400/10 border-red-400/30', icon: AlertCircle },
    paused: { label: 'Sync Paused', style: 'text-purple-400 bg-purple-400/10 border-purple-400/30', icon: Pause },
  };

  const sortOptions: SearchableOption[] = [
    { value: 'started_at', label: 'Migration Date' },
    { value: 'school_name', label: 'School Name' },
    { value: 'db_size_mb', label: 'Database Size' },
    { value: 'status', label: 'Status' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'queued', label: 'Queued' },
    { value: 'failed', label: 'Failed Only' },
  ];

  const serverOptions: SearchableOption[] = [
    { value: 'all', label: 'All Destination Nodes' },
    { value: 'server-02', label: 'server-02 (High IOPS)' },
    { value: 'server-03', label: 'server-03 (AWS RDS)' },
    { value: 'server-04', label: 'server-04 (Cluster)' },
  ];

  const pageSizeOptions: SearchableOption[] = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: 'all', label: 'Show All' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-400/30">
              <ArrowRightLeft className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Tenant Database Migration Engine
                <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-extrabold rounded-full border border-sky-400/30 uppercase tracking-wider">
                  Zero-Downtime CDC
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Hot-migrate tenant databases across MySQL nodes with binary log replication & instant DNS cutover
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Nodes
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/30 transition-all"
          >
            <Zap className="w-4 h-4" /> Schedule New Migration
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Migrations</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalJobs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Scheduled Jobs</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedJobs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero-Downtime Success</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Migrating Live</span>
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
          </div>
          <div className="text-2xl font-black text-sky-400">{inProgressJobs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">CDC Binlog Stream</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Queued</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{queuedJobs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending Pipeline</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Failures / Aborts</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{failedJobs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Requires Intervention</div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH & SEARCHABLE DROPDOWNS ── */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by school, DB name, source or target server node..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Sort By Dropdown */}
          <div className="flex items-center gap-1">
            <SearchableSelect
              options={sortOptions}
              value={sortBy}
              onChange={val => setSortBy(val as SortField)}
              placeholder="Sort By..."
              icon={ArrowUpDown}
              labelPrefix="Sort"
            />
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-900 border border-slate-800 text-sky-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 2. Status Filter Dropdown */}
          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status..."
            icon={Filter}
            labelPrefix="Status"
          />

          {/* 3. Server Node Filter Dropdown */}
          <SearchableSelect
            options={serverOptions}
            value={serverFilter}
            onChange={setServerFilter}
            placeholder="Target Server..."
            icon={Server}
            labelPrefix="Node"
          />

          {/* 4. Page Size Dropdown */}
          <SearchableSelect
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))}
            placeholder="Per Page..."
            icon={List}
            labelPrefix="Rows"
          />

          {/* 5. View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          {totalFiltered === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Server className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">No tenant migration jobs match your filter criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('school_name')}>
                      <div className="flex items-center gap-1.5">
                        Tenant School / DB
                        {sortBy === 'school_name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-sky-400" /> : <ArrowDown className="w-3 h-3 text-sky-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Source ➔ Target Node</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('db_size_mb')}>
                      <div className="flex items-center gap-1.5">
                        DB Size
                        {sortBy === 'db_size_mb' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-sky-400" /> : <ArrowDown className="w-3 h-3 text-sky-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Migration Strategy</th>
                    <th className="p-3.5">Sync Progress</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedData.map(m => {
                    const st = statusBadgeConfig[m.status] || statusBadgeConfig.queued;
                    const StatusIcon = st.icon;

                    return (
                      <tr key={m.id} className="hover:bg-slate-900/50 transition-colors">
                        {/* School & DB */}
                        <td className="p-3.5 font-bold text-white">
                          <div className="font-extrabold text-white">{m.school_name}</div>
                          <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{m.db_name}</div>
                        </td>

                        {/* Source -> Target Server */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-slate-300">{m.from_server}</span>
                            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                            <span className="font-mono text-sky-300 font-bold">{m.to_server}</span>
                          </div>
                        </td>

                        {/* Size */}
                        <td className="p-3.5 font-mono text-slate-200 font-bold">
                          {m.db_size_mb} MB
                        </td>

                        {/* Strategy */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-slate-300 uppercase">
                            {m.strategy === 'zero_downtime' ? '⚡ CDC Binlog' : '🧊 Cold Dump'}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="p-3.5 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono font-bold">
                              <span className="text-slate-400">{m.duration}</span>
                              <span className="text-sky-400">{m.progress_percent}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  m.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : m.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-sky-500'
                                }`}
                                style={{ width: `${m.progress_percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border w-fit ${st.style}`}>
                            <StatusIcon className={`w-3 h-3 ${m.status === 'in_progress' ? 'animate-spin' : ''}`} /> {st.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActiveLogModal(m)}
                              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Info className="w-3 h-3 text-sky-400" /> Logs
                            </button>

                            {m.status === 'failed' && (
                              <>
                                <button
                                  onClick={() => handleRetryMigration(m)}
                                  className="px-2.5 py-1 bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className="w-3 h-3" /> Retry
                                </button>
                                <button
                                  onClick={() => handleRollbackMigration(m)}
                                  className="px-2.5 py-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" /> Rollback
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GRID CARDS VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(m => {
            const st = statusBadgeConfig[m.status] || statusBadgeConfig.queued;

            return (
              <div key={m.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{m.school_name}</h3>
                    <div className="text-[11px] font-mono text-cyan-400 mt-0.5">{m.db_name}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${st.style}`}>
                    {st.label}
                  </span>
                </div>

                <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Source Server</span>
                    <span className="font-mono text-slate-200">{m.from_server}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target Node</span>
                    <span className="font-mono text-sky-400 font-bold">{m.to_server}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Database Size</span>
                    <span className="font-mono text-white font-bold">{m.db_size_mb} MB</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono font-bold">
                    <span className="text-slate-400">CDC Sync</span>
                    <span className="text-sky-400">{m.progress_percent}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.status === 'completed' ? 'bg-emerald-500' : m.status === 'failed' ? 'bg-red-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${m.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() => setActiveLogModal(m)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-sky-400" /> View Migration Logs
                  </button>
                  {m.status === 'failed' && (
                    <button
                      onClick={() => handleRetryMigration(m)}
                      className="px-3 py-1.5 bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAGINATION BAR ── */}
      {totalFiltered > 0 && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{pageSize === 'all' ? 1 : startIndex + 1}</strong> to{' '}
            <strong className="text-white">{pageSize === 'all' ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered)}</strong> of{' '}
            <strong className="text-white">{totalFiltered}</strong> migration jobs
          </div>

          {pageSize !== 'all' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs cursor-pointer ${
                      pageNum === validPage ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: SCHEDULE MIGRATION ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleScheduleMigration} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-sky-400" /> Schedule Tenant DB Migration
              </h3>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Tenant School Name *</label>
                <input
                  type="text"
                  value={newForm.school_name}
                  onChange={e => setNewForm({ ...newForm, school_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Target DB Name</label>
                  <input
                    type="text"
                    value={newForm.db_name}
                    onChange={e => setNewForm({ ...newForm, db_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-cyan-400 font-bold focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Estimated Size (MB)</label>
                  <input
                    type="number"
                    value={newForm.db_size_mb}
                    onChange={e => setNewForm({ ...newForm, db_size_mb: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Source Server Node</label>
                  <input
                    type="text"
                    value={newForm.from_server}
                    readOnly
                    className="w-full bg-slate-900/60 border border-slate-800/80 text-slate-400 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Destination Server Node *</label>
                  <select
                    value={newForm.to_server}
                    onChange={e => setNewForm({ ...newForm, to_server: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="server-03 (AWS Dedicated RDS)">server-03 (AWS Dedicated RDS)</option>
                    <option value="server-02 (High IOPS SSD)">server-02 (High IOPS SSD)</option>
                    <option value="server-04 (Dedicated Cluster)">server-04 (Dedicated Cluster)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Migration Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewForm({ ...newForm, strategy: 'zero_downtime' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      newForm.strategy === 'zero_downtime'
                        ? 'bg-sky-500/10 border-sky-500/50 text-white ring-1 ring-sky-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">⚡ CDC Binlog Stream</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">0 Downtime live replication</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewForm({ ...newForm, strategy: 'cold_dump' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      newForm.strategy === 'cold_dump'
                        ? 'bg-sky-500/10 border-sky-500/50 text-white ring-1 ring-sky-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">🧊 Cold Dump Import</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Offline maintenance window</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-500/30"
              >
                <Zap className="w-4 h-4" /> Schedule Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 2: MIGRATION LOGS MODAL ── */}
      {activeLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">{activeLogModal.school_name} Migration Logs</h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeLogModal.from_server} ➔ {activeLogModal.to_server}
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveLogModal(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {activeLogModal.migration_logs.map((log, i) => (
                <div key={i} className="text-slate-300">
                  {log}
                </div>
              ))}
              {activeLogModal.error_message && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-bold mt-2">
                  ❌ {activeLogModal.error_message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                DB Size: <strong className="text-white">{activeLogModal.db_size_mb} MB</strong> · Status: <strong className="text-sky-400 uppercase">{activeLogModal.status}</strong>
              </div>
              <button
                onClick={() => setActiveLogModal(null)}
                className="px-4 py-2 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
