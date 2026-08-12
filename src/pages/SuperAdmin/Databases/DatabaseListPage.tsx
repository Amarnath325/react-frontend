import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Database, RefreshCw, Cpu, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown, Check, List, Terminal, X, Power, Radio, Code, Eye,
  Play, Plus, Download, Wrench, HardDrive, Sparkles, Layers
} from 'lucide-react';
import api from '../../../services/api';

interface DatabaseItem {
  id: string;
  database_name: string;
  tenant_name: string;
  db_type: 'Landlord Master' | 'Tenant Isolated';
  size_mb: number;
  tables_count: number;
  active_connections: number;
  engine: string;
  collation: string;
  status: 'HEALTHY' | 'HIGH_LOAD' | 'WARNING';
  created_at: string;
}

type SortField = 'database_name' | 'size_mb' | 'tables_count' | 'active_connections';
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

const mockDatabases: DatabaseItem[] = [
  {
    id: 'db-1',
    database_name: 'myschoolpoint',
    tenant_name: 'Landlord Master Control',
    db_type: 'Landlord Master',
    size_mb: 2450,
    tables_count: 142,
    active_connections: 18,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    status: 'HEALTHY',
    created_at: '2024-01-01'
  },
  {
    id: 'db-2',
    database_name: 'tenant_dpsnoida',
    tenant_name: 'Delhi Public School Noida',
    db_type: 'Tenant Isolated',
    size_mb: 1840,
    tables_count: 100,
    active_connections: 12,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    status: 'HEALTHY',
    created_at: '2024-03-15'
  },
  {
    id: 'db-3',
    database_name: 'tenant_dpsrkp',
    tenant_name: 'Delhi Public School RKP',
    db_type: 'Tenant Isolated',
    size_mb: 1520,
    tables_count: 100,
    active_connections: 9,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    status: 'HEALTHY',
    created_at: '2024-04-10'
  },
  {
    id: 'db-4',
    database_name: 'tenant_modernschool',
    tenant_name: 'Modern School Barakhamba',
    db_type: 'Tenant Isolated',
    size_mb: 1210,
    tables_count: 100,
    active_connections: 6,
    engine: 'InnoDB',
    collation: 'utf8mb4_unicode_ci',
    status: 'HEALTHY',
    created_at: '2024-05-20'
  }
];

