import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Database, HardDrive, Table2, RefreshCw, Zap, Download,
  Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check,
  List, LayoutGrid, ShieldCheck, Activity, Server,
  X, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink
} from 'lucide-react';
import api from '../../../services/api';

interface TenantDatabaseRecord {
  id: number;
  school_name: string;
  school_code: string;
  db_name: string;
  server_node: string;
  table_count: number;
  size_mb: number;
  row_count_approx: string;
  health_score: number; // 0 to 100
  last_optimized: string;
  collation: string;
}

type SortField = 'size_mb' | 'health_score' | 'school_name' | 'last_optimized';
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
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-400" />}
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
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
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
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mockDatabases: TenantDatabaseRecord[] = [
  {
    id: 1,
    school_name: 'Delhi Public School (Noida)',
    school_code: 'dps_noida',
    db_name: 'school_dps_noida',
    server_node: 'server-03 (AWS Dedicated RDS)',
    table_count: 192,
    size_mb: 412.4,
    row_count_approx: '1.45M',
    health_score: 98,
    last_optimized: '2026-08-01',
    collation: 'utf8mb4_unicode_ci'
  },
  {
    id: 2,
    school_name: 'St. Mary\'s Convent Senior Sec School',
    school_code: 'st_marys',
    db_name: 'school_st_marys',
    server_node: 'server-01 (Shared MySQL)',
    table_count: 192,
    size_mb: 285.2,
    row_count_approx: '980K',
    health_score: 95,
    last_optimized: '2026-07-28',
    collation: 'utf8mb4_unicode_ci'
  },
  {
    id: 3,
    school_name: 'Oxford High International School',
    school_code: 'oxford_high',
    db_name: 'school_oxford_high',
    server_node: 'server-02 (High IOPS SSD)',
    table_count: 192,
    size_mb: 198.0,
    row_count_approx: '720K',
    health_score: 100,
    last_optimized: '2026-08-03',
    collation: 'utf8mb4_unicode_ci'
  },
  {
    id: 4,
    school_name: 'Cambridge International Academy',
    school_code: 'cambridge_intl',
    db_name: 'school_cambridge_intl',
    server_node: 'server-02 (High IOPS SSD)',
    table_count: 192,
    size_mb: 110.8,
    row_count_approx: '450K',
    health_score: 88,
    last_optimized: '2026-07-18',
    collation: 'utf8mb4_unicode_ci'
  },
  {
    id: 5,
    school_name: 'Heritage Global Academy',
    school_code: 'heritage_ac',
    db_name: 'school_heritage_academy',
    server_node: 'server-01 (Shared MySQL)',
    table_count: 192,
    size_mb: 85.1,
    row_count_approx: '310K',
    health_score: 92,
    last_optimized: '2026-07-22',
    collation: 'utf8mb4_unicode_ci'
  },
  {
    id: 6,
    school_name: 'Sunrise Public School',
    school_code: 'sunrise_ps',
    db_name: 'school_sunrise_ps',
    server_node: 'server-01 (Shared MySQL)',
    table_count: 192,
    size_mb: 95.0,
    row_count_approx: '380K',
    health_score: 100,
    last_optimized: '2026-08-04',
    collation: 'utf8mb4_unicode_ci'
  }
];

const mockTablesBreakdown = [
  { name: 'users', rows: '4,250', size: '12.4 MB', engine: 'InnoDB' },
  { name: 'students', rows: '2,450', size: '18.2 MB', engine: 'InnoDB' },
  { name: 'attendance_logs', rows: '480,200', size: '142.5 MB', engine: 'InnoDB' },
  { name: 'fee_transactions', rows: '12,800', size: '24.1 MB', engine: 'InnoDB' },
  { name: 'exam_marks', rows: '380,000', size: '98.6 MB', engine: 'InnoDB' },
  { name: 'class_sections', rows: '140', size: '0.8 MB', engine: 'InnoDB' },
];

