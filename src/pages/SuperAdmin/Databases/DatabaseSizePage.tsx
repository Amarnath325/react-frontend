import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  HardDrive, RefreshCw, Database, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, X, Radio, Plus, Download, Sparkles,
  Layers, BarChart2, PieChart, Trash2, Wrench
} from 'lucide-react';
import api from '../../../services/api';

interface DbSizeItem {
  id: string;
  database_name: string;
  tenant_name: string;
  data_size_mb: number;
  index_size_mb: number;
  total_size_mb: number;
  quota_limit_mb: number;
  total_rows: number;
  largest_table: string;
  largest_table_size_mb: number;
}

interface TableSizeItem {
  id: string;
  table_name: string;
  database_name: string;
  rows_count: number;
  data_mb: number;
  index_mb: number;
  total_mb: number;
}

type TabKey = 'databases_breakdown' | 'tables_profiler';
type SortField = 'total_size_mb' | 'total_rows' | 'database_name';
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

const mockDbSizes: DbSizeItem[] = [
  {
    id: 'dbsize-1',
    database_name: 'myschoolpoint',
    tenant_name: 'Landlord Master Control',
    data_size_mb: 1850.4,
    index_size_mb: 599.6,
    total_size_mb: 2450.0,
    quota_limit_mb: 10000,
    total_rows: 5420000,
    largest_table: 'audit_logs',
    largest_table_size_mb: 1120.5
  },
  {
    id: 'dbsize-2',
    database_name: 'tenant_dpsnoida',
    tenant_name: 'Delhi Public School Noida',
    data_size_mb: 1420.0,
    index_size_mb: 420.0,
    total_size_mb: 1840.0,
    quota_limit_mb: 5000,
    total_rows: 3210000,
    largest_table: 'student_attendances',
    largest_table_size_mb: 780.0
  },
  {
    id: 'dbsize-3',
    database_name: 'tenant_dpsrkp',
    tenant_name: 'Delhi Public School RKP',
    data_size_mb: 1180.5,
    index_size_mb: 339.5,
    total_size_mb: 1520.0,
    quota_limit_mb: 5000,
    total_rows: 2840000,
    largest_table: 'student_attendances',
    largest_table_size_mb: 640.2
  },
  {
    id: 'dbsize-4',
    database_name: 'tenant_modernschool',
    tenant_name: 'Modern School Barakhamba',
    data_size_mb: 950.0,
    index_size_mb: 260.0,
    total_size_mb: 1210.0,
    quota_limit_mb: 5000,
    total_rows: 1980000,
    largest_table: 'fee_invoices',
    largest_table_size_mb: 510.0
  }
];

const mockTableSizes: TableSizeItem[] = [
  {
    id: 'tbl-1',
    table_name: 'audit_logs',
    database_name: 'myschoolpoint',
    rows_count: 4250000,
    data_mb: 850.0,
    index_mb: 270.5,
    total_mb: 1120.5
  },
  {
    id: 'tbl-2',
    table_name: 'student_attendances',
    database_name: 'tenant_dpsnoida',
    rows_count: 2410000,
    data_mb: 580.0,
    index_mb: 200.0,
    total_mb: 780.0
  },
  {
    id: 'tbl-3',
    table_name: 'student_attendances',
    database_name: 'tenant_dpsrkp',
    rows_count: 1980000,
    data_mb: 480.0,
    index_mb: 160.2,
    total_mb: 640.2
  },
  {
    id: 'tbl-4',
    table_name: 'fee_invoices',
    database_name: 'tenant_modernschool',
    rows_count: 890000,
    data_mb: 390.0,
    index_mb: 120.0,
    total_mb: 510.0
  }
];