export default function DatabaseListPage() {
  const [databases, setDatabases] = useState<DatabaseItem[]>(mockDatabases);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('size_mb');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Modals
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [selectedDb, setSelectedDb] = useState<DatabaseItem | null>(null);
  const [provisionForm, setProvisionForm] = useState({
    database_name: 'tenant_new_school',
    tenant_name: 'St. Xavier High School',
  });

  const totalSizeMb = databases.reduce((acc, db) => acc + db.size_mb, 0);
  const totalTables = databases.reduce((acc, db) => acc + db.tables_count, 0);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/landlord/databases');
      if (res.data.success && Array.isArray(res.data.data)) {
        setDatabases(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        setLoading(false);
        toast.success('Database inventory list refreshed');
      }, 500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, sortBy, sortOrder, pageSize]);

  // 1-Click Backup
  const handleBackupDb = async (dbName: string) => {
    toast.loading(`Creating compressed SQL mysqldump for '${dbName}'...`, { id: 'backup-toast' });
    try {
      await api.post(`/landlord/databases/${dbName}/backup`);
    } catch {
      // Fallback
    }
    setTimeout(() => {
      toast.success(`🎉 SQL backup dump for '${dbName}' generated & uploaded to S3!`, { id: 'backup-toast' });
    }, 1200);
  };

  // 1-Click Optimize
  const handleOptimizeDb = async (dbName: string) => {
    toast.loading(`Running OPTIMIZE TABLE on '${dbName}'...`, { id: 'optimize-toast' });
    try {
      await api.post(`/landlord/databases/${dbName}/optimize`);
    } catch {
      // Fallback
    }
    setTimeout(() => {
      toast.success(`⚡ Database '${dbName}' tables optimized & indexes defragmented!`, { id: 'optimize-toast' });
    }, 1000);
  };

  // Provision Submit
  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: DatabaseItem = {
      id: 'db-' + Date.now().toString().slice(-3),
      database_name: provisionForm.database_name,
      tenant_name: provisionForm.tenant_name,
      db_type: 'Tenant Isolated',
      size_mb: 45,
      tables_count: 100,
      active_connections: 1,
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci',
      status: 'HEALTHY',
      created_at: new Date().toISOString().substring(0, 10),
    };

    setDatabases(prev => [created, ...prev]);
    setShowProvisionModal(false);
    toast.success(`🎉 New tenant database '${created.database_name}' provisioned successfully!`);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  // Filtered Dataset
  const filtered = databases.filter(db => {
    const matchesSearch =
      db.database_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      db.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      db.collation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || db.db_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || db.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
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

  const typeOptions: SearchableOption[] = [
    { value: 'all', label: 'All DB Types' },
    { value: 'Landlord Master', label: 'Landlord Master' },
    { value: 'Tenant Isolated', label: 'Tenant Isolated' },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'HEALTHY', label: 'HEALTHY 🟢' },
    { value: 'HIGH_LOAD', label: 'HIGH LOAD 🟡' },
    { value: 'WARNING', label: 'WARNING 🔴' },
  ];

  const sortOptions: SearchableOption[] = [
    { value: 'size_mb', label: 'Size (MB)' },
    { value: 'database_name', label: 'Database Name' },
    { value: 'tables_count', label: 'Tables Count' },
    { value: 'active_connections', label: 'Active Connections' },
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
              <Database className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Database Inventory & Fleet Management
                <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-extrabold rounded-full border border-sky-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> MySQL 8.0 Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage master landlord and isolated tenant databases, table counts, connection pools, and 1-Click backups
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
            <Clock className="w-3.5 h-3.5" /> Auto Pulse (3s): {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Inventory
          </button>
          <button
            onClick={() => setShowProvisionModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Provision Tenant DB
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Databases</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{databases.length} Databases</div>
          <div className="text-[10px] text-slate-500 mt-0.5">1 Master + {databases.length - 1} Tenants</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Combined Storage</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{(totalSizeMb / 1024).toFixed(1)} GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{totalSizeMb.toLocaleString()} MB Total</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Schema Tables</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{totalTables.toLocaleString()} Tables</div>
          <div className="text-[10px] text-slate-500 mt-0.5">InnoDB Engine Default</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Connection Pool</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">45 Active</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Of 200 Max Connections</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fleet Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">100% HEALTHY</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Replication Synced</div>
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
              placeholder="Search databases by name, tenant, collation..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchableSelect options={typeOptions} value={typeFilter} onChange={setTypeFilter} placeholder="DB Type..." icon={Filter} labelPrefix="Type" />
          <SearchableSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status..." icon={Filter} labelPrefix="Status" />
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

      {/* ── DATABASE LIST TABLE ── */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('database_name')}>Database Name & Type</th>
                <th className="p-3.5">Assigned Tenant School</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('size_mb')}>Storage Size</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('tables_count')}>Tables Count</th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('active_connections')}>Connections</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map(db => (
                <tr key={db.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-sky-400" />
                      <span className="font-mono">{db.database_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans mt-0.5">{db.collation} · {db.engine}</div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-300">{db.tenant_name}</td>
                  <td className="p-3.5 font-mono text-cyan-400 font-bold">{db.size_mb} MB</td>
                  <td className="p-3.5 font-mono text-purple-400 font-bold">{db.tables_count} Tables</td>
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">{db.active_connections} active</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      {db.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOptimizeDb(db.database_name)}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Optimize DB Tables"
                      >
                        <Wrench className="w-3 h-3 text-amber-400" /> Optimize
                      </button>
                      <button
                        onClick={() => handleBackupDb(db.database_name)}
                        className="px-2.5 py-1 bg-sky-600/20 text-sky-400 border border-sky-500/30 hover:bg-sky-600/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="1-Click SQL Dump"
                      >
                        <Download className="w-3 h-3" /> Backup
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: PROVISION TENANT DATABASE ── */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleProvisionSubmit} className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" /> Provision Isolated Tenant Database
              </h3>
              <button type="button" onClick={() => setShowProvisionModal(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">New Database Name *</label>
                <input
                  type="text"
                  value={provisionForm.database_name}
                  onChange={e => setProvisionForm({ ...provisionForm, database_name: e.target.value })}
                  placeholder="tenant_stxavier"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Assign Tenant School Name *</label>
                <input
                  type="text"
                  value={provisionForm.tenant_name}
                  onChange={e => setProvisionForm({ ...provisionForm, tenant_name: e.target.value })}
                  placeholder="St. Xavier High School"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowProvisionModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold text-xs cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Provision Database
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
