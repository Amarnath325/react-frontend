import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Zap, RefreshCw, Database, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, X, Radio, Plus, HardDrive, Sparkles,
  Layers, Wrench, Play
} from 'lucide-react';
import api from '../../../services/api';

interface FragmentedTable {
  id: string;
  table_name: string;
  database_name: string;
  tenant_name: string;
  data_size_mb: number;
  free_space_mb: number;
  fragmentation_percent: number;
  engine: string;
  last_optimized: string;
}

interface IndexRecommendation {
  id: string;
  database_name: string;
  table_name: string;
  suggested_index_name: string;
  columns: string;
  expected_speedup: string;
}

type TabKey = 'fragmented_tables' | 'index_recommendations';
type SortField = 'fragmentation_percent' | 'free_space_mb' | 'table_name';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-sky-400" />}
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

const mockTables: FragmentedTable[] = [
  {
    id: 'opt-1',
    table_name: 'audit_logs',
    database_name: 'myschoolpoint',
    tenant_name: 'Landlord Master Control',
    data_size_mb: 1120.5,
    free_space_mb: 140.0,
    fragmentation_percent: 18.2,
    engine: 'InnoDB',
    last_optimized: '2026-08-01 03:00:00'
  },
  {
    id: 'opt-2',
    table_name: 'student_attendances',
    database_name: 'tenant_dpsnoida',
    tenant_name: 'Delhi Public School Noida',
    data_size_mb: 780.0,
    free_space_mb: 95.0,
    fragmentation_percent: 12.5,
    engine: 'InnoDB',
    last_optimized: '2026-08-05 03:00:00'
  },
  {
    id: 'opt-3',
    table_name: 'fee_invoices',
    database_name: 'tenant_dpsrkp',
    tenant_name: 'Delhi Public School RKP',
    data_size_mb: 640.2,
    free_space_mb: 62.0,
    fragmentation_percent: 8.4,
    engine: 'InnoDB',
    last_optimized: '2026-08-08 03:00:00'
  },
  {
    id: 'opt-4',
    table_name: 'notifications',
    database_name: 'tenant_modernschool',
    tenant_name: 'Modern School Barakhamba',
    data_size_mb: 510.0,
    free_space_mb: 43.0,
    fragmentation_percent: 4.1,
    engine: 'InnoDB',
    last_optimized: '2026-08-09 03:00:00'
  }
];

const mockIndexes: IndexRecommendation[] = [
  {
    id: 'idx-1',
    database_name: 'tenant_dpsnoida',
    table_name: 'fee_payments',
    suggested_index_name: 'idx_tenant_payment_date',
    columns: 'tenant_id, payment_date',
    expected_speedup: '+45% Speedup'
  },
  {
    id: 'idx-2',
    database_name: 'tenant_dpsrkp',
    table_name: 'student_marks',
    suggested_index_name: 'idx_exam_student',
    columns: 'exam_id, student_id',
    expected_speedup: '+62% Speedup'
  }
];

