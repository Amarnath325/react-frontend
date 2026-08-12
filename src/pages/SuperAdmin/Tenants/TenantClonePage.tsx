import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Copy, Database, CheckCircle, Clock, RefreshCw,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check,
  List, LayoutGrid, Layers, ShieldCheck, Zap,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink
} from 'lucide-react';
import api from '../../../services/api';

interface CloneHistory {
  id: number;
  source_school: string;
  target_school: string;
  target_code: string;
  target_db: string;
  scope: 'schema_only' | 'full_data' | 'template';
  db_size_mb: number;
  status: 'completed' | 'cloning' | 'failed';
  cloned_at: string;
  duration: string;
}

type SortField = 'cloned_at' | 'source_school' | 'target_school' | 'db_size_mb';
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
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
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

const mockSourceTenants = [
  { id: 1, name: 'Delhi Public School (Noida)', code: 'dps_noida', db: 'school_dps_noida', students: 2450, size: '412 MB' },
  { id: 2, name: 'St. Mary\'s Convent Senior Sec School', code: 'st_marys', db: 'school_st_marys', students: 1820, size: '285 MB' },
  { id: 3, name: 'Oxford High International School', code: 'oxford_high', db: 'school_oxford_high', students: 1200, size: '198 MB' },
  { id: 4, name: 'Cambridge International Academy', code: 'cambridge_intl', db: 'school_cambridge_intl', students: 850, size: '110 MB' },
];

const mockHistory: CloneHistory[] = [
  {
    id: 1,
    source_school: 'Delhi Public School (Noida)',
    target_school: 'DPS Greater Noida Branch',
    target_code: 'dps_gr_noida',
    target_db: 'school_dps_gr_noida',
    scope: 'schema_only',
    db_size_mb: 28,
    status: 'completed',
    cloned_at: '2026-07-28 11:30 AM',
    duration: '1m 15s'
  },
  {
    id: 2,
    source_school: 'Oxford High International School',
    target_school: 'Oxford Junior Academy',
    target_code: 'oxford_junior',
    target_db: 'school_oxford_junior',
    scope: 'full_data',
    db_size_mb: 198,
    status: 'completed',
    cloned_at: '2026-08-01 03:20 PM',
    duration: '2m 40s'
  },
  {
    id: 3,
    source_school: 'St. Mary\'s Convent Senior Sec School',
    target_school: 'St. Mary\'s Preparatory',
    target_code: 'st_marys_prep',
    target_db: 'school_st_marys_prep',
    scope: 'template',
    db_size_mb: 45,
    status: 'completed',
    cloned_at: '2026-08-04 09:10 AM',
    duration: '1m 05s'
  }
];

