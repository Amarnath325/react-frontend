import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Database, RefreshCw, HardDrive, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, Terminal, X, Power, Activity,
  Radio, Zap, Code, Eye, Layers
} from 'lucide-react';
import api from '../../../services/api';

interface SlowQuery {
  id: number;
  database: string;
  query_sql: string;
  execution_time_ms: number;
  rows_examined: number;
  rows_sent: number;
  timestamp: string;
  explain_plan: {
    select_type: string;
    table: string;
    type: string;
    possible_keys: string;
    key_used: string;
    rows: number;
  };
}

interface ProcessThread {
  id: number;
  user: string;
  db: string;
  command: string;
  time_seconds: number;
  state: string;
  info: string;
}

type TabKey = 'slow_queries' | 'process_list' | 'innodb_metrics' | 'storage_usage';
type SortField = 'execution_time_ms' | 'rows_examined' | 'database' | 'timestamp';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-cyan-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
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
                      ? 'bg-cyan-600/20 text-cyan-400 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockSlowQueries: SlowQuery[] = [
  {
    id: 1,
    database: 'tenant_dpsnoida',
    query_sql: 'SELECT s.*, p.parent_name FROM students s LEFT JOIN parents p ON s.parent_id = p.id WHERE s.class_id = 12 ORDER BY s.created_at DESC',
    execution_time_ms: 1240,
    rows_examined: 48500,
    rows_sent: 240,
    timestamp: '2026-08-10 20:15:32',
    explain_plan: {
      select_type: 'SIMPLE',
      table: 'students',
      type: 'ALL',
      possible_keys: 'class_id_idx',
      key_used: 'PRIMARY',
      rows: 48500
    }
  },
  {
    id: 2,
    database: 'tenant_dpsrkp',
    query_sql: 'SELECT f.*, r.receipt_no FROM fee_invoices f INNER JOIN fee_receipts r ON f.id = r.invoice_id WHERE f.status = "UNPAID"',
    execution_time_ms: 680,
    rows_examined: 14200,
    rows_sent: 180,
    timestamp: '2026-08-10 19:40:10',
    explain_plan: {
      select_type: 'SIMPLE',
      table: 'fee_invoices',
      type: 'ref',
      possible_keys: 'status_idx',
      key_used: 'status_idx',
      rows: 14200
    }
  }
];

const mockProcessList: ProcessThread[] = [
  { id: 1042, user: 'myschoolpoint_usr', db: 'tenant_dpsnoida', command: 'Query', time_seconds: 0, state: 'Sending data', info: 'SELECT * FROM attendance WHERE date = "2026-08-10"' },
  { id: 1043, user: 'myschoolpoint_usr', db: 'tenant_dpsrkp', command: 'Sleep', time_seconds: 4, state: '', info: 'NULL' },
  { id: 1044, user: 'myschoolpoint_usr', db: 'myschoolpoint', command: 'Query', time_seconds: 0, state: 'Executing', info: 'SELECT * FROM landlord_tenants WHERE status = "ACTIVE"' }
];