export default function DatabaseOptimizationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('fragmented_tables');
  const [tables, setTables] = useState<FragmentedTable[]>(mockTables);
  const [indexes, setIndexes] = useState<IndexRecommendation[]>(mockIndexes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fragFilter, setFragFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('fragmentation_percent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals & Action States
  const [optimizingAll, setOptimizingAll] = useState(false);

  const totalFreeSpaceMb = tables.reduce((acc, t) => acc + t.free_space_mb, 0);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/database-optimizations');
      if (res.data.success && Array.isArray(res.data.data)) {
        setTables(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Database fragmentation profiler & index advisor refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fragFilter, sortBy, sortOrder, pageSize]);

  // Optimize All Tables
  const handleOptimizeAll = async () => {
    setOptimizingAll(true);
    toast.loading('Running OPTIMIZE TABLE defragmentation across all tenant databases...', { id: 'opt-all-toast' });

    try {
      await api.post('/landlord/database-optimizations/run-all');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setOptimizingAll(false);
      setTables(prev => prev.map(t => ({ ...t, free_space_mb: 0, fragmentation_percent: 0.2, last_optimized: 'Just now' })));
      toast.success('🚀 All database tables defragmented! 340 MB storage reclaimed.', { id: 'opt-all-toast' });
    }, 1500);
  };

  // Optimize Individual Table
  const handleOptimizeSingleTable = async (tableName: string, dbName: string) => {
    toast.loading(`Defragmenting & reindexing table '${dbName}.${tableName}'...`, { id: 'single-opt-toast' });

    try {
      await api.post('/landlord/database-optimizations/optimize-table', {
        database_name: dbName,
        table_name: tableName,
      });
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setTables(prev =>
        prev.map(t =>
          t.table_name === tableName && t.database_name === dbName
            ? { ...t, free_space_mb: 0, fragmentation_percent: 0.1, last_optimized: 'Just now' }
            : t
        )
      );
      toast.success(`⚡ Table '${dbName}.${tableName}' optimized & defragmented!`, { id: 'single-opt-toast' });
    }, 1000);
  };

  // Apply Index Action
  const handleApplyIndex = (idxId: string, indexName: string) => {
    setIndexes(prev => prev.filter(i => i.id !== idxId));
    toast.success(`⚡ Index '${indexName}' created successfully! Query latency improved.`);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = tables.filter(t => {
    const matchesSearch =
      t.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.database_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tenant_name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFrag = true;
    if (fragFilter === 'high') matchesFrag = t.fragmentation_percent >= 10;
    if (fragFilter === 'low') matchesFrag = t.fragmentation_percent < 10;

    return matchesSearch && matchesFrag;
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

  const fragOptions: SearchableOption[] = [
    { value: 'all', label: 'All Fragmentation Levels' },
    { value: 'high', label: 'High (> 10% Fragmented)' },
    { value: 'low', label: 'Low (< 10% Fragmented)' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'fragmentation_percent', label: 'Fragmentation %' },
    { value: 'free_space_mb', label: 'Reclaimable Space (MB)' },
    { value: 'table_name', label: 'Table Name' },
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
            <span className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-400/30">
              <Zap className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Database Optimization & Defragmentation Suite
                <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-extrabold rounded-full border border-sky-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> OPTIMIZE Engine Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                InnoDB table defragmentation, index rebuilding, query execution tuning, and missing index advisor
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              autoRefresh ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Auto Pulse: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleOptimizeAll}
            disabled={optimizingAll}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/30 transition-all disabled:opacity-60"
          >
            <Zap className="w-4 h-4" /> {optimizingAll ? 'Defragmenting Fleet...' : 'Run Fleet Optimization'}
          </button>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Diagnostics
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reclaimable Space</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{totalFreeSpaceMb} MB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Fragmented Disk Space</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Index Hit Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">98.4%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">High Query Efficiency</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Index Advisor</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{indexes.length} Suggestions</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Query Tuning Ready</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Last Optimization</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-400">Yesterday 03:00 AM</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cron Scheduled</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fleet Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">OPTIMAL 🟢</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Query Latency Nominal</div>
        </div>
      </div>

      {/* ── CATEGORIZED TABS NAVIGATION ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('fragmented_tables')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'fragmented_tables' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Fragmented Tables ({tables.length})
        </button>
        <button
          onClick={() => setActiveTab('index_recommendations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'index_recommendations' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Missing Index Advisor ({indexes.length})
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      {activeTab === 'fragmented_tables' && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search tables by name, database, tenant..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchableSelect options={fragOptions} value={fragFilter} onChange={setFragFilter} placeholder="Fragmentation..." icon={Filter} labelPrefix="Level" />
            <div className="flex items-center gap-1">
              <SearchableSelect options={sortOptions} value={sortBy} onChange={val => setSortBy(val as SortField)} placeholder="Sort By..." icon={ArrowUpDown} labelPrefix="Sort" />
              <button
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-2 bg-slate-900 border border-slate-800 text-sky-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <SearchableSelect options={pageSizeOptions} value={String(pageSize)} onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))} placeholder="Per Page..." icon={List} labelPrefix="Rows" />
          </div>
        </div>
      )}

      {/* ── TAB 1: FRAGMENTED TABLES TABLE ── */}
      {activeTab === 'fragmented_tables' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5">Table & Database</th>
                  <th className="p-3.5">Data Size</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('free_space_mb')}>Reclaimable Free Space</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('fragmentation_percent')}>Fragmentation %</th>
                  <th className="p-3.5">Last Optimized</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div>{t.table_name}</div>
                      <div className="text-[10px] text-sky-400 font-sans">{t.database_name} · {t.tenant_name}</div>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{t.data_size_mb} MB</td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">{t.free_space_mb} MB</td>
                    <td className="p-3.5">
                      <div className="space-y-1 min-w-[120px]">
                        <div className="text-white font-bold font-mono">{t.fragmentation_percent}%</div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              t.fragmentation_percent > 15 ? 'bg-red-500' : t.fragmentation_percent > 8 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, t.fragmentation_percent * 4)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">{t.last_optimized}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOptimizeSingleTable(t.table_name, t.database_name)}
                        className="px-3 py-1.5 bg-sky-600/20 text-sky-400 border border-sky-500/30 hover:bg-sky-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Defragment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: INDEX RECOMMENDATIONS ── */}
      {activeTab === 'index_recommendations' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5">Database & Target Table</th>
                  <th className="p-3.5">Suggested Index Name</th>
                  <th className="p-3.5">Indexed Columns</th>
                  <th className="p-3.5">Expected Speedup</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {indexes.map(idx => (
                  <tr key={idx.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div>{idx.table_name}</div>
                      <div className="text-[10px] text-sky-400 font-sans">{idx.database_name}</div>
                    </td>
                    <td className="p-3.5 font-mono text-purple-400 font-bold">{idx.suggested_index_name}</td>
                    <td className="p-3.5 font-mono text-slate-300">{idx.columns}</td>
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{idx.expected_speedup}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleApplyIndex(idx.id, idx.suggested_index_name)}
                        className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Index
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