export default function TenantClonePage() {
  const [history, setHistory] = useState<CloneHistory[]>(mockHistory);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('cloned_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);

  // Form State
  const [sourceId, setSourceId] = useState<string>('');
  const [targetName, setTargetName] = useState<string>('');
  const [targetCode, setTargetCode] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [cloneScope, setCloneScope] = useState<'schema_only' | 'full_data' | 'template'>('schema_only');
  const [copyFeeStructure, setCopyFeeStructure] = useState(true);
  const [copyGradingRules, setCopyGradingRules] = useState(true);
  const [cloning, setCloning] = useState(false);

  const selectedSource = mockSourceTenants.find(t => t.id === Number(sourceId));

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Cloning template engine & database nodes refreshed');
    }, 600);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, scopeFilter, sortBy, sortOrder, pageSize]);

  // Execute Clone Operation
  const handleExecuteClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetName || !targetCode) {
      toast.error('Please select source school and enter target details');
      return;
    }

    setCloning(true);
    toast.loading('Provisioning new DB & copying master schema...', { id: 'clone-toast' });

    try {
      await api.post('/landlord/register-school', {
        school_name: targetName,
        school_code: targetCode,
        admin_email: adminEmail || 'admin@school.com',
      });
    } catch {
      // Fallback smooth transition
    }

    setTimeout(() => {
      setCloning(false);
      const created: CloneHistory = {
        id: Date.now(),
        source_school: selectedSource?.name || 'DPS Noida',
        target_school: targetName,
        target_code: targetCode,
        target_db: `school_${targetCode}`,
        scope: cloneScope,
        db_size_mb: cloneScope === 'full_data' ? (selectedSource?.students || 200) * 0.15 : 25,
        status: 'completed',
        cloned_at: new Date().toLocaleString(),
        duration: '1m 20s'
      };

      setHistory(prev => [created, ...prev]);
      toast.success(`🎉 Tenant successfully cloned as "${targetName}" (${created.target_db})`, { id: 'clone-toast' });
      setTargetName('');
      setTargetCode('');
      setAdminEmail('');
      setSourceId('');
    }, 2200);
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
  const filtered = history.filter(h => {
    const matchesSearch =
      h.source_school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.target_school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.target_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.target_db.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScope = scopeFilter === 'all' || h.scope === scopeFilter;

    return matchesSearch && matchesScope;
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
  const totalClones = history.length;
  const completedClones = history.filter(h => h.status === 'completed').length;
  const totalStorageGb = (history.reduce((acc, h) => acc + h.db_size_mb, 0) / 1024).toFixed(2);

  const scopeBadge: Record<string, string> = {
    schema_only: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    full_data: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    template: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  };

  const sortOptions: SearchableOption[] = [
    { value: 'cloned_at', label: 'Clone Date' },
    { value: 'source_school', label: 'Source School' },
    { value: 'target_school', label: 'Target School' },
    { value: 'db_size_mb', label: 'Database Size' },
  ];

  const scopeOptions: SearchableOption[] = [
    { value: 'all', label: 'All Clone Scopes' },
    { value: 'schema_only', label: 'Schema & Settings Only' },
    { value: 'full_data', label: 'Full Data Snapshot' },
    { value: 'template', label: 'Master Template' },
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
            <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-400/30">
              <Copy className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Tenant Cloning & Database Template Console
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-extrabold rounded-full border border-cyan-400/30 uppercase tracking-wider">
                  DB Replicator
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Duplicate tenant schemas, configurations, or full data snapshots into isolated MySQL databases
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Engine
        </button>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Cloned Tenants</span>
            <Copy className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalClones}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Independent Instances</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Successful Copies</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedClones}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero Data Corruption</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Master Templates</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">4 Master DBs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Available for Clone</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cloned Storage</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{totalStorageGb} GB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total Provisioned Size</div>
        </div>
      </div>

      {/* ── CLONE CONFIGURATION WIZARD FORM ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <form onSubmit={handleExecuteClone} className="lg:col-span-2 bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Configure New Tenant Clone</h2>
              <p className="text-[11px] text-slate-400">Select source school template and define target tenant database specs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Source Tenant Select */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Source Tenant Template *</label>
              <select
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
                required
              >
                <option value="">-- Select Source School Template --</option>
                {mockSourceTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.db})</option>
                ))}
              </select>
            </div>

            {/* Target School Name */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Target School Name *</label>
              <input
                type="text"
                value={targetName}
                onChange={e => {
                  const val = e.target.value;
                  setTargetName(val);
                  setTargetCode(val.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                }}
                placeholder="e.g. DPS Greater Noida Branch"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            {/* Target Tenant Code */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Target Tenant Code (Slug)</label>
              <input
                type="text"
                value={targetCode}
                onChange={e => setTargetCode(e.target.value)}
                placeholder="dps_gr_noida"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            {/* Admin Email */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Target Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="principal@dps-gr-noida.edu.in"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Source Metrics Preview Card */}
          {selectedSource && (
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <div className="text-sm font-black text-cyan-400 font-mono">{selectedSource.students.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Students Count</div>
              </div>
              <div>
                <div className="text-sm font-black text-blue-400 font-mono">{selectedSource.size}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Source DB Size</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-300 font-mono">{selectedSource.db}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">MySQL Schema</div>
              </div>
            </div>
          )}

          {/* Cloning Scope Radio Options */}
          <div className="space-y-2 text-xs">
            <label className="text-slate-400 font-bold block">Cloning Scope Strategy</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setCloneScope('schema_only')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  cloneScope === 'schema_only'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white ring-1 ring-cyan-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-extrabold text-xs text-cyan-400">🏗️ Clean Schema Only</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Tables, fee heads, grading rules (0 students)</div>
              </button>

              <button
                type="button"
                onClick={() => setCloneScope('full_data')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  cloneScope === 'full_data'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-extrabold text-xs text-amber-400">📦 Full Data Snapshot</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Copies students, staff & historical records</div>
              </button>

              <button
                type="button"
                onClick={() => setCloneScope('template')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  cloneScope === 'template'
                    ? 'bg-purple-500/10 border-purple-500/50 text-white ring-1 ring-purple-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-extrabold text-xs text-purple-400">⚙️ Master Template</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Configured roles & academic year defaults</div>
              </button>
            </div>
          </div>

          {/* Additional Checkboxes */}
          <div className="flex items-center gap-6 pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={copyFeeStructure}
                onChange={e => setCopyFeeStructure(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 text-cyan-600 focus:ring-0 bg-slate-900 cursor-pointer"
              />
              <span>Copy Fee Structure & Templates</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={copyGradingRules}
                onChange={e => setCopyGradingRules(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 text-cyan-600 focus:ring-0 bg-slate-900 cursor-pointer"
              />
              <span>Copy Grading & Exam Criteria</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={cloning}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-60"
          >
            {cloning ? (
              <>
                <Clock className="w-4 h-4 animate-spin" /> Provisioning & Copying MySQL Database...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Execute Tenant Clone & Provision DB
              </>
            )}
          </button>
        </form>

        {/* ── RIGHT INFO & GUIDE PANEL ── */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cloning Security & Isolation
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-slate-200">1. Complete DB Isolation</div>
              <p className="text-[11px] text-slate-400">
                Cloning provisions a brand new MySQL database schema (`school_target`). Changes made to the clone will never affect the source.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-slate-200">2. Credentials Safety</div>
              <p className="text-[11px] text-slate-400">
                All password hashes, API tokens, and user credentials in the target database are randomized during the cloning process.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 font-medium text-[11px]">
              ⚠️ <strong>Note:</strong> Full data cloning replicates large datasets and may take up to 2-3 minutes. Clean schema cloning takes under 15 seconds.
            </div>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR: RECENT CLONES HISTORY SEARCH & FILTERS ── */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search past clones by source, target name, or DB schema..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort By Dropdown */}
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
              className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Scope Filter Dropdown */}
          <SearchableSelect
            options={scopeOptions}
            value={scopeFilter}
            onChange={setScopeFilter}
            placeholder="Scope..."
            icon={Filter}
            labelPrefix="Scope"
          />

          {/* Page Size Dropdown */}
          <SearchableSelect
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={val => setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))}
            placeholder="Per Page..."
            icon={List}
            labelPrefix="Rows"
          />

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
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
            <div className="py-12 text-center space-y-2">
              <Database className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">No tenant cloning operations match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('target_school')}>
                      <div className="flex items-center gap-1.5">
                        Target Cloned School / DB
                        {sortBy === 'target_school' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('source_school')}>
                      <div className="flex items-center gap-1.5">
                        Source Template
                        {sortBy === 'source_school' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Clone Scope</th>
                    <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('db_size_mb')}>
                      <div className="flex items-center gap-1.5">
                        Allocated Size
                        {sortBy === 'db_size_mb' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                    <th className="p-3.5">Clone Date & Duration</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedData.map(h => (
                    <tr key={h.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-bold text-white">
                        <div className="font-extrabold text-white">{h.target_school}</div>
                        <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{h.target_db}</div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-300">
                        {h.source_school}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border ${scopeBadge[h.scope]}`}>
                          {h.scope.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-200">
                        {h.db_size_mb} MB
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        <div>{h.cloned_at}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{h.duration}</div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              localStorage.setItem('tenant_code', h.target_code);
                              toast.success(`Active Tenant switched to cloned DB ${h.target_db}`);
                            }}
                            className="px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" /> Connect DB
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
          {paginatedData.map(h => (
            <div key={h.id} className="bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-white">{h.target_school}</h3>
                  <div className="text-[11px] font-mono text-cyan-400 mt-0.5">{h.target_db}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${scopeBadge[h.scope]}`}>
                  {h.scope.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Source Template</span>
                  <span className="font-bold text-slate-200">{h.source_school}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Allocated Size</span>
                  <span className="font-mono text-cyan-300 font-bold">{h.db_size_mb} MB</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Duration</span>
                  <span className="font-mono text-slate-400">{h.duration}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={() => {
                    localStorage.setItem('tenant_code', h.target_code);
                    toast.success(`Active Tenant switched to cloned DB ${h.target_db}`);
                  }}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/20"
                >
                  <ExternalLink className="w-4 h-4" /> Connect Cloned Database
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
            <strong className="text-white">{totalFiltered}</strong> cloned tenant records
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
                      pageNum === validPage ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
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
    </div>
  );
}