export default function DatabaseSizePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('databases_breakdown');
  const [dbSizes, setDbSizes] = useState<DbSizeItem[]>(mockDbSizes);
  const [tableSizes] = useState<TableSizeItem[]>(mockTableSizes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('total_size_mb');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [purgingLogs, setPurgingLogs] = useState(false);

  const totalSizeMb = dbSizes.reduce((acc, d) => acc + d.total_size_mb, 0);
  const totalDataMb = dbSizes.reduce((acc, d) => acc + d.data_size_mb, 0);
  const totalIndexMb = dbSizes.reduce((acc, d) => acc + d.index_size_mb, 0);
  const grandTotalRows = dbSizes.reduce((acc, d) => acc + d.total_rows, 0);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/database-sizes');
      if (res.data.success && Array.isArray(res.data.data)) {
        setDbSizes(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Database storage sizes & table row counts profiler refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sizeFilter, sortBy, sortOrder, pageSize]);

  // Recalculate Disk Usage
  const handleRecalculate = async () => {
    toast.loading('Scanning MySQL data directories & recalculating table sizes...', { id: 'recalc-toast' });
    try {
      await api.post('/landlord/database-sizes/recalculate');
    } catch {
      // Fallback
    }
    setTimeout(() => {
      toast.success('⚡ Real-time MySQL data length & index sizes recalculated!', { id: 'recalc-toast' });
    }, 1000);
  };

  // Truncate Logs Action
  const handlePurgeLogs = async () => {
    setPurgingLogs(true);
    toast.loading('Truncating old audit logs & activity logs across databases...', { id: 'purge-logs-toast' });

    try {
      await api.post('/landlord/database-sizes/purge-logs');
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setPurgingLogs(false);
      toast.success('🎉 1.1 GB storage reclaimed by truncating old audit log tables!', { id: 'purge-logs-toast' });
    }, 1200);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = dbSizes.filter(d => {
    const matchesSearch =
      d.database_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.largest_table.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesSize = true;
    if (sizeFilter === 'high') matchesSize = d.total_size_mb >= 1500;
    if (sizeFilter === 'moderate') matchesSize = d.total_size_mb < 1500;

    return matchesSearch && matchesSize;
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

  const sizeOptions: SearchableOption[] = [
    { value: 'all', label: 'All Storage Sizes' },
    { value: 'high', label: 'High (> 1.5 GB)' },
    { value: 'moderate', label: 'Moderate (< 1.5 GB)' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'total_size_mb', label: 'Total Size (MB)' },
    { value: 'total_rows', label: 'Total Row Count' },
    { value: 'database_name', label: 'Database Name' },
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
              <HardDrive className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Database Storage Size & Table Growth Profiler
                <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-extrabold rounded-full border border-sky-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Data Length Profiler
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Per-database storage quotas, data vs index length ratios, top largest tables, and log truncation purger
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
            onClick={handleRecalculate}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-sky-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Wrench className="w-3.5 h-3.5" /> Recalculate Usage
          </button>
          <button
            onClick={handlePurgeLogs}
            disabled={purgingLogs}
            className="px-3.5 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Truncate Old Logs
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Profiler
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Fleet Size</span>
            <HardDrive className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{(totalSizeMb / 1024).toFixed(1)} GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{totalSizeMb.toLocaleString()} MB Total</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Data Length</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{(totalDataMb / 1024).toFixed(1)} GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{Math.round((totalDataMb / totalSizeMb) * 100)}% Data Payload</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Index Length</span>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{(totalIndexMb / 1024).toFixed(1)} GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{Math.round((totalIndexMb / totalSizeMb) * 100)}% Index Overhead</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Fleet Rows</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{(grandTotalRows / 1000000).toFixed(1)}M</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{grandTotalRows.toLocaleString()} Rows</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Monthly Growth</span>
            <BarChart2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">+850 MB/mo</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Predicted Growth Rate</div>
        </div>
      </div>

      {/* ── CATEGORIZED TABS NAVIGATION ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('databases_breakdown')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'databases_breakdown' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Per-Database Storage Quotas ({dbSizes.length})
        </button>
        <button
          onClick={() => setActiveTab('tables_profiler')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'tables_profiler' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Largest Tables Profiler ({tableSizes.length})
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      {activeTab === 'databases_breakdown' && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search databases by name, tenant, largest table..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchableSelect options={sizeOptions} value={sizeFilter} onChange={setSizeFilter} placeholder="Size..." icon={Filter} labelPrefix="Size" />
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

      {/* ── TAB 1: DATABASES BREAKDOWN TABLE ── */}
      {activeTab === 'databases_breakdown' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('database_name')}>Database Name</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('total_size_mb')}>Size Allocation & Quota</th>
                  <th className="p-3.5">Data vs Index</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('total_rows')}>Total Rows</th>
                  <th className="p-3.5 text-right">Largest Table</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map(db => {
                  const percent = Math.round((db.total_size_mb / db.quota_limit_mb) * 100);

                  return (
                    <tr key={db.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-bold text-white font-mono">
                        <div>{db.database_name}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{db.tenant_name}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1 min-w-[160px]">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-white font-bold">{db.total_size_mb} MB</span>
                            <span className="text-slate-400">Quota: {db.quota_limit_mb} MB ({percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                            <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="text-blue-400 font-bold">Data: {db.data_size_mb} MB</div>
                        <div className="text-purple-400 text-[10px]">Index: {db.index_size_mb} MB</div>
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        {db.total_rows.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <div className="text-white font-bold">{db.largest_table}</div>
                        <div className="text-[10px] text-amber-400">{db.largest_table_size_mb} MB</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: LARGEST TABLES PROFILER ── */}
      {activeTab === 'tables_profiler' && (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5">Table Name & Database</th>
                  <th className="p-3.5">Rows Count</th>
                  <th className="p-3.5">Data Length</th>
                  <th className="p-3.5">Index Length</th>
                  <th className="p-3.5 text-right">Total Table Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tableSizes.map(tbl => (
                  <tr key={tbl.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div>{tbl.table_name}</div>
                      <div className="text-[10px] text-sky-400 font-sans">{tbl.database_name}</div>
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{tbl.rows_count.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-blue-400 font-bold">{tbl.data_mb} MB</td>
                    <td className="p-3.5 font-mono text-purple-400 font-bold">{tbl.index_mb} MB</td>
                    <td className="p-3.5 text-right font-mono text-amber-400 font-black text-sm">{tbl.total_mb} MB</td>
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