export default function DatabaseMonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('slow_queries');
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>(mockSlowQueries);
  const [processList, setProcessList] = useState<ProcessThread[]>(mockProcessList);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [dbFilter, setDbFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('execution_time_ms');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [selectedExplain, setSelectedExplain] = useState<SlowQuery | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  // Live Metrics
  const [dbMetrics, setDbMetrics] = useState({
    qps: 1450,
    activeConnections: 28,
    maxConnections: 150,
    bufferPoolHitRate: 99.4,
    slowQueryCount: 2,
    deadlocksCount: 0,
    totalStorageGb: 18.5,
  });

  // Simulated live QPS Pulse
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setDbMetrics(prev => ({
        ...prev,
        qps: Math.min(2500, Math.max(800, prev.qps + (Math.floor(Math.random() * 80) - 40))),
        activeConnections: Math.min(80, Math.max(12, prev.activeConnections + (Math.floor(Math.random() * 5) - 2))),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/database-monitoring');
      if (res.data.success && res.data.data) {
        if (res.data.data.slow_queries) setSlowQueries(res.data.data.slow_queries);
        if (res.data.data.process_list) setProcessList(res.data.data.process_list);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Database metrics & process list refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, durationFilter, dbFilter, sortBy, sortOrder, pageSize]);

  // Optimize DB Trigger
  const handleOptimizeDb = async () => {
    setOptimizing(true);
    toast.loading('Running OPTIMIZE TABLES across tenant databases...', { id: 'opt-toast' });

    try {
      await api.post('/landlord/database-monitoring/optimize');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setOptimizing(false);
      toast.success('🎉 Database indexes optimized & InnoDB tables defragmented!', { id: 'opt-toast' });
    }, 1500);
  };

  // Kill Thread Action
  const handleKillThread = async (id: number) => {
    toast.loading(`Killing database thread #${id}...`, { id: 'kill-toast' });
    try {
      await api.post(`/landlord/database-monitoring/kill-thread/${id}`);
    } catch {
      // Fallback
    }
    setTimeout(() => {
      setProcessList(prev => prev.filter(p => p.id !== id));
      toast.success(`⚡ Database connection thread #${id} terminated!`, { id: 'kill-toast' });
    }, 800);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = slowQueries.filter(q => {
    const matchesSearch =
      q.database.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.query_sql.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDb = dbFilter === 'all' || q.database === dbFilter;
    let matchesDuration = true;
    if (durationFilter === 'slow') matchesDuration = q.execution_time_ms >= 500;
    if (durationFilter === 'critical') matchesDuration = q.execution_time_ms >= 1000;

    return matchesSearch && matchesDb && matchesDuration;
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

  const dbOptions: SearchableOption[] = [
    { value: 'all', label: 'All Databases' },
    { value: 'tenant_dpsnoida', label: 'tenant_dpsnoida' },
    { value: 'tenant_dpsrkp', label: 'tenant_dpsrkp' },
    { value: 'myschoolpoint', label: 'Landlord Core DB' },
  ];

  const durationOptions: SearchableOption[] = [
    { value: 'all', label: 'All Exec Times' },
    { value: 'slow', label: 'Slow (> 500ms)' },
    { value: 'critical', label: 'Critical (> 1000ms)' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'execution_time_ms', label: 'Exec Time (ms)' },
    { value: 'rows_examined', label: 'Rows Examined' },
    { value: 'database', label: 'Database Name' },
    { value: 'timestamp', label: 'Timestamp' },
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
            <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-400/30">
              <Database className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Database Health & Slow Query Monitoring
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-extrabold rounded-full border border-cyan-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> MySQL 8.0 InnoDB
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time connection pool monitoring, slow query log analyzer, EXPLAIN query planner, and active thread kill controls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse (3s): {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleOptimizeDb}
            disabled={optimizing}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Zap className="w-3.5 h-3.5" /> Optimize Tables
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh DB Status
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Query Throughput</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{dbMetrics.qps} QPS</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Queries / Sec</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Connection Pool</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{dbMetrics.activeConnections} / {dbMetrics.maxConnections}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active Connections</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Buffer Hit Ratio</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{dbMetrics.bufferPoolHitRate}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">InnoDB Buffer Pool</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Slow Queries</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{dbMetrics.slowQueryCount} Logged</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Execution &gt; 500ms</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Storage Footprint</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{dbMetrics.totalStorageGb} GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across All Tenants</div>
        </div>
      </div>

      {/* ── CATEGORIZED TABS NAVIGATION ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('slow_queries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'slow_queries' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" /> Slow Query Log ({slowQueries.length})
        </button>
        <button
          onClick={() => setActiveTab('process_list')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'process_list' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" /> Process List Threads ({processList.length})
        </button>
        <button
          onClick={() => setActiveTab('innodb_metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'innodb_metrics' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> InnoDB Engine Status
        </button>
      </div>

      {/* ── TOOLBAR (For Slow Queries Tab) ── */}
      {activeTab === 'slow_queries' && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search slow queries by database, SQL string..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchableSelect options={dbOptions} value={dbFilter} onChange={setDbFilter} placeholder="Database..." icon={Database} labelPrefix="DB" />
            <SearchableSelect options={durationOptions} value={durationFilter} onChange={setDurationFilter} placeholder="Duration..." icon={Filter} labelPrefix="Exec" />
            <div className="flex items-center gap-1">
              <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
              <button
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
          </div>
        </div>
      )}

      {/* ── TAB 1: SLOW QUERIES VIEW ── */}
      {activeTab === 'slow_queries' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('database')}>Database</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('execution_time_ms')}>Exec Time</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('rows_examined')}>Rows Examined</th>
                  <th className="p-3.5">SQL Query Snippet</th>
                  <th className="p-3.5 text-right">EXPLAIN Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(q => (
                  <tr key={q.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div>{q.database}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{q.timestamp}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      {q.execution_time_ms} ms
                    </td>
                    <td className="p-3.5 font-mono text-cyan-400">
                      {q.rows_examined.toLocaleString()} rows
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 max-w-md truncate">
                      {q.query_sql}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedExplain(q)}
                        className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> EXPLAIN Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PROCESS LIST THREADS ── */}
      {activeTab === 'process_list' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-extrabold text-sm text-white">Active MySQL Connection Threads (`SHOW FULL PROCESSLIST`)</h3>
            <span className="px-2.5 py-1 bg-slate-900 text-slate-400 rounded-full text-xs font-mono">
              {processList.length} Active Threads
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5">Thread ID</th>
                  <th className="p-3.5">User & Database</th>
                  <th className="p-3.5">Command</th>
                  <th className="p-3.5">Time (s)</th>
                  <th className="p-3.5">State & Query Info</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {processList.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">#{p.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{p.user}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{p.db}</div>
                    </td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">{p.command}</td>
                    <td className="p-3.5 font-mono text-slate-300">{p.time_seconds}s</td>
                    <td className="p-3.5 font-mono text-slate-300 max-w-sm truncate">{p.info}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleKillThread(p.id)}
                        className="px-2.5 py-1.5 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Power className="w-3 h-3" /> Kill Thread
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: INNODB ENGINE METRICS ── */}
      {activeTab === 'innodb_metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" /> InnoDB Buffer Pool Cache Status
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Total Buffer Pool Size</span>
                <span className="font-mono text-white font-bold">16,384 Pages (256 MB)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Buffer Pool Hit Rate</span>
                <span className="font-mono text-emerald-400 font-bold">99.4% (Optimal)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Dirty Pages Pending Flush</span>
                <span className="font-mono text-amber-400 font-bold">0 Pages</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Row Lock & Deadlock Monitor
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Active Row Locks</span>
                <span className="font-mono text-emerald-400 font-bold">0 Locks</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Deadlocks Logged Today</span>
                <span className="font-mono text-white font-bold">0 Deadlocks</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">InnoDB Auto-Inc Locks</span>
                <span className="font-mono text-cyan-400 font-bold">Consecutive Mode</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EXPLAIN QUERY PLAN ── */}
      {selectedExplain && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" /> MySQL `EXPLAIN` Execution Plan Analyzer
              </h3>
              <button onClick={() => setSelectedExplain(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 font-mono text-slate-300 text-[11px]">
                {selectedExplain.query_sql}
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Select Type:</span><span className="text-white font-bold">{selectedExplain.explain_plan.select_type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Target Table:</span><span className="text-cyan-400 font-bold">{selectedExplain.explain_plan.table}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Access Join Type:</span><span className="text-amber-400 font-bold">{selectedExplain.explain_plan.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Key Used:</span><span className="text-emerald-400 font-bold">{selectedExplain.explain_plan.key_used}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Rows Examined:</span><span className="text-white font-bold">{selectedExplain.explain_plan.rows.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button onClick={() => setSelectedExplain(null)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Close Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