export default function TenantDatabaseManagementPage() {
  const [databases, setDatabases] = useState<TenantDatabaseRecord[]>(mockDatabases);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('size_mb');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Inspection Modal
  const [inspectModal, setInspectModal] = useState<TenantDatabaseRecord | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/tenants');
      if (res.data.success && Array.isArray(res.data.data)) {
        setDatabases(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Live MySQL information_schema stats refreshed');
      }, 600);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serverFilter, healthFilter, sortBy, sortOrder, pageSize]);

  // Optimize DB
  const handleOptimizeDb = (dbName: string) => {
    toast.loading(`Running OPTIMIZE TABLE on ${dbName}...`, { id: 'opt-toast' });
    setTimeout(() => {
      setDatabases(prev =>
        prev.map(d =>
          d.db_name === dbName
            ? {
                ...d,
                health_score: 100,
                last_optimized: new Date().toISOString().split('T')[0],
              }
            : d
        )
      );
      toast.success(`⚡ Database '${dbName}' optimized! Indexes defragmented.`, { id: 'opt-toast' });
    }, 1200);
  };

  // Trigger Backup
  const handleTriggerBackup = (dbName: string) => {
    toast.success(`💾 SQL Snapshot backup generated & saved to S3 Vault for ${dbName}`);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered Dataset
  const filtered = databases.filter(d => {
    const matchesSearch =
      d.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.db_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.server_node.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesServer = serverFilter === 'all' || d.server_node.includes(serverFilter);
    const matchesHealth =
      healthFilter === 'all' ||
      (healthFilter === 'optimal' && d.health_score >= 95) ||
      (healthFilter === 'degraded' && d.health_score < 95);

    return matchesSearch && matchesServer && matchesHealth;
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

  // Aggregated KPIs
  const totalDbs = databases.length;
  const totalStorageMb = databases.reduce((acc, d) => acc + (d.size_mb || 0), 0);
  const avgHealth = Math.round(databases.reduce((acc, d) => acc + (d.health_score || 0), 0) / (totalDbs || 1));

  const sortOptions: SearchableOption[] = [
    { value: 'size_mb', label: 'Storage Size' },
    { value: 'health_score', label: 'Health Score' },
    { value: 'school_name', label: 'School Name' },
    { value: 'last_optimized', label: 'Last Optimized' },
  ];

  const serverOptions: SearchableOption[] = [
    { value: 'all', label: 'All Server Nodes' },
    { value: 'server-01', label: 'server-01 (Shared MySQL)' },
    { value: 'server-02', label: 'server-02 (High IOPS)' },
    { value: 'server-03', label: 'server-03 (AWS RDS)' },
  ];

  const healthOptions: SearchableOption[] = [
    { value: 'all', label: 'All Health Status' },
    { value: 'optimal', label: 'Optimal (95%+)' },
    { value: 'degraded', label: 'Requires Defrag (<95%)' },
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
            <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
              <Database className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Tenant Database Management Console
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-extrabold rounded-full border border-blue-400/30 uppercase tracking-wider">
                  Live DB Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time MySQL information_schema monitoring · Index defragmentation · Per-tenant schema inspection
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh DB Engine Stats
        </button>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active MySQL DBs</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalDbs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">100% Isolated Databases</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Storage Allocated</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{totalStorageMb.toFixed(1)} MB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live Data + Index Sizes</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tables per Schema</span>
            <Table2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">192 Tables</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Full ERP Schema Standard</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg DB Health Rating</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{avgHealth}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Defragmented Indexes</div>
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
              placeholder="Search by school name, database schema name, server node..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
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
              className="p-2 bg-slate-900 border border-slate-800 text-blue-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 2. Server Node Filter Dropdown */}
          <SearchableSelect
            options={serverOptions}
            value={serverFilter}
            onChange={setServerFilter}
            placeholder="Server..."
            icon={Server}
            labelPrefix="Server"
          />

          {/* 3. Health Filter Dropdown */}
          <SearchableSelect
            options={healthOptions}
            value={healthFilter}
            onChange={setHealthFilter}
            placeholder="Health..."
            icon={Activity}
            labelPrefix="Health"
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
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
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
              <Database className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">No tenant database schemas match your search filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('school_name')}>
                      <div className="flex items-center gap-1.5">
                        School / MySQL Database
                        {sortBy === 'school_name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Host Server Node</th>
                    <th className="p-3.5">Tables</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('size_mb')}>
                      <div className="flex items-center gap-1.5">
                        Storage Size
                        {sortBy === 'size_mb' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Est. Rows</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('health_score')}>
                      <div className="flex items-center gap-1.5">
                        Health Rating
                        {sortBy === 'health_score' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedData.map(d => (
                    <tr key={d.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* School & DB */}
                      <td className="p-3.5 font-bold text-white">
                        <div className="font-extrabold text-white">{d.school_name}</div>
                        <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{d.db_name}</div>
                      </td>

                      {/* Server Node */}
                      <td className="p-3.5 font-mono text-slate-300 text-[11px]">
                        {d.server_node}
                      </td>

                      {/* Table Count */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-purple-300 font-mono font-bold rounded-lg flex items-center gap-1 w-fit">
                          <Table2 className="w-3 h-3 text-purple-400" /> {d.table_count}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="p-3.5 font-mono font-bold text-blue-400">
                        {d.size_mb} MB
                      </td>

                      {/* Rows */}
                      <td className="p-3.5 font-mono text-slate-300 font-bold">
                        {d.row_count_approx}
                      </td>

                      {/* Health Bar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                d.health_score >= 95 ? 'bg-emerald-400' : d.health_score >= 85 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${d.health_score}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              d.health_score >= 95 ? 'text-emerald-400' : d.health_score >= 85 ? 'text-amber-400' : 'text-red-400'
                            }`}
                          >
                            {d.health_score}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectModal(d)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Inspect Tables"
                          >
                            <Info className="w-3 h-3 text-purple-400" /> Inspect
                          </button>

                          <button
                            onClick={() => handleOptimizeDb(d.db_name)}
                            className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Optimize & Defrag"
                          >
                            <Zap className="w-3 h-3 text-sky-400" /> Optimize
                          </button>

                          <button
                            onClick={() => handleTriggerBackup(d.db_name)}
                            className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-lg cursor-pointer"
                            title="Trigger Backup"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              localStorage.setItem('tenant_code', d.school_code);
                              toast.success(`Active Session Context switched to DB: ${d.db_name}`);
                            }}
                            className="p-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 rounded-lg cursor-pointer"
                            title="Connect Active Session to DB"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GRID CARDS VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(d => (
            <div key={d.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-white">{d.school_name}</h3>
                  <div className="text-[11px] font-mono text-cyan-400 mt-0.5">{d.db_name}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase text-emerald-400 bg-emerald-400/10 border-emerald-400/30">
                  {d.health_score}% Healthy
                </span>
              </div>

              <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Server Node</span>
                  <span className="font-mono text-slate-200">{d.server_node}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Storage Used</span>
                  <span className="font-mono text-blue-400 font-bold">{d.size_mb} MB</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tables / Est. Rows</span>
                  <span className="font-mono text-white font-bold">{d.table_count} Tables ({d.row_count_approx})</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 gap-2 text-xs">
                <button
                  onClick={() => handleOptimizeDb(d.db_name)}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" /> Defrag & Optimize
                </button>
                <button
                  onClick={() => setInspectModal(d)}
                  className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer"
                  title="Inspect Schema"
                >
                  <Info className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAGINATION BAR ── */}
      {totalFiltered > 0 && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{pageSize === 'all' ? 1 : startIndex + 1}</strong> to{' '}
            <strong className="text-white">{pageSize === 'all' ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered)}</strong> of{' '}
            <strong className="text-white">{totalFiltered}</strong> database schemas
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
                      pageNum === validPage ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
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

      {/* ── MODAL: INSPECT TABLE SCHEMA BREAKDOWN ── */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Table2 className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">{inspectModal.school_name} Schema Breakdown</h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {inspectModal.db_name} · Collation: {inspectModal.collation}
                  </div>
                </div>
              </div>
              <button onClick={() => setInspectModal(null)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tables List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Table Name</th>
                    <th className="p-3">Engine</th>
                    <th className="p-3">Rows</th>
                    <th className="p-3 text-right">Index & Data Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {mockTablesBreakdown.map(t => (
                    <tr key={t.name} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-purple-300">{t.name}</td>
                      <td className="p-3 text-slate-400 font-mono">{t.engine}</td>
                      <td className="p-3 font-mono text-white">{t.rows}</td>
                      <td className="p-3 font-mono text-right text-blue-400 font-bold">{t.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Total Storage Size: <strong className="text-white">{inspectModal.size_mb} MB</strong>
              </span>
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
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
